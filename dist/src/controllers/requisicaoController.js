"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePrioridade = exports.getTiposEnvio = exports.updateRequisicao = exports.getMonitoramentoRequisicoes = exports.getRequisicoesPorStatus = exports.getRequisicaoById = exports.getAllRequisicoes = exports.importFromTxt = void 0;
const prisma_1 = require("../lib/prisma");
const sync_1 = require("csv-parse/sync");
// Função auxiliar para converter data no formato DD/MM/AAAA HH:mm:ss para um objeto Date
function parseDate(dateString) {
    try {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('/');
        if (isNaN(parseInt(day)) || isNaN(parseInt(month)) || isNaN(parseInt(year))) {
            return null;
        }
        const date = new Date(`${year}-${month}-${day}T${timePart}`);
        // Ajusta para timezone de São Paulo (UTC-3)
        date.setHours(date.getHours() - 3);
        return date;
    }
    catch (e) {
        console.warn(`Formato de data inválido encontrado: ${dateString}`);
        return null;
    }
}
/**
 * Processa o arquivo .txt enviado e importa as requisições.
 */
const importFromTxt = async (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: "Nenhum arquivo foi enviado." });
        return;
    }
    // @ts-ignore - Pega o ID do usuário do token (adicionado pelo middleware 'protect')
    const userId = req.user?.userId || 23; // Usar 23 como fallback caso não encontre
    const situacaoQuery = req.query.situacao;
    const idSituacao = situacaoQuery ? parseInt(situacaoQuery, 10) : 1;
    try {
        const conteudoFicheiro = req.file.buffer.toString('utf-8');
        // Usar csv-parse para dividir em colunas por ';'
        const records = (0, sync_1.parse)(conteudoFicheiro, {
            delimiter: ';',
            relax_column_count: true,
            skip_empty_lines: true,
            trim: false,
        });
        const requisicoesProcessadas = [];
        let requisicaoAtual = { itens: [] };
        // Captura a data global do arquivo (primeira ocorrência com hora completa)
        let dataGlobalArquivo = null;
        for (const r of records) {
            const rowStr = r.join(';');
            const dateMatch = rowStr.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/);
            if (dateMatch && dateMatch[1]) {
                dataGlobalArquivo = parseDate(dateMatch[1].trim());
                console.log(`[DEBUG] Data global do arquivo capturada: ${dataGlobalArquivo}`);
                break;
            }
        }
        if (!dataGlobalArquivo) {
            dataGlobalArquivo = new Date(); // Fallback se não encontrar
        }
        function compactRow(row) {
            return row.map(c => (c ?? '').toString()).map(s => s.trim()).filter(s => s.length > 0);
        }
        function tryParseItemFromRow(row) {
            const compact = compactRow(row);
            if (compact.length < 3)
                return null;
            const maybeQuantidade = compact[1];
            const maybeUnidade = compact[2];
            const descricao = compact.slice(3).join(' ');
            if (/^\d+$/.test(compact[0]) && /^\d+$/.test(maybeQuantidade) && /^[A-Z]{1,6}$/i.test(maybeUnidade)) {
                return { endereco: compact[0], quantidade: parseInt(maybeQuantidade, 10), unidade: maybeUnidade, descricao };
            }
            return null;
        }
        for (const row of records) {
            const compact = compactRow(row);
            if (compact.length === 0)
                continue;
            const rowStr = row.join(';');
            // Requisitante
            const reqIdx = compact.findIndex(c => /requisitan(te|tes)?/i.test(c));
            if (reqIdx >= 0) {
                if (requisicaoAtual.numero_requisicao) {
                    console.log(`[DEBUG] Requisição anterior salva: #${requisicaoAtual.numero_requisicao}, Almoxarifado: "${requisicaoAtual.almoxarifado_requisicao}"`);
                    requisicoesProcessadas.push(requisicaoAtual);
                    requisicaoAtual = { itens: [] };
                }
                const nome = compact[reqIdx + 1] ?? compact.slice(reqIdx + 1).join(' ');
                requisicaoAtual.requisitante_requisicao = nome;
                console.log(`[DEBUG] Requisitante capturado: "${nome}"`);
                continue;
            }
            // Almoxarifado
            const almIdx = compact.findIndex(c => /almoxarifado/i.test(c));
            if (almIdx >= 0) {
                // Regex mais preciso: procura "Almoxarifado:" seguido de ";", depois captura até o próximo ";"
                const almoxarifadoMatch = rowStr.match(/Almoxarifado\s*:\s*;\s*([^;]+)/i);
                const almReq = almoxarifadoMatch ? almoxarifadoMatch[1].trim() : '';
                if (almReq) {
                    requisicaoAtual.almoxarifado_requisicao = almReq;
                    console.log(`[DEBUG] Almoxarifado capturado: "${almReq}"`);
                }
                else {
                    console.log(`[DEBUG] Almoxarifado não encontrado na linha`);
                }
                continue;
            }
            // Numero da requisicao
            const numIdx = compact.findIndex(c => /requisi[cç][aã]o?/i.test(c));
            if (numIdx >= 0) {
                const num = compact[numIdx + 1] ?? compact.slice(numIdx + 1).join(' ');
                const parsed = parseInt((num ?? '').toString().replace(/[^0-9]/g, ''), 10);
                if (!isNaN(parsed)) {
                    requisicaoAtual.numero_requisicao = parsed;
                    console.log(`[DEBUG] Número da requisição: ${parsed}`);
                }
                continue;
            }
            // Data/Hora - usa a data global do arquivo
            const dateMatch = rowStr.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/);
            if (dateMatch && dateMatch[1]) {
                requisicaoAtual.data_requisicao = parseDate(dateMatch[1].trim()) ?? new Date();
                console.log(`[DEBUG] Data da requisição (com hora): ${requisicaoAtual.data_requisicao}`);
                continue;
            }
            else if (!requisicaoAtual.data_requisicao && dataGlobalArquivo) {
                // Se não encontrar data com hora, usa a data global do arquivo
                requisicaoAtual.data_requisicao = dataGlobalArquivo;
                console.log(`[DEBUG] Data da requisição (usando data global): ${dataGlobalArquivo}`);
                continue;
            }
            // Item
            const item = tryParseItemFromRow(row);
            if (item && requisicaoAtual.itens) {
                requisicaoAtual.itens.push({
                    endereco_item_requisicao: item.endereco ?? '',
                    quantidade_solicitada_item_requisicao: item.quantidade,
                    unidade_material_item_requisicao: item.unidade,
                    descricao_material_item_requisicao: item.descricao,
                });
                continue;
            }
        }
        if (requisicaoAtual && requisicaoAtual.numero_requisicao) {
            console.log(`[DEBUG] Requisição final: #${requisicaoAtual.numero_requisicao}, Almoxarifado: "${requisicaoAtual.almoxarifado_requisicao}"`);
            requisicoesProcessadas.push(requisicaoAtual);
        }
        // Verifica se as requisições já existem no banco
        const numerosRequisicoes = requisicoesProcessadas
            .map(r => r.numero_requisicao)
            .filter((n) => typeof n === 'number');
        const requisicoesExistentes = await prisma_1.prisma.requisicao.findMany({
            where: { numero_requisicao: { in: numerosRequisicoes } },
            select: { numero_requisicao: true },
        });
        const existentesSet = new Set(requisicoesExistentes.map(e => e.numero_requisicao));
        const requisicoesNovas = requisicoesProcessadas.filter(r => !existentesSet.has(r.numero_requisicao));
        // Se todas as requisições já existem, retorna erro
        if (requisicoesNovas.length === 0) {
            const numerosExistentes = Array.from(existentesSet).join(', ');
            console.log(`[DEBUG] Todas as requisições já foram importadas: ${numerosExistentes}`);
            res.status(400).json({
                message: `Erro: As requisições de número(s) ${numerosExistentes} já foram importadas anteriormente. Nenhuma requisição foi adicionada.`
            });
            return;
        }
        // Se algumas requisições já existem, avisa quais foram puladas
        if (requisicoesExistentes.length > 0) {
            const numerosExistentes = Array.from(existentesSet).join(', ');
            console.log(`[DEBUG] ${requisicoesExistentes.length} requisição(ões) já existente(s): ${numerosExistentes}`);
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            for (const req of requisicoesNovas) {
                // Data de cadastro com hora de São Paulo (UTC-3)
                const dataCadastro = new Date();
                dataCadastro.setHours(dataCadastro.getHours() - 3);
                await tx.requisicao.create({
                    data: {
                        numero_requisicao: req.numero_requisicao,
                        requisitante_requisicao: req.requisitante_requisicao,
                        almoxarifado_requisicao: req.almoxarifado_requisicao,
                        data_requisicao: req.data_requisicao,
                        data_cadastro_requisicao: dataCadastro,
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
        const mensagem = requisicoesExistentes.length > 0
            ? `Importação parcial concluída! ${requisicoesNovas.length} requisição(ões) nova(s) processada(s). ${requisicoesExistentes.length} requisição(ões) já existiam e foram puladas.`
            : `Importação concluída! ${requisicoesNovas.length} requisição(ões) processada(s).`;
        res.status(201).json({ message: mensagem });
    }
    catch (error) {
        console.error("Erro na importação via API:", error);
        res.status(500).json({ message: "Erro no servidor durante a importação." });
    }
};
exports.importFromTxt = importFromTxt;
/**
 * Busca todas as requisições (função geral).
 */
const getAllRequisicoes = async (req, res) => {
    try {
        const requisicoes = await prisma_1.prisma.requisicao.findMany({
            include: { situacao: true, tipo_envio: true, itens: true },
            orderBy: { data_cadastro_requisicao: 'desc' }
        });
        res.json(requisicoes);
    }
    catch (error) {
        console.error("Erro ao buscar requisições:", error);
        res.status(500).json({ message: "Erro ao buscar requisições." });
    }
};
exports.getAllRequisicoes = getAllRequisicoes;
/**
 * Busca uma requisição específica pelo seu ID.
 */
const getRequisicaoById = async (req, res) => {
    try {
        const { id } = req.params;
        const requisicao = await prisma_1.prisma.requisicao.findUnique({
            where: { id_requisicao: Number(id) },
            include: { itens: true, situacao: true, tipo_envio: true, volumes: true },
        });
        if (!requisicao) {
            res.status(404).json({ message: 'Requisição não encontrada' });
            return;
        }
        res.status(200).json(requisicao);
    }
    catch (error) {
        console.error("Erro ao buscar detalhes da requisição:", error);
        res.status(500).json({ message: "Erro interno ao buscar detalhes da requisição." });
    }
};
exports.getRequisicaoById = getRequisicaoById;
/**
 * Busca requisições filtrando por um status específico.
 */
const getRequisicoesPorStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const statusMap = {
            'pendente': 1,
            'em-atendimento': 2,
            'em-separacao': 3,
            'em-conferencia-separacao': 4,
            'em-embalagem': 5,
            'em-conferencia-expedicao': 6,
            'concluida': 7,
            'cancelada': 8,
            'enviado-para-separacao': 9,
            'enviado-para-conferencia-separacao': 10,
            'enviado-para-embalagem': 11,
            'enviado-para-conferencia-expedicao': 12
        };
        const statusId = statusMap[status.toLowerCase()];
        if (!statusId) {
            res.status(400).json({ message: "Status inválido." });
            return;
        }
        const requisicoes = await prisma_1.prisma.requisicao.findMany({
            where: { id_situacao_requisicao: statusId },
            include: { situacao: true, tipo_envio: true, itens: true },
            orderBy: [
                { prioridade_requisicao: 'desc' },
                { data_cadastro_requisicao: 'asc' }
            ]
        });
        res.json(requisicoes);
    }
    catch (error) {
        console.error(`Erro ao buscar requisições por status (${req.params.status}):`, error);
        res.status(500).json({ message: "Erro ao buscar requisições." });
    }
};
exports.getRequisicoesPorStatus = getRequisicoesPorStatus;
/**
 * Busca requisições para a tela de monitoramento.
 */
const getMonitoramentoRequisicoes = async (req, res) => {
    try {
        const requisicoes = await prisma_1.prisma.requisicao.findMany({
            include: {
                situacao: true,
                tipo_envio: true,
                itens: true
            },
            orderBy: { data_cadastro_requisicao: 'asc' }
        });
        res.json(requisicoes);
    }
    catch (error) {
        console.error("Erro ao buscar requisições para monitoramento:", error);
        res.status(500).json({ message: "Erro ao buscar requisições para monitoramento." });
    }
};
exports.getMonitoramentoRequisicoes = getMonitoramentoRequisicoes;
/**
 * Atualiza uma requisição existente (status, prioridade, etc.).
 */
const updateRequisicao = async (req, res) => {
    try {
        const { id } = req.params;
        const requisicaoId = parseInt(id, 10);
        // Desestrutura o corpo do pedido para separar as diferentes partes
        const { status, itens, volumes, ...otherData } = req.body;
        // Cria um objeto de dados para atualização apenas com os campos válidos
        const dataToUpdate = { ...otherData };
        // Se um 'status' (string) for enviado, ele é traduzido para o campo e ID corretos
        if (status) {
            const statusMap = {
                'pendente': 1, 'em-atendimento': 2, 'em-separacao': 3,
                'em-conferencia-separacao': 4, 'em-embalagem': 5, 'em-conferencia-expedicao': 6,
                'concluida': 7, 'cancelada': 8, 'enviado-para-separacao': 9,
                'enviado-para-conferencia-separacao': 10, 'enviado-para-embalagem': 11,
                'enviado-para-conferencia-expedicao': 12
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
        await prisma_1.prisma.$transaction(async (tx) => {
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
                    data: volumes.map((v) => ({
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
        const requisicaoAtualizada = await prisma_1.prisma.requisicao.findUnique({
            where: { id_requisicao: requisicaoId },
            include: { itens: true, situacao: true, tipo_envio: true, volumes: true }
        });
        res.status(200).json(requisicaoAtualizada);
    }
    catch (error) {
        console.error(`Erro ao atualizar requisição ${req.params.id}:`, error);
        res.status(500).json({ message: "Erro ao atualizar requisição." });
    }
};
exports.updateRequisicao = updateRequisicao;
const getTiposEnvio = async (req, res) => {
    try {
        const tiposEnvio = await prisma_1.prisma.tipoEnvioRequisicao.findMany({
            where: { ativa_tipo_envio_requisicao: true }
        });
        res.json(tiposEnvio);
    }
    catch (error) {
        console.error("Erro ao buscar tipos de envio:", error);
        res.status(500).json({ message: "Erro ao buscar tipos de envio." });
    }
};
exports.getTiposEnvio = getTiposEnvio;
/**
 * Alterna o status de prioridade de uma requisição.
 */
const togglePrioridade = async (req, res) => {
    try {
        const { id } = req.params;
        const requisicaoId = parseInt(id, 10);
        const requisicaoAtual = await prisma_1.prisma.requisicao.findUnique({ where: { id_requisicao: requisicaoId } });
        if (!requisicaoAtual) {
            res.status(404).json({ message: 'Requisição não encontrada.' });
            return;
        }
        const requisicaoAtualizada = await prisma_1.prisma.requisicao.update({
            where: { id_requisicao: requisicaoId },
            data: { prioridade_requisicao: !requisicaoAtual.prioridade_requisicao },
        });
        res.json(requisicaoAtualizada);
    }
    catch (error) {
        console.error("Erro ao alterar prioridade:", error);
        res.status(500).json({ message: "Erro ao alterar prioridade da requisição." });
    }
};
exports.togglePrioridade = togglePrioridade;
