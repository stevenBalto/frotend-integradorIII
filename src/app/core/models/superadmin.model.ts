export interface SuperAdmin {
  id: number;
  nombre: string;
  usuario: string;
  email: string;
  activo: boolean;
  ultimo_acceso_en: string | null;
  created_at: string | null;
}

export interface SuperAdminAuthResponse {
  data: SuperAdmin;
  token: string;
}

export interface SuperAdminLoginBody {
  login: string;
  password: string;
}

export interface CrearSuperAdminBody {
  nombre: string;
  usuario: string;
  email: string;
  password: string;
  password_confirmation: string;
}
