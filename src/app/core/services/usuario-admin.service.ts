import { Injectable, inject } from '@angular/core';
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
 * El interceptor adjunta el token del admin automaticamente.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioAdminService {
  private http = inject(HttpClient);

  private readonly base = `${environment.apiBaseUrl}/admin/usuarios`;

  listar(): Observable<{ data: AdminUser[] }> {
    return this.http.get<{ data: AdminUser[] }>(this.base);
  }

  opciones(): Observable<OpcionesUsuario> {
    return this.http.get<OpcionesUsuario>(`${this.base}/opciones`);
  }

  crear(body: CrearUsuarioBody): Observable<{ data: AdminUser }> {
    return this.http.post<{ data: AdminUser }>(this.base, body);
  }

  /**
   * Actualiza un usuario. NUNCA envia password (solo se setea al crear).
   */
  actualizar(id: number, body: ActualizarUsuarioBody): Observable<{ data: AdminUser }> {
    // Garantizamos que password nunca se envie
    const { ...payload } = body;
    return this.http.put<{ data: AdminUser }>(`${this.base}/${id}`, payload);
  }

  /**
   * Cambia el estado activo/inactivo de un usuario.
   */
  cambiarEstado(id: number, activo: boolean): Observable<{ data: AdminUser }> {
    return this.http.patch<{ data: AdminUser }>(`${this.base}/${id}/estado`, { activo });
  }

  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
