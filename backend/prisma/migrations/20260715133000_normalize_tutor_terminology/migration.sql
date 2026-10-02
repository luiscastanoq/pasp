UPDATE [Usuarios]
SET [rol] = 'Tutor_Empresa'
WHERE [rol] = 'Responsable_Empresa';

UPDATE [Usuarios]
SET [rol] = 'Tutor_Academico'
WHERE [rol] IN ('Responsable_Estudios', 'Responsable_Academico');

UPDATE [Tutor_Becario]
SET [tipo_tutor] = 'Academico'
WHERE [tipo_tutor] = 'Estudios';
