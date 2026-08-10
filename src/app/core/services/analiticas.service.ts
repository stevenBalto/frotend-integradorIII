import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnaliticasResponse, Granularidad } from '../models/analiticas.model';

/** Parametros de consulta para el endpoint de analiticas. */
export interface AnaliticasParams {
  granularidad: Granularidad;
  /** YYYY-MM, solo cuando granularidad='mes'. */
  mes?: string;
  /** YYYY-MM-DD, fecha ancla cuando granularidad='semana' o 'dia'. */
  fecha?: string;
  /** YYYY-MM-DD, inicio del rango cuando granularidad='rango'. */
  desde?: string;
  /** YYYY-MM-DD, fin del rango cuando granularidad='rango'. */
  hasta?: string;
  sucursalId?: number;
}

/** Servicio para obtener reportes y analiticas del panel admin. */
@Injectable({ providedIn: 'root' })
export class AnaliticasService {
  private http = inject(HttpClient);

  private readonly base = environment.apiBaseUrl;

  /** GET /admin/analiticas?granularidad=mes|semana|dia&mes=YYYY-MM&fecha=YYYY-MM-DD&sucursal_id=N */
  obtenerAnaliticas(params: AnaliticasParams): Observable<AnaliticasResponse> {
    return this.http.get<AnaliticasResponse>(`${this.base}/admin/analiticas?${this.query(params)}`);
  }

  /** GET /admin/analiticas/exportar/excel — descarga el resumen del periodo actual en .xlsx. */
  exportarExcel(params: AnaliticasParams): Observable<Blob> {
    return this.http.get(`${this.base}/admin/analiticas/exportar/excel?${this.query(params)}`, { responseType: 'blob' });
  }

  /** GET /admin/analiticas/exportar/pdf — descarga el resumen del periodo actual en .pdf. */
  exportarPdf(params: AnaliticasParams): Observable<Blob> {
    return this.http.get(`${this.base}/admin/analiticas/exportar/pdf?${this.query(params)}`, { responseType: 'blob' });
  }

  private query(params: AnaliticasParams): string {
    const query = new URLSearchParams();
    query.set('granularidad', params.granularidad);
    if (params.mes) {
      query.set('mes', params.mes);
    }
    if (params.fecha) {
      query.set('fecha', params.fecha);
    }
    if (params.desde) {
      query.set('desde', params.desde);
    }
    if (params.hasta) {
      query.set('hasta', params.hasta);
    }
    if (params.sucursalId) {
      query.set('sucursal_id', String(params.sucursalId));
    }
    return query.toString();
  }
}
