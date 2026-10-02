BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Tarea_Historial] (
    [id_historial] INT NOT NULL IDENTITY(1,1),
    [id_tarea] INT NOT NULL,
    [estado_anterior] VARCHAR(50),
    [estado_nuevo] VARCHAR(50) NOT NULL,
    [id_usuario_modificador] INT NOT NULL,
    [fecha_cambio] DATETIME2 NOT NULL CONSTRAINT [Tarea_Historial_fecha_cambio_df] DEFAULT CURRENT_TIMESTAMP,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Tarea_Historial_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Tarea_Historial_pkey] PRIMARY KEY CLUSTERED ([id_historial])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_tarea_historial_tarea_fecha] ON [dbo].[Tarea_Historial]([id_tarea], [fecha_cambio]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_tarea_historial_usuario] ON [dbo].[Tarea_Historial]([id_usuario_modificador]);

-- AddForeignKey
ALTER TABLE [dbo].[Tarea_Historial] ADD CONSTRAINT [Tarea_Historial_id_tarea_fkey] FOREIGN KEY ([id_tarea]) REFERENCES [dbo].[Tareas]([id_tarea]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Tarea_Historial] ADD CONSTRAINT [Tarea_Historial_id_usuario_modificador_fkey] FOREIGN KEY ([id_usuario_modificador]) REFERENCES [dbo].[Usuarios]([id_usuario]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
