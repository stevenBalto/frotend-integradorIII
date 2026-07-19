/** Producto asignado puntualmente a un extra (solo en el detalle individual). */
export interface ExtraProductoAsignado {
  id: number;
  nombre: string;
}

/** Extra/acompañamiento (admin). */
export interface Extra {
  id: number;
  /** null cuando el extra es general (aplica a todos los productos). */
  categoria_id: number | null;
  nombre: string;
  precio: number;
  disponible: boolean;
  /** true = aplica a todos los productos; false = acotado a una categoria. */
  es_general: boolean;
  /** Solo presente en el detalle individual (GET /admin/extras/{id}). */
  productos_asignados?: ExtraProductoAsignado[];
}

/** Payload para crear/editar un extra. */
export interface ExtraPayload {
  nombre: string;
  precio: number;
  disponible: boolean;
  es_general: boolean;
  /** Obligatorio cuando es_general = false; null cuando es_general = true. */
  categoria_id: number | null;
}
