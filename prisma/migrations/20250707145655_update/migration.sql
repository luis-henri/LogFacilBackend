/*
  Warnings:

  - You are about to drop the column `pos_etapa_id` on the `etapa_operacional` table. All the data in the column will be lost.
  - You are about to drop the column `pre_etapa_id` on the `etapa_operacional` table. All the data in the column will be lost.
  - You are about to drop the column `quantidade_atendida` on the `item_requisicao` table. All the data in the column will be lost.
  - You are about to drop the column `quantidade_solicitada` on the `item_requisicao` table. All the data in the column will be lost.
  - You are about to drop the column `id_tipo_envio` on the `requisicao` table. All the data in the column will be lost.
  - You are about to drop the `etapa_requisicao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `funcionalidades` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `perfis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `situacoes_requisicao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `situacoes_usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tipo_envio` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cpf_usuario]` on the table `usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `quantidade_solicitada_item_requisicao` to the `item_requisicao` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "etapa_operacional" DROP CONSTRAINT "etapa_operacional_pos_etapa_id_fkey";

-- DropForeignKey
ALTER TABLE "etapa_operacional" DROP CONSTRAINT "etapa_operacional_pre_etapa_id_fkey";

-- DropForeignKey
ALTER TABLE "etapa_requisicao" DROP CONSTRAINT "etapa_requisicao_id_etapa_operacional_fkey";

-- DropForeignKey
ALTER TABLE "etapa_requisicao" DROP CONSTRAINT "etapa_requisicao_id_requisicao_fkey";

-- DropForeignKey
ALTER TABLE "etapa_requisicao" DROP CONSTRAINT "etapa_requisicao_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "ocorrencia_etapa" DROP CONSTRAINT "ocorrencia_etapa_id_etapa_requisicao_fkey";

-- DropForeignKey
ALTER TABLE "ocorrencia_etapa" DROP CONSTRAINT "ocorrencia_etapa_id_usuario_registro_fkey";

-- DropForeignKey
ALTER TABLE "perfil_funcionalidade" DROP CONSTRAINT "perfil_funcionalidade_id_funcionalidade_fkey";

-- DropForeignKey
ALTER TABLE "perfil_funcionalidade" DROP CONSTRAINT "perfil_funcionalidade_id_perfil_fkey";

-- DropForeignKey
ALTER TABLE "requisicao" DROP CONSTRAINT "requisicao_id_situacao_requisicao_fkey";

-- DropForeignKey
ALTER TABLE "requisicao" DROP CONSTRAINT "requisicao_id_tipo_envio_fkey";

-- DropForeignKey
ALTER TABLE "usuario" DROP CONSTRAINT "usuario_id_situacao_usuario_fkey";

-- DropForeignKey
ALTER TABLE "usuario_perfil" DROP CONSTRAINT "usuario_perfil_id_perfil_fkey";

-- AlterTable
ALTER TABLE "etapa_operacional" DROP COLUMN "pos_etapa_id",
DROP COLUMN "pre_etapa_id",
ADD COLUMN     "ativa_etapa_operacional" BOOLEAN DEFAULT true,
ADD COLUMN     "data_cadastro_etapa_operacional" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pos_etapa_operacional_id" INTEGER,
ADD COLUMN     "pre_etapa_operacional_id" INTEGER;

-- AlterTable
ALTER TABLE "item_requisicao" DROP COLUMN "quantidade_atendida",
DROP COLUMN "quantidade_solicitada",
ADD COLUMN     "descricao_material_item_requisicao" VARCHAR(255),
ADD COLUMN     "endereco_item_requisicao" VARCHAR(50),
ADD COLUMN     "quantidade_atendida_item_requisicao" INTEGER DEFAULT 0,
ADD COLUMN     "quantidade_solicitada_item_requisicao" INTEGER NOT NULL,
ADD COLUMN     "unidade_material_item_requisicao" VARCHAR(20);

-- AlterTable
ALTER TABLE "requisicao" DROP COLUMN "id_tipo_envio",
ADD COLUMN     "id_tipo_envio_requisicao" INTEGER;

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "cpf_usuario" VARCHAR(14),
ADD COLUMN     "id_cargo_usuario" INTEGER;

-- DropTable
DROP TABLE "etapa_requisicao";

-- DropTable
DROP TABLE "funcionalidades";

-- DropTable
DROP TABLE "perfis";

-- DropTable
DROP TABLE "situacoes_requisicao";

-- DropTable
DROP TABLE "situacoes_usuario";

-- DropTable
DROP TABLE "tipo_envio";

-- CreateTable
CREATE TABLE "perfil" (
    "id_perfil" SERIAL NOT NULL,
    "nome_perfil" VARCHAR(100) NOT NULL,
    "descricao_perfil" TEXT,

    CONSTRAINT "perfil_pkey" PRIMARY KEY ("id_perfil")
);

-- CreateTable
CREATE TABLE "funcionalidade" (
    "id_funcionalidade" SERIAL NOT NULL,
    "nome_funcionalidade" VARCHAR(100) NOT NULL,
    "chave_funcionalidade" VARCHAR(50) NOT NULL,
    "descricao_funcionalidade" TEXT,

    CONSTRAINT "funcionalidade_pkey" PRIMARY KEY ("id_funcionalidade")
);

-- CreateTable
CREATE TABLE "situacao_usuario" (
    "id_situacao_usuario" SERIAL NOT NULL,
    "descricao_situacao_usuario" VARCHAR(50) NOT NULL,
    "ativa_situacao_usuario" BOOLEAN DEFAULT true,
    "data_cadastro_situacao_usuario" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "situacao_usuario_pkey" PRIMARY KEY ("id_situacao_usuario")
);

-- CreateTable
CREATE TABLE "cargo_usuario" (
    "id_cargo_usuario" SERIAL NOT NULL,
    "descricao_cargo_usuario" VARCHAR(100) NOT NULL,
    "ativa_cargo_usuario" BOOLEAN DEFAULT true,
    "data_cadastro_cargo_usuario" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargo_usuario_pkey" PRIMARY KEY ("id_cargo_usuario")
);

-- CreateTable
CREATE TABLE "situacao_requisicao" (
    "id_situacao_requisicao" SERIAL NOT NULL,
    "descricao_situacao_requisicao" VARCHAR(100) NOT NULL,
    "ativa_situacao_requisicao" BOOLEAN DEFAULT true,
    "data_cadastro_situacao_requisicao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "situacao_requisicao_pkey" PRIMARY KEY ("id_situacao_requisicao")
);

-- CreateTable
CREATE TABLE "tipo_envio_requisicao" (
    "id_tipo_envio_requisicao" SERIAL NOT NULL,
    "descricao_tipo_envio_requisicao" VARCHAR(100) NOT NULL,
    "ativa_tipo_envio_requisicao" BOOLEAN DEFAULT true,
    "data_cadastro_tipo_envio_requisicao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipo_envio_requisicao_pkey" PRIMARY KEY ("id_tipo_envio_requisicao")
);

-- CreateTable
CREATE TABLE "situacao_etapa_operacional_requisicao" (
    "id_situacao_etapa_operacional_requisicao" SERIAL NOT NULL,
    "descricao_situacao_etapa_operacional_requisicao" VARCHAR(100) NOT NULL,
    "ativa_situacao_etapa_operacional_requisicao" BOOLEAN DEFAULT true,
    "data_cadastro_situacao_etapa_operacional_requisicao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "situacao_etapa_operacional_requisicao_pkey" PRIMARY KEY ("id_situacao_etapa_operacional_requisicao")
);

-- CreateTable
CREATE TABLE "etapa_operacional_requisicao" (
    "id_etapa_operacional_requisicao" SERIAL NOT NULL,
    "id_requisicao" INTEGER NOT NULL,
    "id_etapa_operacional" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_situacao_etapa_operacional_requisicao" INTEGER NOT NULL,
    "data_inicio_etapa_operacional_requisicao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim_etapa_operacional_requisicao" TIMESTAMP(6),
    "data_cadastro_etapa_operacional_requisicao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etapa_operacional_requisicao_pkey" PRIMARY KEY ("id_etapa_operacional_requisicao")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfil_nome_perfil_key" ON "perfil"("nome_perfil");

-- CreateIndex
CREATE UNIQUE INDEX "funcionalidade_chave_funcionalidade_key" ON "funcionalidade"("chave_funcionalidade");

-- CreateIndex
CREATE UNIQUE INDEX "situacao_usuario_descricao_situacao_usuario_key" ON "situacao_usuario"("descricao_situacao_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_usuario_descricao_cargo_usuario_key" ON "cargo_usuario"("descricao_cargo_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "situacao_requisicao_descricao_situacao_requisicao_key" ON "situacao_requisicao"("descricao_situacao_requisicao");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_envio_requisicao_descricao_tipo_envio_requisicao_key" ON "tipo_envio_requisicao"("descricao_tipo_envio_requisicao");

-- CreateIndex
CREATE UNIQUE INDEX "situacao_etapa_operacional_requisicao_descricao_situacao_et_key" ON "situacao_etapa_operacional_requisicao"("descricao_situacao_etapa_operacional_requisicao");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_cpf_usuario_key" ON "usuario"("cpf_usuario");

-- AddForeignKey
ALTER TABLE "etapa_operacional" ADD CONSTRAINT "etapa_operacional_pre_etapa_operacional_id_fkey" FOREIGN KEY ("pre_etapa_operacional_id") REFERENCES "etapa_operacional"("id_etapa_operacional") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "etapa_operacional" ADD CONSTRAINT "etapa_operacional_pos_etapa_operacional_id_fkey" FOREIGN KEY ("pos_etapa_operacional_id") REFERENCES "etapa_operacional"("id_etapa_operacional") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_situacao_usuario_fkey" FOREIGN KEY ("id_situacao_usuario") REFERENCES "situacao_usuario"("id_situacao_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_cargo_usuario_fkey" FOREIGN KEY ("id_cargo_usuario") REFERENCES "cargo_usuario"("id_cargo_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisicao" ADD CONSTRAINT "requisicao_id_situacao_requisicao_fkey" FOREIGN KEY ("id_situacao_requisicao") REFERENCES "situacao_requisicao"("id_situacao_requisicao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisicao" ADD CONSTRAINT "requisicao_id_tipo_envio_requisicao_fkey" FOREIGN KEY ("id_tipo_envio_requisicao") REFERENCES "tipo_envio_requisicao"("id_tipo_envio_requisicao") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_perfil" ADD CONSTRAINT "usuario_perfil_id_perfil_fkey" FOREIGN KEY ("id_perfil") REFERENCES "perfil"("id_perfil") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_funcionalidade" ADD CONSTRAINT "perfil_funcionalidade_id_perfil_fkey" FOREIGN KEY ("id_perfil") REFERENCES "perfil"("id_perfil") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_funcionalidade" ADD CONSTRAINT "perfil_funcionalidade_id_funcionalidade_fkey" FOREIGN KEY ("id_funcionalidade") REFERENCES "funcionalidade"("id_funcionalidade") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa_operacional_requisicao" ADD CONSTRAINT "etapa_operacional_requisicao_id_requisicao_fkey" FOREIGN KEY ("id_requisicao") REFERENCES "requisicao"("id_requisicao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa_operacional_requisicao" ADD CONSTRAINT "etapa_operacional_requisicao_id_etapa_operacional_fkey" FOREIGN KEY ("id_etapa_operacional") REFERENCES "etapa_operacional"("id_etapa_operacional") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa_operacional_requisicao" ADD CONSTRAINT "etapa_operacional_requisicao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa_operacional_requisicao" ADD CONSTRAINT "etapa_operacional_requisicao_id_situacao_etapa_operacional_fkey" FOREIGN KEY ("id_situacao_etapa_operacional_requisicao") REFERENCES "situacao_etapa_operacional_requisicao"("id_situacao_etapa_operacional_requisicao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencia_etapa" ADD CONSTRAINT "ocorrencia_etapa_id_etapa_requisicao_fkey" FOREIGN KEY ("id_etapa_requisicao") REFERENCES "etapa_operacional_requisicao"("id_etapa_operacional_requisicao") ON DELETE RESTRICT ON UPDATE CASCADE;
