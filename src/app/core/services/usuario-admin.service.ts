import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActualizarUsuarioBody,
  AdminUser,
  CrearUsuarioBody,
  OpcionesUsuario,
} from '../models/admin-user.model';

/**
 * CRUD de usuarios de la instancia (panel admin) contra el backend.
 * El interceptor adjunta el token del admin automáticamente.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioAdminService {
  private readonly base = `${environment.apiBaseUrl}/admin/usuarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<{ data: AdminUser[] }> {
    return this.http.get<{ data: AdminUser[] }>(this.base);
  }

  opciones(): Observable<OpcionesUsuario> {
    return this.http.get<OpcionesUsuario>(`${this.base}/opciones`);
  }

  crear(body: CrearUsuarioBody): Observable<{ data: AdminUser }> {
    return this.http.post<{ data: AdminUser }>(this.base, body);
  }

  actualizar(id: number, body: ActualizarUsuarioBody): Observable<{ data: AdminUser }> {
    return this.http.put<{ data: AdminUser }>(`${this.base}/${id}`, body);
  }

  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
