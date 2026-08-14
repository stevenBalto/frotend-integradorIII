import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, ApiResource } from '../models/producto.model';
import { Oferta, OfertaPayload, OfertaImagenOpts } from '../models/oferta.model';

/** Consumo de ofertas (panel admin). */
@Injectable({ providedIn: 'root' })
export class OfertaService {
  private http = inject(HttpClient);

  private readonly base = environment.apiBaseUrl;

  /** GET /admin/ofertas — listado completo (panel admin). */
  listarTodos(): Observable<Oferta[]> {
    return this.http
      .get<ApiCollection<Oferta>>(`${this.base}/admin/ofertas`)
      .pipe(map((res) => res.data));
  }

  /** GET /ofertas — listado publico de ofertas activas para cliente. */
  listarPublicas(): Observable<Oferta[]> {
    return this.http
      .get<ApiCollection<Oferta>>(`${this.base}/ofertas`)
      .pipe(map((res) => res.data));
  }

  /** POST /admin/ofertas — crear nueva oferta (multipart/form-data). */
  crear(payload: OfertaPayload, imagenOpts?: OfertaImagenOpts): Observable<Oferta> {
    const formData = this.buildFormData(payload, imagenOpts);
    return this.http
      .post<ApiResource<Oferta>>(`${this.base}/admin/ofertas`, formData)
      .pipe(map((res) => res.data));
  }

  /** PUT /admin/ofertas/{id} — actualizar oferta existente (via POST + _method=PUT para multipart). */
  actualizar(id: number, payload: OfertaPayload, imagenOpts?: OfertaImagenOpts): Observable<Oferta> {
    const formData = this.buildFormData(payload, imagenOpts);
    formData.append('_method', 'PUT');
    return this.http
      .post<ApiResource<Oferta>>(`${this.base}/admin/ofertas/${id}`, formData)
      .pipe(map((res) => res.data));
  }

  /** DELETE /admin/ofertas/{id} — eliminar oferta. */
  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/ofertas/${id}`);
  }

  /** Construye el FormData para crear/actualizar oferta. */
  private buildFormData(payload: OfertaPayload, imagenOpts?: OfertaImagenOpts): FormData {
    const fd = new FormData();

    fd.append('nombre', payload.nombre);
    if (payload.descripcion !== undefined && payload.descripcion !== null) {
      fd.append('descripcion', payload.descripcion);
    }
    fd.append('tipo_descuento', payload.tipo_descuento);
    fd.append('valor', String(payload.valor));
    if (payload.fecha_inicio) {
      fd.append('fecha_inicio', payload.fecha_inicio);
    }
    if (payload.fecha_fin) {
      fd.append('fecha_fin', payload.fecha_fin);
    }
    // Booleano como '1'/'0' para que Laravel lo interprete correctamente
    fd.append('activa', payload.activa ? '1' : '0');

    // Array de producto_ids: append repetido con clave[]
    for (const pid of payload.producto_ids) {
      fd.append('producto_ids[]', String(pid));
    }

    fd.append('alcance', payload.alcance);
    for (const cid of payload.cliente_ids) {
      fd.append('cliente_ids[]', String(cid));
    }

    fd.append('alcance_sedes', payload.alcance_sedes);
    for (const sid of payload.sucursal_ids) {
      fd.append('sucursal_ids[]', String(sid));
    }

    // Imagen: archivo tiene prioridad sobre URL
    if (imagenOpts?.imagen) {
      fd.append('imagen', imagenOpts.imagen);
    } else if (imagenOpts?.imagen_url) {
      fd.append('imagen_url', imagenOpts.imagen_url);
    }

    return fd;
  }
}
