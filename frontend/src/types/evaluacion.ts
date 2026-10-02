export interface Evaluacion {
  idEvaluacion: number;
  idBecario: number;
  idTutorEvaluador: number;
  titulo: string;
  fechaEvaluacion: string;
  puntuacionPuntualidad: number;
  puntuacionCalidad: number;
  puntuacionActitud: number;
  puntuacionAutonomia: number;
  puntuacionComunicacion: number;
  puntuacionMedia: number | null;
  comentarios: string | null;
  createdAt: string;
  tutorEvaluador?: {
    idUsuario: number;
    nombre: string;
    apellidos: string;
    rol: string;
  };
}

export interface CreateEvaluacionData {
  titulo: string;
  descripcion: string;
  puntuacionPuntualidad: number;
  puntuacionCalidad: number;
  puntuacionActitud: number;
  puntuacionAutonomia: number;
  puntuacionComunicacion: number;
}

export interface CreateEvaluacionResponse {
  success: boolean;
  message: string;
  data: Evaluacion;
}

export interface GetEvaluacionesResponse {
  success: boolean;
  data: Evaluacion[];
  count: number;
}
