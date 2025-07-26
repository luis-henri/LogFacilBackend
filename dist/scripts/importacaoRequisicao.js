"use strict";
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
        console.log('A limpar as tabelas de requisições e itens existentes...');
        await prisma.itemRequisicao.deleteMany({});
        await prisma.requisicao.deleteMany({});
        console.log('Tabelas limpas.');
        const caminhoFicheiro = path_1.default.join(process.cwd(), 'AX0273 - NOTIFICACAO DE BAIXA.txt');
        if (!fs_1.default.existsSync(caminhoFicheiro)) {
            throw new Error(`Ficheiro não encontrado em ${caminhoFicheiro}`);
        }
        const conteudoFicheiro = fs_1.default.readFileSync(caminhoFicheiro, 'utf8');
        const linhas = conteudoFicheiro.split(/\r?\n/);
        const requisicoesProcessadas = [];
        let requisicaoAtual = {};
        for (const linha of linhas) {
            // Usa regex para identificar os diferentes tipos de linha
            const matchRequisitante = linha.match(/^Requisitantes:;([^;]+)/);
            const matchRequisicaoNum = linha.match(/^Requisição:;(\d+)/);
            const matchDataHora = linha.match(/^;;;Tribunal Regional Eleitoral de Pernambuco- TRE\/PE;;;;;;([\d\/]+\s[\d:]+)/);
            const matchItem = linha.match(/^(\d+);;(\d+);;([A-Z]{2,3});(.*?);/);
            if (matchRequisitante) {
                // Se encontrarmos um novo requisitante e a requisição atual já tem dados,
                // guardamos a anterior e começamos uma nova.
                if (requisicaoAtual.numero_requisicao) {
                    requisicoesProcessadas.push(requisicaoAtual);
                }
                requisicaoAtual = { requisitante_requisicao: matchRequisitante[1].trim(), itens: [] };
            }
            else if (matchRequisicaoNum && requisicaoAtual) {
                requisicaoAtual.numero_requisicao = parseInt(matchRequisicaoNum[1], 10);
            }
            else if (matchDataHora && requisicaoAtual) {
                requisicaoAtual.data_requisicao = parseDate(matchDataHora[1].trim()) ?? new Date();
            }
            else if (matchItem && requisicaoAtual.itens) {
                requisicaoAtual.itens.push({
                    quantidade_solicitada_item_requisicao: parseInt(matchItem[2], 10),
                    unidade_material_item_requisicao: matchItem[3],
                    descricao_material_item_requisicao: matchItem[4].trim(),
                });
            }
        }
        // Adiciona a última requisição processada à lista
        if (requisicaoAtual.numero_requisicao) {
            requisicoesProcessadas.push(requisicaoAtual);
        }
        console.log(`Processamento concluído. ${requisicoesProcessadas.length} requisições encontradas para inserir.`);
        // Agora, insere cada requisição processada no banco de dados
        for (const req of requisicoesProcessadas) {
            console.log(`A inserir requisição nº: ${req.numero_requisicao} com ${req.itens.length} itens.`);
            await prisma.requisicao.create({
                data: {
                    numero_requisicao: req.numero_requisicao,
                    requisitante_requisicao: req.requisitante_requisicao,
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
