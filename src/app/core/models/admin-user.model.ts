export interface ModuloOpt {
  id: number;
  clave: string;
  nombre: string;
  orden: number;
}

export interface RolOpt {
  id: number;
  nombre: string;
  descripcion: string | null;
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
  sucursal_id: number | null;
  password_temporal: boolean;
  cambio_password_obligatorio: boolean;
  ultimo_acceso_en: string | null;
  created_at: string | null;
  modulos: number[];
}

export interface OpcionesUsuario {
  roles: RolOpt[];
  modulos: ModuloOpt[];
}

export interface CrearUsuarioBody {
  nombre: string;
  usuario: string;
  email: string;
  telefono?: string | null;
  password: string;
  role_id: number;
  modulos: number[];
}

export interface ActualizarUsuarioBody {
  nombre?: string;
  usuario?: string;
  email?: string;
  telefono?: string | null;
  role_id?: number;
  activo?: boolean;
  modulos?: number[];
}
