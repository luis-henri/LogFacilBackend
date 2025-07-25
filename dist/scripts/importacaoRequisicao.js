"use strict";
// Salve este ficheiro como: src/scripts/importar-requisicoes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Função auxiliar para converter data no formato DD/MM/AAAA HH:mm:ss para um objeto Date
function parseDate(dateString) {
    try {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('/');
        // Valida se as partes da data são números válidos
        if (isNaN(parseInt(day)) || isNaN(parseInt(month)) || isNaN(parseInt(year))) {
            return null;
        }
        return new Date(`${year}-${month}-${day}T${timePart}`);
    }
    catch (e) {
        console.warn(`Formato de data inválido encontrado: ${dateString}`);
        return null;
    }
}
async function importar() {
    console.log('A iniciar a importação avançada do ficheiro de relatório...');
    try {
        await prisma.$connect();
        console.log('Ligado ao banco de dados com sucesso.');
        // Limpa as tabelas para evitar duplicados
        console.log('A limpar as tabelas de requisições e itens existentes...');
        await prisma.itemRequisicao.deleteMany({});
        await prisma.requisicao.deleteMany({});
        console.log('Tabelas limpas.');
        const caminhoFicheiro = path_1.default.join(process.cwd(), 'AX0273 - NOTIFICACAO DE BAIXA.txt');
        if (!fs_1.default.existsSync(caminhoFicheiro)) {
            throw new Error(`Ficheiro não encontrado em ${caminhoFicheiro}`);
        }
        const conteudoFicheiro = fs_1.default.readFileSync(caminhoFicheiro, 'utf8');
        // Usa a linha final como o separador entre cada requisição.
        const blocos = conteudoFicheiro.split(/AX0273-AX0273\.jasper.*Página \d+ de \d+/);
        console.log(`Encontrados ${blocos.length - 1} blocos de requisição para processar.`);
        for (const bloco of blocos) {
            if (bloco.trim() === '')
                continue;
            // Usar expressões regulares para extrair os dados de forma mais fiável
            const matchRequisicao = bloco.match(/Requisição:;(\d+)/);
            const matchRequisitante = bloco.match(/Requisitantes:;([^;]+)/);
            const matchDataHora = bloco.match(/TRE\/PE;;;;;;([\d\/]+\s[\d:]+)/);
            if (!matchRequisicao || !matchRequisitante || !matchDataHora) {
                console.warn('Bloco ignorado por não conter os dados de cabeçalho necessários.');
                continue;
            }
            const numero_requisicao = parseInt(matchRequisicao[1], 10);
            const requisitante_requisicao = matchRequisitante[1].trim();
            const data_requisicao = parseDate(matchDataHora[1]);
            if (!data_requisicao) {
                console.warn(`Requisição nº ${numero_requisicao} ignorada devido a data inválida.`);
                continue;
            }
            // Extrair os itens da requisição
            const itensParaCriar = [];
            // Regex melhorada para capturar apenas as linhas que são claramente itens
            const linhasItens = bloco.matchAll(/^(\d+);;(\d+);;([A-Z]{2,3});(.*?);/gm);
            for (const matchItem of linhasItens) {
                itensParaCriar.push({
                    quantidade_solicitada_item_requisicao: parseInt(matchItem[2], 10),
                    unidade_material_item_requisicao: matchItem[3],
                    descricao_material_item_requisicao: matchItem[4].trim(),
                });
            }
            console.log(`A inserir requisição nº: ${numero_requisicao} com ${itensParaCriar.length} itens.`);
            // Usar uma transação aninhada do Prisma para criar a requisição e seus itens de uma só vez
            await prisma.requisicao.create({
                data: {
                    numero_requisicao: numero_requisicao,
                    requisitante_requisicao: requisitante_requisicao,
                    data_requisicao: data_requisicao,
                    // Valores padrão
                    id_usuario: 23, // Requer que um usuário com ID 23 exista
                    id_situacao_requisicao: 1, // Requer que uma situação com ID 1 exista
                    prioridade_requisicao: false,
                    // Cria os itens relacionados
                    itens: {
                        create: itensParaCriar,
                    },
                },
            });
        }
        console.log('Importação concluída com sucesso!');
    }
    catch (error) {
        console.error('Ocorreu um erro durante a importação:', error);
    }
    finally {
        await prisma.$disconnect();
        console.log('Ligação ao banco de dados fechada.');
    }
}
importar();
