export interface Producto {
  id: number;
  categoria_id: number;
  categoria: string | null;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagen_url: string | null;
  destacado: boolean;
  disponible: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
}

export interface ProductoPayload {
  categoria_id: number;
  nombre: string;
  descripcion?: string | null;
  precio_base: number;
  destacado?: boolean;
  disponible?: boolean;
}

export interface ApiCollection<T> {
  data: T[];
}

export interface ApiResource<T> {
  data: T;
}
