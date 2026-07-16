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

  /** POST /admin/extras — crear extra. */
  crear(payload: ExtraPayload): Observable<Extra> {
    return this.http
      .post<ApiResource<Extra>>(`${this.base}/admin/extras`, payload)
      .pipe(map((res) => res.data));
  }

  /** PUT /admin/extras/{id} — actualizar extra. */
  actualizar(id: number, payload: ExtraPayload): Observable<Extra> {
    return this.http
      .put<ApiResource<Extra>>(`${this.base}/admin/extras/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  /** DELETE /admin/extras/{id} — eliminar extra. */
  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/extras/${id}`);
  }
}
