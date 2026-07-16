import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection } from '../models/producto.model';
import { Sucursal } from '../models/sucursal.model';

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
}
