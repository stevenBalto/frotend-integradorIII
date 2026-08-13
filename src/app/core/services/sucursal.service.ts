import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection } from '../models/producto.model';
import { Sucursal } from '../models/sucursal.model';

/**
 * Lectura del catálogo de sedes (cliente y panel admin).
 *
 * El alta y la edición NO viven acá: las sedes se dan de alta únicamente desde
 * el panel de superadmin (ver SedeSuperadminService).
 */
@Injectable({ providedIn: 'root' })
export class SucursalService {
  private http = inject(HttpClient);

  private readonly base = environment.apiBaseUrl;

  /** GET /sucursales — sedes disponibles para elegir al pedir. */
  listarActivas(): Observable<Sucursal[]> {
    return this.http
      .get<ApiCollection<Sucursal>>(`${this.base}/sucursales`)
      .pipe(map((res) => res.data));
  }

  /** GET /admin/sucursales — sedes del negocio, para el panel admin. */
  listarAdmin(): Observable<Sucursal[]> {
    return this.http
      .get<ApiCollection<Sucursal>>(`${this.base}/admin/sucursales`)
      .pipe(map((res) => res.data));
  }
}
