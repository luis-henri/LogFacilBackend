import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Interface para ajudar a montar os dados antes de inserir no banco
interface ParsedRequisicao {
  numero_requisicao: number;
  requisitante_requisicao: string;
  data_requisicao: Date;
  itens: {
    endereco_item_requisicao: string;
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

/**
 * Processa o arquivo .txt enviado e importa as requisições.
 */
export const importFromTxt = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
        res.status(400).json({ message: "Nenhum arquivo foi enviado." });
        return;
    }

    // @ts-ignore - Pega o ID do usuário do token (adicionado pelo middleware 'protect')
    const userId = req.user?.userId || 23; // Usar 23 como fallback caso não encontre

    try {
        const conteudoFicheiro = req.file.buffer.toString('utf-8');
        const linhas = conteudoFicheiro.split(/\r?\n/);

        const requisicoesProcessadas: ParsedRequisicao[] = [];
        let requisicaoAtual: Partial<ParsedRequisicao> = {};

        for (const linha of linhas) {
            const matchRequisitante = linha.match(/^Requisitantes:;([^;]+)/);
            const matchRequisicaoNum = linha.match(/^Requisição:;(\d+)/);
            const matchDataHora = linha.match(/^;;;Tribunal Regional Eleitoral de Pernambuco- TRE\/PE;;;;;;([\d\/]+\s[\d:]+)/);
            const matchItem = linha.match(/^(\d+);;(\d+);;([A-Z]{2,3});(.*?);/);

            if (matchRequisitante) {
                if (requisicaoAtual.numero_requisicao) {
                    requisicoesProcessadas.push(requisicaoAtual as ParsedRequisicao);
                }
                requisicaoAtual = { requisitante_requisicao: matchRequisitante[1].trim(), itens: [] };
            } else if (matchRequisicaoNum && requisicaoAtual) {
                requisicaoAtual.numero_requisicao = parseInt(matchRequisicaoNum[1], 10);
            } else if (matchDataHora && requisicaoAtual) {
                requisicaoAtual.data_requisicao = parseDate(matchDataHora[1].trim()) ?? new Date();
            } else if (matchItem && requisicaoAtual.itens) {
                requisicaoAtual.itens.push({
                    endereco_item_requisicao: matchItem[1],
                    quantidade_solicitada_item_requisicao: parseInt(matchItem[2], 10),
                    unidade_material_item_requisicao: matchItem[3],
                    descricao_material_item_requisicao: matchItem[4].trim(),
                });
            }
        }
        if (requisicaoAtual.numero_requisicao) {
            requisicoesProcessadas.push(requisicaoAtual as ParsedRequisicao);
        }

        await prisma.$transaction(async (tx) => {
            for (const req of requisicoesProcessadas) {
                await tx.requisicao.create({
                    data: {
                        numero_requisicao: req.numero_requisicao,
                        requisitante_requisicao: req.requisitante_requisicao,
                        data_requisicao: req.data_requisicao,
                        id_usuario: userId,
                        id_situacao_requisicao: 1,
                        prioridade_requisicao: false,
                        itens: {
                            create: req.itens,
                        },
                    },
                });
            }
        });

        res.status(201).json({ message: `Importação concluída! ${requisicoesProcessadas.length} requisições processadas.` });

    } catch (error) {
        console.error("Erro na importação via API:", error);
        res.status(500).json({ message: "Erro no servidor durante a importação." });
    }
};

/**
 * Busca todas as requisições (função geral).
 */
export const getAllRequisicoes = async (req: Request, res: Response): Promise<void> => {
    try {
        const requisicoes = await prisma.requisicao.findMany({
            include: { situacao: true, tipo_envio: true, itens: true },
            orderBy: { data_cadastro_requisicao: 'desc' }
        });
        res.json(requisicoes);
    } catch (error) {
        console.error("Erro ao buscar requisições:", error);
        res.status(500).json({ message: "Erro ao buscar requisições." });
    }
};

/**
 * Busca uma requisição específica pelo seu ID.
 */
export const getRequisicaoById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const requisicao = await prisma.requisicao.findUnique({
            where: { id_requisicao: Number(id) },
            include: { itens: true, situacao: true, tipo_envio: true, volumes: true },
        });
        if (!requisicao) {
            res.status(404).json({ message: 'Requisição não encontrada' });
            return;
        }
        res.status(200).json(requisicao);
    } catch (error) {
        console.error("Erro ao buscar detalhes da requisição:", error);
        res.status(500).json({ message: "Erro interno ao buscar detalhes da requisição." });
    }
};

/**
 * Busca requisições filtrando por um status específico.
 */
export const getRequisicoesPorStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.params;
        const statusMap: { [key: string]: number } = {
            'pendente': 1,
            'em-atendimento': 2,
            'em-separacao': 3,
            'em-conferencia': 4,
            'em-embalagem': 5,
            'em-expedicao': 6,
            'concluida': 7,
            'cancelada': 8
        };
        const statusId = statusMap[status.toLowerCase()];

        if (!statusId) {
            res.status(400).json({ message: "Status inválido." });
            return;
        }

        const requisicoes = await prisma.requisicao.findMany({
            where: { id_situacao_requisicao: statusId },
            include: { situacao: true, tipo_envio: true, itens: true },
            orderBy: [ 
                { prioridade_requisicao: 'desc'}, 
                { data_cadastro_requisicao: 'asc' }
            ]
        });
        res.json(requisicoes);
    } catch (error) {
        console.error(`Erro ao buscar requisições por status (${req.params.status}):`, error);
        res.status(500).json({ message: "Erro ao buscar requisições." });
    }
};

/**
 * Busca requisições para a tela de monitoramento.
 */
export const getMonitoramentoRequisicoes = async (req: Request, res: Response): Promise<void> => {
    try {
        const requisicoes = await prisma.requisicao.findMany({
            include: { 
                situacao: true, 
                tipo_envio: true, 
                itens: true
            },
            orderBy: { data_cadastro_requisicao: 'asc' }
        });
        res.json(requisicoes);
    } catch (error) {
        console.error("Erro ao buscar requisições para monitoramento:", error);
        res.status(500).json({ message: "Erro ao buscar requisições para monitoramento." });
    }
};

/**
 * Atualiza uma requisição existente (status, prioridade, etc.).
 */
export const updateRequisicao = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const requisicaoId = parseInt(id, 10);
        // Desestrutura o corpo do pedido para separar as diferentes partes
        const { status, itens, volumes, ...otherData } = req.body;

        // Cria um objeto de dados para atualização apenas com os campos válidos
        const dataToUpdate: any = { ...otherData };

        // Se um 'status' (string) for enviado, ele é traduzido para o campo e ID corretos
        if (status) {
            const statusMap: { [key: string]: number } = {
                'pendente': 1, 'em-atendimento': 2, 'em-separacao': 3,
                'em-conferencia': 4, 'em-embalagem': 5, 'em-expedicao': 6,
                'concluida': 7, 'cancelada': 8
            };
            const statusId = statusMap[status.toLowerCase()];
            if (!statusId) {
                res.status(400).json({ message: `Status '${status}' é inválido.` });
                return;
            }
            // Adiciona o campo correto (id_situacao_requisicao) ao objeto de atualização
            dataToUpdate.id_situacao_requisicao = statusId;
        }
        
        // Usa uma transação para garantir que todas as atualizações aconteçam ou nenhuma aconteça
        await prisma.$transaction(async (tx) => {
            // Passo 1: Atualiza os dados principais da requisição (como status, tipo de envio, etc.)
            await tx.requisicao.update({
                where: { id_requisicao: requisicaoId },
                data: dataToUpdate,
            });
            
            // Passo 2: Se forem enviados dados de itens, atualiza cada um
            if (itens && Array.isArray(itens)) {
                for (const item of itens) {
                    await tx.itemRequisicao.update({
                        where: { id_item_requisicao: item.id_item_requisicao },
                        data: { 
                            quantidade_atendida_item_requisicao: item.quantidade_atendida_item_requisicao 
                        },
                    });
                }
            }

            // Passo 3: Se forem enviados dados de volumes, apaga os antigos e cria os novos
            if (volumes && Array.isArray(volumes)) {
                await tx.volume.deleteMany({ where: { id_requisicao: requisicaoId } });
                await tx.volume.createMany({
                    data: volumes.map((v: any) => ({
                        id_requisicao: requisicaoId,
                        comprimento: parseFloat(v.comprimento) || 0,
                        largura: parseFloat(v.largura) || 0,
                        altura: parseFloat(v.altura) || 0,
                        peso: parseFloat(v.peso) || 0
                    }))
                });
            }
        });

        // Após a atualização bem-sucedida, busca a requisição completa e a envia de volta
        const requisicaoAtualizada = await prisma.requisicao.findUnique({
            where: { id_requisicao: requisicaoId },
            include: { itens: true, situacao: true, tipo_envio: true, volumes: true }
        });

        res.status(200).json(requisicaoAtualizada);
    } catch (error) {
        console.error(`Erro ao atualizar requisição ${req.params.id}:`, error);
        res.status(500).json({ message: "Erro ao atualizar requisição." });
    }
};

export const getTiposEnvio = async (req: Request, res: Response): Promise<void> => {
    try {
        const tiposEnvio = await prisma.tipoEnvioRequisicao.findMany({
            where: { ativa_tipo_envio_requisicao: true }
        });
        res.json(tiposEnvio);
    } catch (error) {
        console.error("Erro ao buscar tipos de envio:", error);
        res.status(500).json({ message: "Erro ao buscar tipos de envio." });
    }
};

/**
 * Alterna o status de prioridade de uma requisição.
 */
export const togglePrioridade = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const requisicaoId = parseInt(id, 10);
        const requisicaoAtual = await prisma.requisicao.findUnique({ where: { id_requisicao: requisicaoId } });
        if (!requisicaoAtual) {
            res.status(404).json({ message: 'Requisição não encontrada.' });
            return;
        }
        const requisicaoAtualizada = await prisma.requisicao.update({
            where: { id_requisicao: requisicaoId },
            data: { prioridade_requisicao: !requisicaoAtual.prioridade_requisicao },
        });
        res.json(requisicaoAtualizada); 
    } catch (error) {
        console.error("Erro ao alterar prioridade:", error);
        res.status(500).json({ message: "Erro ao alterar prioridade da requisição." });
    }
};