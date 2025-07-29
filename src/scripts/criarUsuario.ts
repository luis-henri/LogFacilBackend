// Salve este ficheiro como: src/scripts/criar-usuario.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Cria o novo usuário no banco de dados
    const newUser = await prisma.usuario.create({
      data: {
        nome_usuario: nome,
        email_usuario: email,
        cpf_usuario: cpf,
        senha_hash: hashedPassword,
        id_situacao_usuario: 1, // Padrão: 'Ativo'
        id_cargo_usuario: 1,    // Padrão: 'Operador de Almoxarifado'
      },
    });

    console.log(`✅ Usuário criado com sucesso! ID: ${newUser.id_usuario}`);

  } catch (error) {
    console.error('❌ Ocorreu um erro ao criar o usuário:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Ligação ao banco de dados fechada.');
  }
}

criarUsuario();
