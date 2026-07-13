import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ResetBody {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

/**
 * Flujo "¿Olvidaste tu contraseña?" contra el backend (Brevo envía el correo).
 */
@Injectable({ providedIn: 'root' })
export class PasswordResetService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  solicitar(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/forgot-password`, { email });
  }

  restablecer(body: ResetBody): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/reset-password`, body);
  }
}
