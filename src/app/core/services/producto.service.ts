import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, ApiResource, Producto, ProductoPayload } from '../models/producto.model';

/** Consumo del catalogo de productos (publico y administracion). */
@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /** GET /productos — catalogo publico, solo disponibles (Home cliente). */
  listarDisponibles(): Observable<Producto[]> {
    return this.http
      .get<ApiCollection<Producto>>(`${this.base}/productos`)
      .pipe(map((res) => res.data));
  }

  /** GET /admin/productos — listado completo (panel admin). */
  listarTodos(): Observable<Producto[]> {
    return this.http
      .get<ApiCollection<Producto>>(`${this.base}/admin/productos`)
      .pipe(map((res) => res.data));
  }

  /** POST multipart/form-data (necesario para poder adjuntar la imagen). */
  crear(payload: ProductoPayload, imagen?: File | null): Observable<Producto> {
    return this.http
      .post<ApiResource<Producto>>(`${this.base}/admin/productos`, this.aFormData(payload, imagen))
      .pipe(map((res) => res.data));
  }

  /**
   * POST con _method=PUT (spoofing) en vez de PUT real: los navegadores/Angular
   * no soportan multipart/form-data en un PUT nativo de forma confiable.
   * Si no se manda `imagen`, el backend conserva la imagen actual del producto.
   */
  actualizar(id: number, payload: ProductoPayload, imagen?: File | null): Observable<Producto> {
    const formData = this.aFormData(payload, imagen);
    formData.append('_method', 'PUT');
    return this.http
      .post<ApiResource<Producto>>(`${this.base}/admin/productos/${id}`, formData)
      .pipe(map((res) => res.data));
  }

  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/productos/${id}`);
  }

  private aFormData(payload: ProductoPayload, imagen?: File | null): FormData {
    const formData = new FormData();
    formData.append('categoria_id', String(payload.categoria_id));
    formData.append('nombre', payload.nombre);
    formData.append('descripcion', payload.descripcion ?? '');
    formData.append('precio_base', String(payload.precio_base));
    formData.append('destacado', payload.destacado ? '1' : '0');
    formData.append('disponible', payload.disponible ? '1' : '0');
    // Tamanos: siempre enviar como JSON array (vacio si no hay)
    formData.append('tamanos', JSON.stringify(payload.tamanos ?? []));
    if (imagen) {
      formData.append('imagen', imagen);
    }
    return formData;
  }
}
