/** Extra/acompañamiento (admin). */
export interface Extra {
  id: number;
  categoria_id: number;
  nombre: string;
  precio: number;
  disponible: boolean;
}

/** Payload para crear/editar un extra. */
export interface ExtraPayload {
  categoria_id: number;
  nombre: string;
  precio: number;
  disponible: boolean;
}
