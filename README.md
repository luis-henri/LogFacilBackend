LogFacil - Backend
Este é o projeto de backend para a aplicação LogFácil, construído com Node.js, Express, TypeScript e Prisma.

Configuração Recomendada do IDE
VSCode

1. ESLint

2. Prettier - Code formatter

3. Prisma

Configuração do Projeto
Siga os passos abaixo para configurar e executar o projeto localmente.

1. Instalar Dependências
Este comando irá instalar todas as bibliotecas necessárias listadas no package.json.

npm install

2. Configurar Variáveis de Ambiente
O projeto requer um ficheiro .env na raiz para guardar informações sensíveis.

Crie um ficheiro chamado .env na raiz da pasta logfacil-backend.

Adicione as seguintes variáveis, substituindo pelos seus valores:

# String de ligação ao seu banco de dados PostgreSQL
DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/SEU_BANCO_DE_DADOS"

# Segredo para assinar os tokens JWT. Use um texto longo e aleatório.
JWT_SECRET="SEU_SEGREDO_SUPER_SECRETO_AQUI"

3. Configurar e Migrar o Banco de Dados
Este comando lê o seu prisma/schema.prisma e cria/atualiza as tabelas no seu banco de dados PostgreSQL.

npx prisma migrate dev

Nota para Redes Corporativas: Se encontrar um erro de self-signed certificate, execute o comando com o seguinte prefixo:

NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma migrate dev

Comandos Disponíveis
Compilar e Iniciar para Desenvolvimento (com Hot-Reload)
Este comando inicia o servidor em modo de desenvolvimento. Ele irá reiniciar automaticamente sempre que você alterar um ficheiro no código-fonte (src/).

npm run dev

O servidor estará disponível em http://localhost:3000.

Compilar para Produção
Este comando compila o seu código TypeScript para JavaScript puro, pronto para ser executado num servidor de produção. Os ficheiros compilados serão guardados numa nova pasta chamada dist.

npm run build

Iniciar em Modo de Produção
Este comando executa o código já compilado a partir da pasta dist. Use-o depois de executar o npm run build.

npm run start