import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, ApiResource } from '../models/producto.model';
import { Extra, ExtraPayload } from '../models/extra.model';

/** Consumo de extras/acompañamientos (panel admin). */
@Injectable({ providedIn: 'root' })
export class ExtraService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /** GET /admin/extras — listado completo. */
  listarTodos(): Observable<Extra[]> {
    return this.http
      .get<ApiCollection<Extra>>(`${this.base}/admin/extras`)
      .pipe(map((res) => res.data));
  }

  /** GET /admin/extras/{id} — detalle individual (incluye productos_asignados). */
  obtenerDetalle(id: number): Observable<Extra> {
    return this.http
      .get<ApiResource<Extra>>(`${this.base}/admin/extras/${id}`)
      .pipe(map((res) => res.data));
  }

  /** POST multipart/form-data (necesario para poder adjuntar la imagen). */
  crear(payload: ExtraPayload, imagen?: File | null): Observable<Extra> {
    return this.http
      .post<ApiResource<Extra>>(`${this.base}/admin/extras`, this.aFormData(payload, imagen))
      .pipe(map((res) => res.data));
  }

  /**
   * POST con _method=PUT (spoofing) en vez de PUT real: los navegadores/Angular
   * no soportan multipart/form-data en un PUT nativo de forma confiable
   * (mismo patron que ProductoService). Si no se manda `imagen`, el backend
   * conserva la imagen actual del extra.
   */
  actualizar(id: number, payload: ExtraPayload, imagen?: File | null): Observable<Extra> {
    const formData = this.aFormData(payload, imagen);
    formData.append('_method', 'PUT');
    return this.http
      .post<ApiResource<Extra>>(`${this.base}/admin/extras/${id}`, formData)
      .pipe(map((res) => res.data));
  }

  private aFormData(payload: ExtraPayload, imagen?: File | null): FormData {
    const formData = new FormData();
    formData.append('nombre', payload.nombre);
    formData.append('precio', String(payload.precio));
    formData.append('disponible', payload.disponible ? '1' : '0');
    formData.append('es_general', payload.es_general ? '1' : '0');
    // '' se convierte a null en Laravel (ConvertEmptyStringsToNull) -> extra general.
    formData.append('categoria_id', payload.categoria_id != null ? String(payload.categoria_id) : '');
    if (imagen) {
      formData.append('imagen', imagen);
    }
    return formData;
  }

  /** DELETE /admin/extras/{id} — eliminar extra. */
  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/extras/${id}`);
  }

  /** POST /admin/extras/{id}/productos — asignar extra a un producto. */
  asignarAProducto(extraId: number, productoId: number): Observable<unknown> {
    return this.http.post(`${this.base}/admin/extras/${extraId}/productos`, {
      producto_id: productoId,
    });
  }

  /** DELETE /admin/extras/{id}/productos/{productoId} — desasignar extra de un producto. */
  desasignarDeProducto(extraId: number, productoId: number): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/extras/${extraId}/productos/${productoId}`);
  }
}
