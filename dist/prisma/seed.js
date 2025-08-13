"use strict";
// ARQUIVO: prisma/seed.ts
// VERSÃO MODIFICADA PARA ATRIBUIR PERFIL A UM UTILIZADOR EXISTENTE
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log(`A iniciar o processo de seeding...`);
    // 1. Garante que os Status e Perfis básicos existem
    await prisma.situacaoUsuario.createMany({
        data: [
            { id_situacao_usuario: 1, descricao_situacao_usuario: 'Ativo' },
            { id_situacao_usuario: 2, descricao_situacao_usuario: 'Inativo' },
        ],
        skipDuplicates: true,
    });
    console.log('Status de utilizador verificados.');
    await prisma.perfil.createMany({
        data: [
            { id_perfil: 1, nome_perfil: 'Administrador - Geral' },
            { id_perfil: 2, nome_perfil: 'ALMOX - Atendimento' },
            { id_perfil: 3, nome_perfil: 'ALMOX - Conferência' },
            { id_perfil: 4, nome_perfil: 'ALMOX - Separação' },
            { id_perfil: 5, nome_perfil: 'ALMOX - Embalagem' },
            { id_perfil: 6, nome_perfil: 'ALMOX - Expedição' },
        ],
        skipDuplicates: true,
    });
    console.log('Perfis de utilizador verificados.');
    // =======================================================================
    // PASSO CRÍTICO: Definir qual utilizador será o administrador
    // =======================================================================
    const cpfDoAdmin = '00000000000'; // <-- SUBSTITUA PELO CPF DO SEU UTILIZADOR
    const senhaTemporariaAdmin = 'admin123'; // <-- SENHA QUE VOCÊ USARÁ PARA LOGAR
    console.log(`A procurar o utilizador com CPF: ${cpfDoAdmin} para o tornar administrador...`);
    // 2. Encontra o seu utilizador existente pelo CPF
    const userToMakeAdmin = await prisma.usuario.findUnique({
        where: { cpf_usuario: cpfDoAdmin },
    });
    // 3. Se o utilizador for encontrado, atualiza-o e associa o perfil
    if (userToMakeAdmin) {
        console.log(`Utilizador "${userToMakeAdmin.nome_usuario}" encontrado.`);
        // 3a. Atualiza a senha para um valor conhecido e garante que está ativo
        const hashedPassword = await bcryptjs_1.default.hash(senhaTemporariaAdmin, 10);
        await prisma.usuario.update({
            where: { id_usuario: userToMakeAdmin.id_usuario },
            data: {
                senha_hash: hashedPassword,
                id_situacao_usuario: 1 // Garante que o utilizador está ativo
            },
        });
        console.log(`Senha do utilizador atualizada para um valor temporário conhecido.`);
        // 3b. Encontra o perfil de Administrador
        const adminProfile = await prisma.perfil.findUnique({ where: { id_perfil: 1 } });
        if (adminProfile) {
            // 3c. Associa o utilizador ao perfil de Administrador (cria ou atualiza a ligação)
            await prisma.usuarioPerfil.upsert({
                where: {
                    id_usuario_id_perfil: {
                        id_usuario: userToMakeAdmin.id_usuario,
                        id_perfil: adminProfile.id_perfil,
                    }
                },
                update: {}, // Não faz nada se a associação já existir
                create: {
                    id_usuario: userToMakeAdmin.id_usuario,
                    id_perfil: adminProfile.id_perfil,
                }
            });
            console.log(`Utilizador "${userToMakeAdmin.nome_usuario}" associado com sucesso ao perfil "${adminProfile.nome_perfil}".`);
        }
        else {
            console.error('ERRO CRÍTICO: O perfil "Administrador - Geral" com id=1 não foi encontrado.');
        }
    }
    else {
        console.error(`ERRO: Nenhum utilizador encontrado com o CPF ${cpfDoAdmin}. Por favor, verifique o CPF no ficheiro seed.ts.`);
        console.error('O script não irá criar um novo utilizador. Ele apenas modifica um existente.');
    }
    console.log(`Seeding concluído.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
