import { describe, expect, it } from 'vitest';

import { createEvaluacionSchema } from './evaluaciones.schemas';

const evaluacionValida = {
  titulo: 'Seguimiento de julio',
  descripcion: 'La evolucion ha sido positiva.',
  puntuacionPuntualidad: 5,
  puntuacionCalidad: 4,
  puntuacionActitud: 5,
  puntuacionAutonomia: 3,
  puntuacionComunicacion: 4,
};

describe('createEvaluacionSchema', () => {
  it('acepta una evaluacion completa con puntuaciones validas', () => {
    // Este es el camino normal: todas las notas son enteros comprendidos entre 1 y 5.
    expect(createEvaluacionSchema.safeParse(evaluacionValida).success).toBe(true);
  });

  it('rechaza puntuaciones menores que 1 o mayores que 5', () => {
    // El rango evita notas que luego harian que la media y la interfaz fueran incoherentes.
    const demasiadoBaja = createEvaluacionSchema.safeParse({
      ...evaluacionValida,
      puntuacionCalidad: 0,
    });
    const demasiadoAlta = createEvaluacionSchema.safeParse({
      ...evaluacionValida,
      puntuacionCalidad: 6,
    });

    expect(demasiadoBaja.success).toBe(false);
    expect(demasiadoAlta.success).toBe(false);
  });

  it('rechaza puntuaciones decimales', () => {
    // La aplicacion trabaja con opciones enteras; una nota como 3.5 no debe llegar al servicio.
    const result = createEvaluacionSchema.safeParse({
      ...evaluacionValida,
      puntuacionAutonomia: 3.5,
    });

    expect(result.success).toBe(false);
  });

  it('rechaza titulo y descripcion vacios', () => {
    // Los textos dan contexto a la evaluacion y por eso no pueden contener solo espacios.
    const result = createEvaluacionSchema.safeParse({
      ...evaluacionValida,
      titulo: '   ',
      descripcion: '',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map(issue => issue.path[0])).toEqual(
      expect.arrayContaining(['titulo', 'descripcion']),
    );
  });
});
