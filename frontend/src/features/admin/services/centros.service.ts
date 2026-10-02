import type { CentroEstudios, CentroTrabajo } from '../../../types';

// Servicio para gestión de centros
class CentrosService {
  private baseUrl = '/api/centros';

  async obtenerCentrosEstudios(): Promise<CentroEstudios[]> {
    const response = await fetch(`${this.baseUrl}/estudios`);
    if (!response.ok) throw new Error('Error al obtener centros de estudios');
    return response.json();
  }

  async obtenerCentrosTrabajo(): Promise<CentroTrabajo[]> {
    const response = await fetch(`${this.baseUrl}/trabajo`);
    if (!response.ok) throw new Error('Error al obtener centros de trabajo');
    return response.json();
  }
}

export const centrosService = new CentrosService();