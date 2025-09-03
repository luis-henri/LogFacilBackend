LogFácil - Backend (Node.js + Express + TypeScript)

Stack e dependências

- Express, TypeScript, ts-node-dev
- Prisma ORM (+ @prisma/client) e PostgreSQL
- JWT (jsonwebtoken), bcryptjs
- Multer (upload em memória), CORS, dotenv

Setup

```
npm install
```

Variáveis de ambiente (`.env`)

```
DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/SEU_BANCO"
JWT_SECRET="SEGREDO_SUPER_SEGURO"
PORT=3000
```

Migrações e Prisma

```
npx prisma migrate dev
npx prisma generate
```

Scripts

```
npm run dev            # desenvolvimento com hot reload
npm run build          # gera dist/
npm start              # executa dist/server.js
npm run user:create    # cria usuário via script (ts)
npm run import:data    # importa requisições via script (ts)
```

Rotas (API)

- Auth: `POST /api/auth/login`, `POST /api/auth/register`
- Requisições (protegid as por JWT):
  - `GET /api/requisicoes` (lista)
  - `GET /api/requisicoes/:id` (detalhe)
  - `GET /api/requisicoes/status/:status`
  - `GET /api/requisicoes/monitoramento`
  - `GET /api/requisicoes/tipos-envio`
  - `POST /api/requisicoes/importar` (upload TXT - `file`)
  - `PATCH /api/requisicoes/:id`
  - `PATCH /api/requisicoes/:id/prioridade`
- Usuários (protegidas por JWT): `GET /api/usuarios`, `PATCH /api/usuarios/:id`, `GET /api/usuarios/perfis`

Segurança

- `protect` valida `Authorization: Bearer <JWT>` e popula `req.user`
- `checkPerfil([..])` aplica RBAC por rota
- CORS restrito a origens configuradas em `src/server.ts`
- Hash de senhas com `bcryptjs`

Modelagem de Dados

- Ver `prisma/schema.prisma` para os modelos: `Usuario`, `Perfil`, `UsuarioPerfil`, `Funcionalidade`, `Requisicao`, `ItemRequisicao`, `Volume`, `EtapaOperacional*`, `OcorrenciaEtapa`, `TipoEnvioRequisicao`, etc.

Observabilidade

- Logger simples de requests em `src/server.ts` (útil em dev)
