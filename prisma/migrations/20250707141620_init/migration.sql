-- CreateTable
CREATE TABLE "perfis" (
    "id_perfil" SERIAL NOT NULL,
    "nome_perfil" VARCHAR(100) NOT NULL,
    "descricao_perfil" TEXT,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id_perfil")
);

-- CreateTable
CREATE TABLE "funcionalidades" (
    "id_funcionalidade" SERIAL NOT NULL,
    "nome_funcionalidade" VARCHAR(100) NOT NULL,
    "chave_funcionalidade" VARCHAR(50) NOT NULL,
    "descricao_funcionalidade" TEXT,

    CONSTRAINT "funcionalidades_pkey" PRIMARY KEY ("id_funcionalidade")
);

-- CreateTable
CREATE TABLE "situacoes_usuario" (
    "id_situacao_usuario" SERIAL NOT NULL,
    "descricao_situacao_usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "situacoes_usuario_pkey" PRIMARY KEY ("id_situacao_usuario")
);

-- CreateTable
CREATE TABLE "situacoes_requisicao" (
    "id_situacao_requisicao" SERIAL NOT NULL,
    "descricao_situacao_requisicao" VARCHAR(100) NOT NULL,

    CONSTRAINT "situacoes_requisicao_pkey" PRIMARY KEY ("id_situacao_requisicao")
);

-- CreateTable
CREATE TABLE "tipo_envio" (
    "id_tipo_envio" SERIAL NOT NULL,
    "descricao_tipo_envio" VARCHAR(100) NOT NULL,
    "ativo" BOOLEAN DEFAULT true,

    CONSTRAINT "tipo_envio_pkey" PRIMARY KEY ("id_tipo_envio")
);

-- CreateTable
CREATE TABLE "etapa_operacional" (
    "id_etapa_operacional" SERIAL NOT NULL,
    "descricao_etapa_operacional" VARCHAR(100) NOT NULL,
    "pre_etapa_id" INTEGER,
    "pos_etapa_id" INTEGER,

    CONSTRAINT "etapa_operacional_pkey" PRIMARY KEY ("id_etapa_operacional")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nome_usuario" VARCHAR(255) NOT NULL,
    "email_usuario" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "id_situacao_usuario" INTEGER NOT NULL,
    "data_cadastro_usuario" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "requisicao" (
    "id_requisicao" SERIAL NOT NULL,
    "numero_requisicao" INTEGER NOT NULL,
    "requisitante_requisicao" VARCHAR(255),
    "almoxarifado_requisicao" VARCHAR(100),
    "id_usuario" INTEGER NOT NULL,
    "id_situacao_requisicao" INTEGER NOT NULL,
    "id_tipo_envio" INTEGER,
    "data_requisicao" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prioridade_requisicao" BOOLEAN DEFAULT false,
    "observacao_requisicao" TEXT,
    "data_cadastro_requisicao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requisicao_pkey" PRIMARY KEY ("id_requisicao")
);

-- CreateTable
CREATE TABLE "usuario_perfil" (
    "id_usuario" INTEGER NOT NULL,
    "id_perfil" INTEGER NOT NULL,

    CONSTRAINT "usuario_perfil_pkey" PRIMARY KEY ("id_usuario","id_perfil")
);

-- CreateTable
CREATE TABLE "perfil_funcionalidade" (
    "id_perfil" INTEGER NOT NULL,
    "id_funcionalidade" INTEGER NOT NULL,

    CONSTRAINT "perfil_funcionalidade_pkey" PRIMARY KEY ("id_perfil","id_funcionalidade")
);

-- CreateTable
CREATE TABLE "item_requisicao" (
    "id_item_requisicao" SERIAL NOT NULL,
    "id_requisicao" INTEGER NOT NULL,
    "quantidade_solicitada" INTEGER NOT NULL,
    "quantidade_atendida" INTEGER DEFAULT 0,
    "data_cadastro_item_requisicao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_requisicao_pkey" PRIMARY KEY ("id_item_requisicao")
);

-- CreateTable
CREATE TABLE "etapa_requisicao" (
    "id_etapa_requisicao" SERIAL NOT NULL,
    "id_requisicao" INTEGER NOT NULL,
    "id_etapa_operacional" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "data_inicio" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(6),
    "status_etapa" VARCHAR(50) DEFAULT 'Iniciada',

    CONSTRAINT "etapa_requisicao_pkey" PRIMARY KEY ("id_etapa_requisicao")
);

-- CreateTable
CREATE TABLE "ocorrencia_etapa" (
    "id_ocorrencia_etapa" SERIAL NOT NULL,
    "id_etapa_requisicao" INTEGER NOT NULL,
    "id_usuario_registro" INTEGER NOT NULL,
    "descricao_ocorrencia" TEXT NOT NULL,
    "solucao_ocorrencia" TEXT,
    "status_ocorrencia" VARCHAR(50) DEFAULT 'Pendente',
    "data_cadastro_ocorrencia" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "data_solucao_ocorrencia" TIMESTAMP(6),

    CONSTRAINT "ocorrencia_etapa_pkey" PRIMARY KEY ("id_ocorrencia_etapa")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfis_nome_perfil_key" ON "perfis"("nome_perfil");

-- CreateIndex
CREATE UNIQUE INDEX "funcionalidades_chave_funcionalidade_key" ON "funcionalidades"("chave_funcionalidade");

-- CreateIndex
CREATE UNIQUE INDEX "situacoes_usuario_descricao_situacao_usuario_key" ON "situacoes_usuario"("descricao_situacao_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "situacoes_requisicao_descricao_situacao_requisicao_key" ON "situacoes_requisicao"("descricao_situacao_requisicao");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_envio_descricao_tipo_envio_key" ON "tipo_envio"("descricao_tipo_envio");

-- CreateIndex
CREATE UNIQUE INDEX "etapa_operacional_descricao_etapa_operacional_key" ON "etapa_operacional"("descricao_etapa_operacional");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_usuario_key" ON "usuario"("email_usuario");

-- AddForeignKey
ALTER TABLE "etapa_operacional" ADD CONSTRAINT "etapa_operacional_pre_etapa_id_fkey" FOREIGN KEY ("pre_etapa_id") REFERENCES "etapa_operacional"("id_etapa_operacional") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "etapa_operacional" ADD CONSTRAINT "etapa_operacional_pos_etapa_id_fkey" FOREIGN KEY ("pos_etapa_id") REFERENCES "etapa_operacional"("id_etapa_operacional") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_situacao_usuario_fkey" FOREIGN KEY ("id_situacao_usuario") REFERENCES "situacoes_usuario"("id_situacao_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisicao" ADD CONSTRAINT "requisicao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisicao" ADD CONSTRAINT "requisicao_id_situacao_requisicao_fkey" FOREIGN KEY ("id_situacao_requisicao") REFERENCES "situacoes_requisicao"("id_situacao_requisicao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisicao" ADD CONSTRAINT "requisicao_id_tipo_envio_fkey" FOREIGN KEY ("id_tipo_envio") REFERENCES "tipo_envio"("id_tipo_envio") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil" ADD CONSTRAINT "usuario_perfil_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil" ADD CONSTRAINT "usuario_perfil_id_perfil_fkey" FOREIGN KEY ("id_perfil") REFERENCES "perfis"("id_perfil") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_funcionalidade" ADD CONSTRAINT "perfil_funcionalidade_id_perfil_fkey" FOREIGN KEY ("id_perfil") REFERENCES "perfis"("id_perfil") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_funcionalidade" ADD CONSTRAINT "perfil_funcionalidade_id_funcionalidade_fkey" FOREIGN KEY ("id_funcionalidade") REFERENCES "funcionalidades"("id_funcionalidade") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_requisicao" ADD CONSTRAINT "item_requisicao_id_requisicao_fkey" FOREIGN KEY ("id_requisicao") REFERENCES "requisicao"("id_requisicao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa_requisicao" ADD CONSTRAINT "etapa_requisicao_id_requisicao_fkey" FOREIGN KEY ("id_requisicao") REFERENCES "requisicao"("id_requisicao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa_requisicao" ADD CONSTRAINT "etapa_requisicao_id_etapa_operacional_fkey" FOREIGN KEY ("id_etapa_operacional") REFERENCES "etapa_operacional"("id_etapa_operacional") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa_requisicao" ADD CONSTRAINT "etapa_requisicao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencia_etapa" ADD CONSTRAINT "ocorrencia_etapa_id_etapa_requisicao_fkey" FOREIGN KEY ("id_etapa_requisicao") REFERENCES "etapa_requisicao"("id_etapa_requisicao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencia_etapa" ADD CONSTRAINT "ocorrencia_etapa_id_usuario_registro_fkey" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
