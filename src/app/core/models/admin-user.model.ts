/** Permiso individual para un modulo asignado a un usuario. */
export interface ModuloUsuario {
  id: number;
  clave: string;
  nombre: string;
  permiso: 'lectura' | 'editor';
}

/** Modulo disponible en el catalogo (para selector de permisos). */
export interface ModuloOpt {
  id: number;
  clave: string;
  nombre: string;
}

export interface RolOpt {
  id: number;
  nombre: string;
}

export interface AdminUser {
  id: number;
  nombre: string;
  usuario: string | null;
  email: string;
  telefono: string | null;
  activo: boolean;
  role_id: number;
  rol: string;
  dias_expiracion_password: number;
  password_expira_en: string | null;
  password_vencida: boolean;
  modulos: ModuloUsuario[];
}

export interface OpcionesUsuario {
  roles: RolOpt[];
  modulos: ModuloOpt[];
}

/** Body para crear un usuario (POST /api/admin/usuarios). */
export interface CrearUsuarioBody {
  nombre: string;
  usuario: string;
  email: string;
  telefono?: string | null;
  password: string;
  role_id: number;
  dias_expiracion_password: number;
  modulos: { modulo_id: number; permiso: 'lectura' | 'editor' }[];
}

/** Body para actualizar un usuario (PUT/PATCH, nunca incluye password). */
export interface ActualizarUsuarioBody {
  nombre?: string;
  usuario?: string;
  email?: string;
  telefono?: string | null;
  role_id?: number;
  dias_expiracion_password?: number;
  modulos?: { modulo_id: number; permiso: 'lectura' | 'editor' }[];
}
