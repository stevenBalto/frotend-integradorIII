import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResource } from '../models/producto.model';
import { DashboardResumen } from '../models/dashboard.model';

/** Resumen del dashboard admin (KPIs, ventas de la semana, pedidos nuevos/últimos). */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET /admin/dashboard?dias=7|14|30&desde&hasta
   * `dias` controla SOLO la ventana del gráfico. `desde`/`hasta` (YYYY-MM-DD) controlan
   * SOLO el rango de "Últimos pedidos"; sin ellos el backend usa hoy.
   */
  resumen(dias = 7, desde?: string, hasta?: string): Observable<DashboardResumen> {
    let params = new HttpParams().set('dias', String(dias));
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http
      .get<ApiResource<DashboardResumen>>(`${this.base}/admin/dashboard`, { params })
      .pipe(map((res) => res.data));
  }
}
