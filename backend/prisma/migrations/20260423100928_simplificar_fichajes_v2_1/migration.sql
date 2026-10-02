/*
  Warnings:

  - You are about to drop the column `estado` on the `Fichajes` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_validacion` on the `Fichajes` table. All the data in the column will be lost.
  - You are about to drop the column `id_validador` on the `Fichajes` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Fichajes] DROP CONSTRAINT [Fichajes_id_validador_fkey];

-- DropIndex
DROP INDEX [idx_fichajes_estado] ON [dbo].[Fichajes];

-- DropIndex
DROP INDEX [idx_fichajes_validador] ON [dbo].[Fichajes];

-- AlterTable
ALTER TABLE [dbo].[Fichajes] DROP COLUMN [estado],
[fecha_validacion],
[id_validador];
ALTER TABLE [dbo].[Fichajes] ADD [horas_imputadas] DECIMAL(5,2);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
