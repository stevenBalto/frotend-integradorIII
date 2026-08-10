import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CambiarPasswordBody {
  password_actual: string;
  password: string;
  password_confirmation: string;
}

/**
 * Acciones sobre la cuenta del usuario autenticado.
 */
@Injectable({ providedIn: 'root' })
export class CuentaService {
  private http = inject(HttpClient);

  private readonly base = environment.apiBaseUrl;

  cambiarPassword(body: CambiarPasswordBody): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/cuenta/cambiar-password`, body);
  }
}
