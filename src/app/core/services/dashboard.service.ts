import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResource } from '../models/producto.model';
import { DashboardResumen } from '../models/dashboard.model';

/** Resumen del dashboard admin (KPIs, ventas de la semana, pedidos nuevos/últimos). */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /** GET /admin/dashboard */
  resumen(): Observable<DashboardResumen> {
    return this.http
      .get<ApiResource<DashboardResumen>>(`${this.base}/admin/dashboard`)
      .pipe(map((res) => res.data));
  }
}
