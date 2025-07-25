-- CreateTable
CREATE TABLE "volume" (
    "id_volume" SERIAL NOT NULL,
    "id_requisicao" INTEGER NOT NULL,
    "comprimento" DOUBLE PRECISION,
    "largura" DOUBLE PRECISION,
    "altura" DOUBLE PRECISION,
    "peso" DOUBLE PRECISION,

    CONSTRAINT "volume_pkey" PRIMARY KEY ("id_volume")
);

-- AddForeignKey
ALTER TABLE "volume" ADD CONSTRAINT "volume_id_requisicao_fkey" FOREIGN KEY ("id_requisicao") REFERENCES "requisicao"("id_requisicao") ON DELETE CASCADE ON UPDATE CASCADE;
