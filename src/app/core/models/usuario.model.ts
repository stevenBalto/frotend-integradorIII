export interface Usuario {
  id: number;
  nombre: string;
  /** Nombre de usuario (login) del staff; puede faltar en clientes. */
  usuario?: string | null;
  email: string;
  telefono: string | null;
  activo?: boolean;
  puntos_balance: number;
  sucursal_id: number | null;
  rol: string;
  /** Módulos del panel con su nivel de acceso (solo lo trae GET /me para staff). */
  modulos?: { id: number; clave: string; nombre: string; permiso: 'lectura' | 'editor' }[];
  /**
   * La cuenta entró con Google. Si es true el correo NO se puede editar: es la
   * llave con la que Google identifica al usuario, así que cambiarlo de este
   * lado lo dejaría sin poder entrar. El backend expone solo este booleano,
   * nunca el google_id.
   */
  es_google?: boolean;
  /** Tiene foto de perfil guardada. La imagen se pide aparte (CuentaService). */
  tiene_foto?: boolean;
  must_change_password?: boolean;
}

/** Campos editables del propio perfil. El saldo de Roosters NO es editable. */
export interface ActualizarPerfilBody {
  nombre?: string;
  telefono?: string | null;
  email?: string;
  /** Obligatoria solo si cambia el correo (el backend la exige en ese caso). */
  password_actual?: string;
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
