export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  puntos_balance: number;
  sucursal_id: number | null;
  rol: string;
  must_change_password?: boolean;
}

export interface AuthResponse {
  data: Usuario;
  token: string;
}

/**
 * Respuesta del login UNIFICADO. `tipo` indica a que panel enrutar.
 * `data` es un Usuario o un SuperAdmin segun el tipo (ver superadmin.model.ts).
 */
export interface LoginResultado {
  data: any;
  token: string;
  tipo: 'superadmin' | 'usuario';
}

/**
 * Respuesta cuando la contrasena esta expirada y se requiere cambiarla.
 * No incluye token porque el login no se completa.
 */
export interface PasswordExpiradaResponse {
  debe_cambiar_password: true;
  motivo: 'expirada' | 'obligatorio' | 'temporal';
  usuario: string;
  email: string;
}

/** Body para cambiar contrasena expirada. */
export interface CambiarPasswordExpiradaBody {
  login: string;
  password_actual: string;
  password_nueva: string;
  password_nueva_confirmation: string;
}
