export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  puntos_balance: number;
  sucursal_id: number | null;
  rol: string;
}

export interface AuthResponse {
  data: Usuario;
  token: string;
}

/**
 * Respuesta del login UNIFICADO. `tipo` indica a qué panel enrutar.
 * `data` es un Usuario o un SuperAdmin según el tipo (ver superadmin.model.ts).
 */
export interface LoginResultado {
  data: any;
  token: string;
  tipo: 'superadmin' | 'usuario';
}
