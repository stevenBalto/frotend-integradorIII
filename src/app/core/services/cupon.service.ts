import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, ApiResource } from '../models/producto.model';
import { Cupon, CuponPayload } from '../models/cupon.model';

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

  /** POST /admin/cupones — crear nuevo cupon. */
  crear(payload: CuponPayload): Observable<Cupon> {
    return this.http
      .post<ApiResource<Cupon>>(`${this.base}/admin/cupones`, payload)
      .pipe(map((res) => res.data));
  }

  /** PUT /admin/cupones/{id} — actualizar cupon existente. */
  actualizar(id: number, payload: CuponPayload): Observable<Cupon> {
    return this.http
      .put<ApiResource<Cupon>>(`${this.base}/admin/cupones/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  /** DELETE /admin/cupones/{id} — eliminar cupon. */
  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/cupones/${id}`);
  }
}
