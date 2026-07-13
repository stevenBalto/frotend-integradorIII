import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, ApiResource } from '../models/producto.model';
import { Oferta, OfertaPayload } from '../models/oferta.model';

/** Consumo de ofertas (panel admin). */
@Injectable({ providedIn: 'root' })
export class OfertaService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

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

  /** POST /admin/ofertas — crear nueva oferta. */
  crear(payload: OfertaPayload): Observable<Oferta> {
    return this.http
      .post<ApiResource<Oferta>>(`${this.base}/admin/ofertas`, payload)
      .pipe(map((res) => res.data));
  }

  /** PUT /admin/ofertas/{id} — actualizar oferta existente. */
  actualizar(id: number, payload: OfertaPayload): Observable<Oferta> {
    return this.http
      .put<ApiResource<Oferta>>(`${this.base}/admin/ofertas/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  /** DELETE /admin/ofertas/{id} — eliminar oferta. */
  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/ofertas/${id}`);
  }
}
