import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, ApiResource } from '../models/producto.model';
import { Sucursal, SucursalPayload } from '../models/sucursal.model';

/** Consumo del catalogo de sucursales. */
@Injectable({ providedIn: 'root' })
export class SucursalService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /** GET /sucursales — sucursales activas (requiere auth). */
  listarActivas(): Observable<Sucursal[]> {
    return this.http
      .get<ApiCollection<Sucursal>>(`${this.base}/sucursales`)
      .pipe(map((res) => res.data));
  }

  /** GET /admin/sucursales — todas las sucursales del tenant (incluye inactivas). */
  listarAdmin(): Observable<Sucursal[]> {
    return this.http
      .get<ApiCollection<Sucursal>>(`${this.base}/admin/sucursales`)
      .pipe(map((res) => res.data));
  }

  /** POST /admin/sucursales — crear sucursal (instancia_id lo asigna el backend). */
  crear(payload: SucursalPayload): Observable<Sucursal> {
    return this.http
      .post<ApiResource<Sucursal>>(`${this.base}/admin/sucursales`, payload)
      .pipe(map((res) => res.data));
  }

  /** PUT /admin/sucursales/{id} — actualizar sucursal. */
  actualizar(id: number, payload: SucursalPayload): Observable<Sucursal> {
    return this.http
      .put<ApiResource<Sucursal>>(`${this.base}/admin/sucursales/${id}`, payload)
      .pipe(map((res) => res.data));
  }
}
