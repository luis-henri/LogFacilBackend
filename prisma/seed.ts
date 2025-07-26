import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
            { id_situacao_requisicao: 4, descricao_situacao_requisicao: 'Em Conferência' },
            { id_situacao_requisicao: 5, descricao_situacao_requisicao: 'Em Embalagem' },
            { id_situacao_requisicao: 6, descricao_situacao_requisicao: 'Em Expedição' },
            { id_situacao_requisicao: 7, descricao_situacao_requisicao: 'Concluída' },
            { id_situacao_requisicao: 8, descricao_situacao_requisicao: 'Cancelada' },
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
    const hashedPassword = await bcrypt.hash('admin123', 10);
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