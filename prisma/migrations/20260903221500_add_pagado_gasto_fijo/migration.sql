-- AlterTable
ALTER TABLE "Gasto" ADD COLUMN     "gastoFijoId" TEXT,
ADD COLUMN     "pagado" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Gasto_mesId_idx" ON "Gasto"("mesId");

-- CreateIndex
CREATE UNIQUE INDEX "Gasto_mesId_gastoFijoId_key" ON "Gasto"("mesId", "gastoFijoId");

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_gastoFijoId_fkey" FOREIGN KEY ("gastoFijoId") REFERENCES "GastoFijo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
