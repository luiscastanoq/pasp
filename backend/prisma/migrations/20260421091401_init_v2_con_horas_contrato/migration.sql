BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Usuarios] (
    [id_usuario] INT NOT NULL IDENTITY(1,1),
    [email] VARCHAR(255) NOT NULL,
    [password_hash] VARCHAR(255) NOT NULL,
    [rol] VARCHAR(50) NOT NULL,
    [nombre] VARCHAR(100) NOT NULL,
    [apellidos] VARCHAR(150) NOT NULL,
    [practica] VARCHAR(100),
    [cliente] VARCHAR(100),
    [primer_acceso] BIT NOT NULL CONSTRAINT [Usuarios_primer_acceso_df] DEFAULT 1,
    [activo] BIT NOT NULL CONSTRAINT [Usuarios_activo_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Usuarios_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [Usuarios_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Usuarios_pkey] PRIMARY KEY CLUSTERED ([id_usuario]),
    CONSTRAINT [Usuarios_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Becarios] (
    [id_becario] INT NOT NULL IDENTITY(1,1),
    [id_usuario] INT NOT NULL,
    [telefono_personal] VARCHAR(20),
    [email_personal] VARCHAR(255),
    [linkedin] VARCHAR(255),
    [tipo_formacion] VARCHAR(50),
    [nombre_grado_universitario] VARCHAR(200),
    [nombre_formacion_profesional] VARCHAR(200),
    [centro_estudios] VARCHAR(200),
    [fecha_inicio_practicas] DATE NOT NULL,
    [fecha_fin_practicas] DATE,
    [horas_contrato] DECIMAL(7,2) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Becarios_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [Becarios_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Becarios_pkey] PRIMARY KEY CLUSTERED ([id_becario]),
    CONSTRAINT [Becarios_id_usuario_key] UNIQUE NONCLUSTERED ([id_usuario])
);

-- CreateTable
CREATE TABLE [dbo].[Tutor_Becario] (
    [id] INT NOT NULL IDENTITY(1,1),
    [id_tutor] INT NOT NULL,
    [id_becario] INT NOT NULL,
    [tipo_tutor] VARCHAR(50) NOT NULL,
    [fecha_asignacion] DATE NOT NULL CONSTRAINT [Tutor_Becario_fecha_asignacion_df] DEFAULT CURRENT_TIMESTAMP,
    [activo] BIT NOT NULL CONSTRAINT [Tutor_Becario_activo_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Tutor_Becario_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Tutor_Becario_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Tutor_Becario_id_becario_tipo_tutor_activo_key] UNIQUE NONCLUSTERED ([id_becario],[tipo_tutor],[activo])
);

-- CreateTable
CREATE TABLE [dbo].[Tareas] (
    [id_tarea] INT NOT NULL IDENTITY(1,1),
    [id_becario] INT NOT NULL,
    [id_tutor_asignador] INT NOT NULL,
    [nombre_tarea] VARCHAR(200) NOT NULL,
    [descripcion] TEXT,
    [estado] VARCHAR(50) NOT NULL,
    [fecha_inicio] DATE NOT NULL,
    [fecha_fin_estimada] DATE,
    [fecha_completada] DATE,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Tareas_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [Tareas_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Tareas_pkey] PRIMARY KEY CLUSTERED ([id_tarea])
);

-- CreateTable
CREATE TABLE [dbo].[Fichajes] (
    [id_fichaje] INT NOT NULL IDENTITY(1,1),
    [id_becario] INT NOT NULL,
    [fecha] DATE NOT NULL,
    [hora_entrada] DATETIME2 NOT NULL,
    [hora_salida] DATETIME2,
    [horas_trabajadas] DECIMAL(5,2),
    [estado] VARCHAR(50) NOT NULL,
    [justificacion] TEXT,
    [id_validador] INT,
    [fecha_validacion] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Fichajes_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [Fichajes_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Fichajes_pkey] PRIMARY KEY CLUSTERED ([id_fichaje]),
    CONSTRAINT [Fichajes_id_becario_fecha_key] UNIQUE NONCLUSTERED ([id_becario],[fecha])
);

-- CreateTable
CREATE TABLE [dbo].[Evaluaciones] (
    [id_evaluacion] INT NOT NULL IDENTITY(1,1),
    [id_becario] INT NOT NULL,
    [id_tutor_evaluador] INT NOT NULL,
    [fecha_evaluacion] DATE NOT NULL CONSTRAINT [Evaluaciones_fecha_evaluacion_df] DEFAULT CURRENT_TIMESTAMP,
    [puntuacion_puntualidad] TINYINT NOT NULL,
    [puntuacion_calidad] TINYINT NOT NULL,
    [puntuacion_actitud] TINYINT NOT NULL,
    [puntuacion_autonomia] TINYINT NOT NULL,
    [puntuacion_comunicacion] TINYINT NOT NULL,
    [comentarios] TEXT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Evaluaciones_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Evaluaciones_pkey] PRIMARY KEY CLUSTERED ([id_evaluacion])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_usuarios_email] ON [dbo].[Usuarios]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_usuarios_rol_activo] ON [dbo].[Usuarios]([rol], [activo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_usuarios_cliente] ON [dbo].[Usuarios]([cliente]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_usuarios_practica] ON [dbo].[Usuarios]([practica]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_becarios_usuario] ON [dbo].[Becarios]([id_usuario]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_becarios_tipo_formacion] ON [dbo].[Becarios]([tipo_formacion]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_tutor_becario_tutor] ON [dbo].[Tutor_Becario]([id_tutor]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_tutor_becario_becario] ON [dbo].[Tutor_Becario]([id_becario]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_tareas_becario_estado] ON [dbo].[Tareas]([id_becario], [estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_tareas_tutor] ON [dbo].[Tareas]([id_tutor_asignador]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_tareas_estado] ON [dbo].[Tareas]([estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_fichajes_becario_fecha] ON [dbo].[Fichajes]([id_becario], [fecha]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_fichajes_estado] ON [dbo].[Fichajes]([estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_fichajes_validador] ON [dbo].[Fichajes]([id_validador]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_evaluaciones_becario] ON [dbo].[Evaluaciones]([id_becario]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_evaluaciones_fecha] ON [dbo].[Evaluaciones]([fecha_evaluacion]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_evaluaciones_tutor] ON [dbo].[Evaluaciones]([id_tutor_evaluador]);

-- AddForeignKey
ALTER TABLE [dbo].[Becarios] ADD CONSTRAINT [Becarios_id_usuario_fkey] FOREIGN KEY ([id_usuario]) REFERENCES [dbo].[Usuarios]([id_usuario]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Tutor_Becario] ADD CONSTRAINT [Tutor_Becario_id_tutor_fkey] FOREIGN KEY ([id_tutor]) REFERENCES [dbo].[Usuarios]([id_usuario]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Tutor_Becario] ADD CONSTRAINT [Tutor_Becario_id_becario_fkey] FOREIGN KEY ([id_becario]) REFERENCES [dbo].[Becarios]([id_becario]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Tareas] ADD CONSTRAINT [Tareas_id_becario_fkey] FOREIGN KEY ([id_becario]) REFERENCES [dbo].[Becarios]([id_becario]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Tareas] ADD CONSTRAINT [Tareas_id_tutor_asignador_fkey] FOREIGN KEY ([id_tutor_asignador]) REFERENCES [dbo].[Usuarios]([id_usuario]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Fichajes] ADD CONSTRAINT [Fichajes_id_becario_fkey] FOREIGN KEY ([id_becario]) REFERENCES [dbo].[Becarios]([id_becario]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Fichajes] ADD CONSTRAINT [Fichajes_id_validador_fkey] FOREIGN KEY ([id_validador]) REFERENCES [dbo].[Usuarios]([id_usuario]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Evaluaciones] ADD CONSTRAINT [Evaluaciones_id_becario_fkey] FOREIGN KEY ([id_becario]) REFERENCES [dbo].[Becarios]([id_becario]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Evaluaciones] ADD CONSTRAINT [Evaluaciones_id_tutor_evaluador_fkey] FOREIGN KEY ([id_tutor_evaluador]) REFERENCES [dbo].[Usuarios]([id_usuario]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
