import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResource } from '../models/producto.model';
import { RoostersResumen } from '../models/puntos.model';

/** Consumo de los Roosters (puntos de fidelidad) del cliente. */
@Injectable({ providedIn: 'root' })
export class PuntosService {
  private http = inject(HttpClient);

  private readonly base = environment.apiBaseUrl;

  /** GET /puntos/mios — saldo, acumulado, canjeado y movimientos del cliente. */
  misRoosters(): Observable<RoostersResumen> {
    return this.http
      .get<ApiResource<RoostersResumen>>(`${this.base}/puntos/mios`)
      .pipe(map((res) => res.data));
  }
}
