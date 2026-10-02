UPDATE [Usuarios]
SET [rol] = 'Tutor_Empresa'
WHERE [rol] = 'Responsable_Empresa';

UPDATE [Usuarios]
SET [rol] = 'Tutor_Academico'
WHERE [rol] = 'Responsable_Estudios';
