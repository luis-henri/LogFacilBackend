"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const sync_1 = require("csv-parse/sync");
const prisma = new client_1.PrismaClient();
// Função auxiliar para converter data no formato DD/MM/AAAA HH:mm:ss para um objeto Date
function parseDate(dateString) {
    try {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('/');
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
        // Argument parsing: suporte a --file, --user (ou env IMPORT_USER_ID), --situacao e --dry-run
        const rawArgs = process.argv.slice(2);
        const getFlag = (name) => {
            const f = rawArgs.find(a => a.startsWith(`--${name}=`));
            return f ? f.split('=')[1] : undefined;
        };
        const fileArg = getFlag('file') ?? rawArgs[0];
        const userArg = getFlag('user') ?? getFlag('user-id') ?? process.env.IMPORT_USER_ID;
        const situacaoArg = getFlag('situacao') ?? getFlag('situacao-id') ?? process.env.IMPORT_SITUACAO_ID;
        const dryRun = rawArgs.includes('--dry-run');
        // Obrigatório passar o ficheiro via --file=<path> ou como primeiro argumento
        if (!fileArg) {
            throw new Error('É necessário indicar o ficheiro a importar via --file=<path> ou como primeiro argumento.');
        }
        const caminhoFicheiro = path_1.default.isAbsolute(fileArg) ? fileArg : path_1.default.join(process.cwd(), fileArg);
        console.log('A iniciar a importação avançada do ficheiro de relatório...');
        console.log(`Ficheiro a processar: ${caminhoFicheiro}`);
        console.log(`Dry-run: ${dryRun}`);
        const idUsuario = userArg ? parseInt(userArg, 10) : 23;
        const idSituacao = situacaoArg ? parseInt(situacaoArg, 10) : 1;
        if (!fs_1.default.existsSync(caminhoFicheiro)) {
            throw new Error(`Ficheiro não encontrado em ${caminhoFicheiro}`);
        }
        const conteudoFicheiro = fs_1.default.readFileSync(caminhoFicheiro, 'utf8');
        // Parse com csv-parse para tratar corretamente os campos delimitados por ';'
        const records = (0, sync_1.parse)(conteudoFicheiro, {
            delimiter: ';',
            relax_column_count: true,
            skip_empty_lines: true,
            trim: false,
        });
        const requisicoesProcessadas = [];
        let requisicaoAtual = { itens: [] };
        function compactRow(row) {
            return row.map(c => (c ?? '').toString()).map(s => s.trim()).filter(s => s.length > 0);
        }
        function tryParseItemFromRow(row) {
            const compact = compactRow(row);
            if (compact.length < 3)
                return null;
            // heurística: primeiro token numérico = item id, segundo token numérico = quantidade
            // porém o ficheiro tem tokens vazios entre ;; então compact elimina vazios
            // após eliminação, esperamos: [itemId, quantidade, unidade, descricao...]
            const maybeQuantidade = compact[1];
            const maybeUnidade = compact[2];
            const descricao = compact.slice(3).join(' ');
            if (/^\d+$/.test(compact[0]) && /^\d+$/.test(maybeQuantidade) && /^[A-Z]{1,6}$/i.test(maybeUnidade)) {
                return { quantidade: parseInt(maybeQuantidade, 10), unidade: maybeUnidade, descricao };
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
                    requisicoesProcessadas.push(requisicaoAtual);
                    requisicaoAtual = { itens: [] };
                }
                const nome = compact[reqIdx + 1] ?? compact.slice(reqIdx + 1).join(' ');
                requisicaoAtual.requisitante_requisicao = nome;
                continue;
            }
            // Almoxarifado
            const almIdx = compact.findIndex(c => /almoxarifado/i.test(c));
            if (almIdx >= 0) {
                const val = compact[almIdx + 1] ?? compact.slice(almIdx + 1).join(' ');
                requisicaoAtual.almoxarifado_requisicao = val;
                console.log(`Almoxarifado capturado (csv): "${val}"`);
                continue;
            }
            // Numero da requisicao
            const numIdx = compact.findIndex(c => /requisi[cç][aã]o?/i.test(c));
            if (numIdx >= 0) {
                const num = compact[numIdx + 1] ?? compact.slice(numIdx + 1).join(' ');
                const parsed = parseInt((num ?? '').toString().replace(/[^0-9]/g, ''), 10);
                if (!isNaN(parsed)) {
                    requisicaoAtual.numero_requisicao = parsed;
                }
                continue;
            }
            // Data/Hora (procura padrão DD/MM/YYYY HH:MM:SS em qualquer parte da linha)
            const dateMatch = rowStr.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/);
            if (dateMatch && dateMatch[1]) {
                requisicaoAtual.data_requisicao = parseDate(dateMatch[1].trim()) ?? new Date();
                continue;
            }
            // Item
            const item = tryParseItemFromRow(row);
            if (item && requisicaoAtual.itens) {
                requisicaoAtual.itens.push({
                    quantidade_solicitada_item_requisicao: item.quantidade,
                    unidade_material_item_requisicao: item.unidade,
                    descricao_material_item_requisicao: item.descricao,
                });
                continue;
            }
        }
        if (requisicaoAtual && requisicaoAtual.numero_requisicao) {
            requisicoesProcessadas.push(requisicaoAtual);
        }
        console.log(`Processamento concluído. ${requisicoesProcessadas.length} requisições encontradas.`);
        if (dryRun) {
            console.log('Dry-run activo: não serão feitas operações no banco de dados.');
            console.log(`Resumo: ${requisicoesProcessadas.length} requisições, cada uma com respetivos itens.`);
        }
        else {
            await prisma.$connect();
            console.log('Ligado ao banco de dados com sucesso.');
            // Antes de inserir, verifique quais requisições já existem no banco
            const numeros = requisicoesProcessadas
                .map(r => r.numero_requisicao)
                .filter((n) => typeof n === 'number');
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
                        almoxarifado_requisicao: req.almoxarifado_requisicao,
                        data_requisicao: req.data_requisicao,
                        id_usuario: Number.isFinite(idUsuario) ? idUsuario : 23,
                        id_situacao_requisicao: Number.isFinite(idSituacao) ? idSituacao : 1,
                        prioridade_requisicao: false,
                        itens: {
                            create: req.itens,
                        },
                    },
                });
            }
            console.log('Importação concluída com sucesso!');
        }
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
