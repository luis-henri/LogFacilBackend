import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interface para ajudar a montar os dados antes de inserir no banco
interface ParsedRequisicao {
  numero_requisicao: number;
  requisitante_requisicao: string;
  almoxarifado_requisicao?: string;
  data_requisicao: Date;
  itens: {
    quantidade_solicitada_item_requisicao: number;
    unidade_material_item_requisicao: string;
    descricao_material_item_requisicao: string;
  }[];
}

// Função auxiliar para converter data no formato DD/MM/AAAA HH:mm:ss para um objeto Date
function parseDate(dateString: string): Date | null {
  try {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    if (isNaN(parseInt(day)) || isNaN(parseInt(month)) || isNaN(parseInt(year))) {
      return null;
    }
    return new Date(`${year}-${month}-${day}T${timePart}`);
  } catch (e) {
    console.warn(`Formato de data inválido encontrado: ${dateString}`);
    return null;
  }
}

async function importar() {
  console.log('A iniciar a importação avançada do ficheiro de relatório...');

  try {
    await prisma.$connect();
    console.log('Ligado ao banco de dados com sucesso.');

    console.log('A limpar as tabelas de requisições e itens existentes...');
    await prisma.itemRequisicao.deleteMany({});
    await prisma.requisicao.deleteMany({});
    console.log('Tabelas limpas.');

    const caminhoFicheiro = path.join(process.cwd(), 'AX0273 - NOTIFICACAO DE BAIXA.txt');
    if (!fs.existsSync(caminhoFicheiro)) {
      throw new Error(`Ficheiro não encontrado em ${caminhoFicheiro}`);
    }

    const conteudoFicheiro = fs.readFileSync(caminhoFicheiro, 'utf8');
    const linhas = conteudoFicheiro.split(/\r?\n/);

    const requisicoesProcessadas: ParsedRequisicao[] = [];
    let requisicaoAtual: Partial<ParsedRequisicao> = {};

    for (const linha of linhas) {
      // Usa regex para identificar os diferentes tipos de linha
      const matchRequisitante = linha.match(/^Requisitantes:;([^;]+)/);
      const matchRequisicaoNum = linha.match(/^Requisição:;(\d+)/);
      const matchDataHora = linha.match(/^;;;Tribunal Regional Eleitoral de Pernambuco- TRE\/PE;;;;;;([\d\/]+\s[\d:]+)/);
  // Regex simplificada e confiável para capturar "Almoxarifado:;VALOR" em várias formas
  // aceita início de linha ou ponto-e-vírgula antes, espaços e ':' ou ';' como separador
      const matchAlmoxarifado = linha.match(/(?:^|;)\s*almoxarifado\s*[:;]\s*([^;]+)/i);
      const matchItem = linha.match(/^(\d+);;(\d+);;([A-Z]{2,3});(.*?);/);

      if (matchRequisitante) {
        // Se encontrarmos um novo requisitante e a requisição atual já tem dados,
        // guardamos a anterior e começamos uma nova.
        if (requisicaoAtual.numero_requisicao) {
          requisicoesProcessadas.push(requisicaoAtual as ParsedRequisicao);
        }
        requisicaoAtual = { requisitante_requisicao: matchRequisitante[1].trim(), itens: [] };
      } else if (matchAlmoxarifado && requisicaoAtual) {
        // captura o nome do almoxarifado na linha, normaliza espaços
        const raw = matchAlmoxarifado[1].trim();
        const normalized = raw.replace(/\s+/g, ' ');
        requisicaoAtual.almoxarifado_requisicao = normalized;
        console.log(`Almoxarifado capturado (regex): "${normalized}"`);
      } else if (linha.toLowerCase().includes('almoxarifado') && requisicaoAtual && !requisicaoAtual.almoxarifado_requisicao) {
        // Fallback: tenta extrair o valor dividindo por ';' e pegando o token após o rótulo
        const parts = linha.split(';').map(p => p.trim()).filter(p => p.length > 0);
        // procura o índice do token que contém 'almoxarifado'
        const idx = parts.findIndex(p => p.toLowerCase().includes('almoxarifado'));
        if (idx >= 0 && parts.length > idx + 1) {
          const rawFallback = parts[idx + 1];
          const normalizedFallback = rawFallback.replace(/\s+/g, ' ');
          requisicaoAtual.almoxarifado_requisicao = normalizedFallback;
          console.log(`Almoxarifado capturado (fallback): "${normalizedFallback}" -- linha: "${linha.trim()}"`);
        } else {
          console.log(`Encontrada palavra 'almoxarifado' mas não foi possível extrair valor automaticamente; linha: "${linha.trim()}"`);
          // adicional: tenta um segundo fallback simples: pega tudo após o primeiro ':' ou ';'
          const m2 = linha.match(/[:;]\s*(.+)$/);
          if (m2 && m2[1]) {
            const try2 = m2[1].split(';')[0].trim().replace(/\s+/g, ' ');
            if (try2.length > 0) {
              requisicaoAtual.almoxarifado_requisicao = try2;
              console.log(`Almoxarifado capturado (fallback2): "${try2}" -- linha: "${linha.trim()}"`);
            }
          }
        }
      } else if (matchRequisicaoNum && requisicaoAtual) {
        requisicaoAtual.numero_requisicao = parseInt(matchRequisicaoNum[1], 10);
      } else if (matchDataHora && requisicaoAtual) {
        requisicaoAtual.data_requisicao = parseDate(matchDataHora[1].trim()) ?? new Date();
      } else if (matchItem && requisicaoAtual.itens) {
        requisicaoAtual.itens.push({
          quantidade_solicitada_item_requisicao: parseInt(matchItem[2], 10),
          unidade_material_item_requisicao: matchItem[3],
          descricao_material_item_requisicao: matchItem[4].trim(),
        });
      }
    }
    // Adiciona a última requisição processada à lista
    if (requisicaoAtual.numero_requisicao) {
      requisicoesProcessadas.push(requisicaoAtual as ParsedRequisicao);
    }

    console.log(`Processamento concluído. ${requisicoesProcessadas.length} requisições encontradas para inserir.`);

    // Antes de inserir, verifique quais requisições já existem no banco
    const numeros = requisicoesProcessadas
      .map(r => r.numero_requisicao)
      .filter((n): n is number => typeof n === 'number');

    const existentes = await prisma.requisicao.findMany({
      where: { numero_requisicao: { in: numeros } },
      select: { numero_requisicao: true },
    });

    const existentesSet = new Set(existentes.map(e => e.numero_requisicao));
    const novos = requisicoesProcessadas.filter(r => !existentesSet.has(r.numero_requisicao));

    console.log(`${existentes.length} requisições já existentes encontradas no banco.`);
    console.log(`${novos.length} requisições novas serão importadas.`);

    if (novos.length === 0) {
      console.log('Nenhuma nova requisição para importar. Operação finalizada.');
    }

    // Insere apenas as requisições não existentes
    for (const req of novos) {
      console.log(`A inserir requisição nº: ${req.numero_requisicao} com ${req.itens.length} itens.`);
      await prisma.requisicao.create({
        data: {
          numero_requisicao: req.numero_requisicao,
          requisitante_requisicao: req.requisitante_requisicao,
          almoxarifado_requisicao: req.almoxarifado_requisicao || undefined,
          data_requisicao: req.data_requisicao,
          id_usuario: 23,
          id_situacao_requisicao: 1,
          prioridade_requisicao: false,
          itens: {
            create: req.itens,
          },
        },
      });
    }

    console.log('Importação concluída com sucesso!');

  } catch (error) {
    console.error('Ocorreu um erro durante a importação:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Ligação ao banco de dados fechada.');
  }
}

importar();