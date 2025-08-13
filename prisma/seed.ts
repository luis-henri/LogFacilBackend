// ARQUIVO: prisma/seed.ts
// VERSÃO COMPLETA E CORRIGIDA

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log(`A iniciar o processo de seeding...`);

    // 1. Criar Status de Utilizador (como já estava)
    await prisma.situacaoUsuario.createMany({
        data: [
            { id_situacao_usuario: 1, descricao_situacao_usuario: 'Ativo' },
            { id_situacao_usuario: 2, descricao_situacao_usuario: 'Inativo' },
        ],
        skipDuplicates: true,
    });
    console.log('Status de utilizador criados.');

    // 2. Criar Perfis de Utilizador
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
    console.log('Perfis de utilizador criados.');

    // 3. Criar o primeiro Utilizador Administrador
    const hashedPassword = await bcrypt.hash('admin123', 10); // Senha padrão: admin123
    const adminUser = await prisma.usuario.upsert({
        where: { email_usuario: 'admin@logfacil.com' },
        update: {},
        create: {
            nome_usuario: 'Administrador',
            email_usuario: 'admin@logfacil.com',
            cpf_usuario: '00000000000', // CPF padrão
            senha_hash: hashedPassword,
            id_situacao_usuario: 1, // Ativo
        },
    });
    console.log('Utilizador administrador criado/verificado.');

    // 4. Associar o Utilizador Administrador ao Perfil de Administrador
    // Busca o perfil que acabámos de criar
    const adminProfile = await prisma.perfil.findUnique({ where: { id_perfil: 1 } });

    if (adminUser && adminProfile) {
        await prisma.usuarioPerfil.upsert({
            where: {
                // A chave primária composta é identificada assim pelo Prisma
                id_usuario_id_perfil: {
                    id_usuario: adminUser.id_usuario,
                    id_perfil: adminProfile.id_perfil,
                }
            },
            update: {},
            create: {
                id_usuario: adminUser.id_usuario,
                id_perfil: adminProfile.id_perfil,
            }
        });
        console.log('Associação entre utilizador Admin e perfil Admin criada.');
    }

    // Adicione aqui a criação de outros dados iniciais se necessário (SituaçãoRequisição, etc.)
    
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
