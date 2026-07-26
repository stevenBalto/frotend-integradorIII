import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnaliticasResponse } from '../models/analiticas.model';

/** Servicio para obtener reportes y analiticas del panel admin. */
@Injectable({ providedIn: 'root' })
export class AnaliticasService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET /admin/analiticas?mes=YYYY-MM
   * Si no se pasa mes, usa el mes actual.
   */
  obtenerAnaliticas(mes?: string): Observable<AnaliticasResponse> {
    const mesParam = mes ?? this.getMesActual();
    return this.http.get<AnaliticasResponse>(`${this.base}/admin/analiticas?mes=${mesParam}`);
  }

  private getMesActual(): string {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
