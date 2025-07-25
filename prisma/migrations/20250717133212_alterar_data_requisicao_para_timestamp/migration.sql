-- AlterTable
ALTER TABLE "requisicao" ALTER COLUMN "data_requisicao" SET DATA TYPE TIMESTAMP(6);

-- AddForeignKey
ALTER TABLE "ocorrencia_etapa" ADD CONSTRAINT "ocorrencia_etapa_id_usuario_registro_fkey" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
