"use strict";
// Salve este ficheiro como: src/scripts/criar-usuario.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function criarUsuario() {
    console.log('A iniciar o script de criação de usuário...');
    // 1. Pega os argumentos passados pelo terminal.
    // process.argv[0] é o node, process.argv[1] é o nome do script.
    // Os argumentos reais começam no índice 2.
    const args = process.argv.slice(2);
    if (args.length < 4) {
        console.error('Erro: Faltam argumentos. Forneça o nome, email, CPF e senha.');
        console.log('Exemplo: npm run user:create -- "Nome Completo" "email@exemplo.com" "12345678900" "senhaForte123"');
        return;
    }
    const [nome, email, cpf, password] = args;
    console.log(`A criar usuário: ${nome} (${email})`);
    try {
        await prisma.$connect();
        // 2. Encripta a senha exatamente como o backend faz
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // 3. Cria o novo usuário no banco de dados
        const newUser = await prisma.usuario.create({
            data: {
                nome_usuario: nome,
                email_usuario: email,
                cpf_usuario: cpf,
                senha_hash: hashedPassword,
                id_situacao_usuario: 1, // Padrão: 'Ativo'
                id_cargo_usuario: 1, // Padrão: 'Operador de Almoxarifado'
            },
        });
        console.log(`✅ Usuário criado com sucesso! ID: ${newUser.id_usuario}`);
    }
    catch (error) {
        console.error('❌ Ocorreu um erro ao criar o usuário:', error);
    }
    finally {
        await prisma.$disconnect();
        console.log('Ligação ao banco de dados fechada.');
    }
}
criarUsuario();
