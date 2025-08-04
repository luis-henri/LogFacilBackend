"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log(`A iniciar o processo de seeding...`);
    // 1. Criar Status de Utilizador
    await prisma.situacaoUsuario.createMany({
        data: [
            { id_situacao_usuario: 1, descricao_situacao_usuario: 'Ativo' },
            { id_situacao_usuario: 2, descricao_situacao_usuario: 'Inativo' },
        ],
        skipDuplicates: true,
    });
    console.log('Status de utilizador criados.');
    // 2. Criar Status de Requisição
    await prisma.situacaoRequisicao.createMany({
        data: [
            { id_situacao_requisicao: 1, descricao_situacao_requisicao: 'Pendente' },
            { id_situacao_requisicao: 2, descricao_situacao_requisicao: 'Em Atendimento' },
            { id_situacao_requisicao: 3, descricao_situacao_requisicao: 'Em Separação' },
            { id_situacao_requisicao: 4, descricao_situacao_requisicao: 'Em Conferência - Separação' },
            { id_situacao_requisicao: 5, descricao_situacao_requisicao: 'Em Embalagem' },
            { id_situacao_requisicao: 6, descricao_situacao_requisicao: 'Em Conferência - Expedição' },
            { id_situacao_requisicao: 7, descricao_situacao_requisicao: 'Concluída' },
            { id_situacao_requisicao: 8, descricao_situacao_requisicao: 'Cancelada' },
            { id_situacao_requisicao: 9, descricao_situacao_requisicao: 'Enviado para Separação' },
            { id_situacao_requisicao: 10, descricao_situacao_requisicao: 'Enviado para Conferência - Separação' },
            { id_situacao_requisicao: 11, descricao_situacao_requisicao: 'Enviado para Embalagem' },
            { id_situacao_requisicao: 12, descricao_situacao_requisicao: 'Enviado para Conferência - Expedição' },
        ],
        skipDuplicates: true,
    });
    console.log('Status de requisição criados.');
    // 3. Criar Tipos de Envio
    await prisma.tipoEnvioRequisicao.createMany({
        data: [
            { descricao_tipo_envio_requisicao: 'Normal (PAC)' },
            { descricao_tipo_envio_requisicao: 'SEDEX' },
            { descricao_tipo_envio_requisicao: 'SETRANS' },
            { descricao_tipo_envio_requisicao: 'Portador' },
        ],
        skipDuplicates: true,
    });
    console.log('Tipos de envio criados.');
    // 4. Criar o primeiro Utilizador Administrador
    const hashedPassword = await bcryptjs_1.default.hash('admin123', 10);
    await prisma.usuario.upsert({
        where: { email_usuario: 'admin@logfacil.com' },
        update: {},
        create: {
            nome_usuario: 'Administrador',
            email_usuario: 'admin@logfacil.com',
            cpf_usuario: '00000000000',
            senha_hash: hashedPassword,
            id_situacao_usuario: 1, // Ativo
        },
    });
    console.log('Utilizador administrador criado/verificado.');
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
