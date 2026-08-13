/** Sede de Rooster Pizza & Grill. Varias sedes comparten menú, precios y clientes. */
export interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string | null;
  latitud: number | null;
  longitud: number | null;
  activa: boolean;
}

/**
 * Payload para crear una sede. `correo_admin` es obligatorio: al crearla el
 * backend genera su administrador, que solo verá los pedidos de esa sede.
 * `activa` no se envía: una sede no se desactiva.
 */
export interface CrearSucursalPayload {
  nombre: string;
  direccion: string;
  telefono?: string | null;
  correo_admin: string;
}

/** Payload para editar una sede (sin tocar su administrador). */
export interface SucursalPayload {
  nombre: string;
  direccion: string;
  telefono?: string | null;
}

/** Credenciales temporales del admin de la sede: se muestran UNA sola vez. */
export interface CredencialesSede {
  usuario: string;
  password: string;
}

/** Respuesta de POST /admin/sucursales. */
export interface SucursalCreada {
  sucursal: Sucursal;
  credenciales: CredencialesSede;
}
