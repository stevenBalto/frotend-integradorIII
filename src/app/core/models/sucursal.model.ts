/** Sucursal de Rooster Pizza & Grill. */
export interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string | null;
  activa: boolean;
}

/** Payload para crear/editar una sucursal (el instancia_id lo asigna el backend). */
export interface SucursalPayload {
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  activa?: boolean;
}
