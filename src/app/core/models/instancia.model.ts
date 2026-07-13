export interface Instancia {
  id: number;
  nombre: string;
  correo_principal: string | null;
  estado: string; // 'activa' | 'inactiva' | 'suspendida'
  usuarios_count: number;
  created_at: string | null;
}

export interface CredencialesTemporales {
  usuario: string;
  password: string;
}

export interface CrearInstanciaResp {
  data: Instancia;
  credenciales: CredencialesTemporales;
}

export interface CrearInstanciaBody {
  nombre: string;
  correo_principal: string;
}

export interface ActualizarInstanciaBody {
  nombre?: string;
  correo_principal?: string;
  estado?: string;
}
