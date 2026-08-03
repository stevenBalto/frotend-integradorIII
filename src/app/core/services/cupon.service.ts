import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, ApiResource } from '../models/producto.model';
import { Cupon, CuponPayload, CuponImagenOpts } from '../models/cupon.model';

export interface CuponValidado {
  data: Cupon;
  descuento_estimado: number | null;
}

/** Consumo de cupones (panel admin). */
@Injectable({ providedIn: 'root' })
export class CuponService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /** GET /admin/cupones — listado completo (panel admin). */
  listarTodos(): Observable<Cupon[]> {
    return this.http
      .get<ApiCollection<Cupon>>(`${this.base}/admin/cupones`)
      .pipe(map((res) => res.data));
  }

  /** GET /cupones — listado publico de cupones activos. */
  listarPublicos(): Observable<Cupon[]> {
    return this.http
      .get<ApiCollection<Cupon>>(`${this.base}/cupones`)
      .pipe(map((res) => res.data));
  }

  /** POST /admin/cupones — crear nuevo cupon (multipart/form-data). */
  crear(payload: CuponPayload, imagenOpts?: CuponImagenOpts): Observable<Cupon> {
    const formData = this.buildFormData(payload, imagenOpts);
    return this.http
      .post<ApiResource<Cupon>>(`${this.base}/admin/cupones`, formData)
      .pipe(map((res) => res.data));
  }

  /** PUT /admin/cupones/{id} — actualizar cupon existente (via POST + _method=PUT para multipart). */
  actualizar(id: number, payload: CuponPayload, imagenOpts?: CuponImagenOpts): Observable<Cupon> {
    const formData = this.buildFormData(payload, imagenOpts);
    formData.append('_method', 'PUT');
    return this.http
      .post<ApiResource<Cupon>>(`${this.base}/admin/cupones/${id}`, formData)
      .pipe(map((res) => res.data));
  }

  /** DELETE /admin/cupones/{id} — eliminar cupon. */
  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/cupones/${id}`);
  }

  /** POST /admin/cupones/validar — valida un codigo (vigencia/usos) antes de canjearlo. */
  validar(codigo: string, subtotal?: number): Observable<CuponValidado> {
    return this.http.post<CuponValidado>(`${this.base}/admin/cupones/validar`, { codigo, subtotal });
  }

  /** Construye el FormData para crear/actualizar cupon. */
  private buildFormData(payload: CuponPayload, imagenOpts?: CuponImagenOpts): FormData {
    const fd = new FormData();

    fd.append('codigo', payload.codigo);
    fd.append('tipo', payload.tipo);
    fd.append('valor', String(payload.valor));

    if (payload.monto_minimo !== undefined && payload.monto_minimo !== null) {
      fd.append('monto_minimo', String(payload.monto_minimo));
    }
    if (payload.fecha_inicio) {
      fd.append('fecha_inicio', payload.fecha_inicio);
    }
    if (payload.fecha_fin) {
      fd.append('fecha_fin', payload.fecha_fin);
    }
    if (payload.usos_max !== undefined && payload.usos_max !== null) {
      fd.append('usos_max', String(payload.usos_max));
    }
    // Booleano como '1'/'0' para que Laravel lo interprete correctamente
    fd.append('activo', payload.activo ? '1' : '0');

    // Imagen: archivo tiene prioridad sobre URL
    if (imagenOpts?.imagen) {
      fd.append('imagen', imagenOpts.imagen);
    } else if (imagenOpts?.imagen_url) {
      fd.append('imagen_url', imagenOpts.imagen_url);
    }

    return fd;
  }
}
