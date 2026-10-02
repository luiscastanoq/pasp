import type { Departamento } from '../../../types';

// Servicio para gestión de departamentos
class DepartamentosService {
  private baseUrl = '/api/departamentos';

  async obtenerDepartamentos(): Promise<Departamento[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) throw new Error('Error al obtener departamentos');
    return response.json();
  }
}

export const departamentosService = new DepartamentosService();