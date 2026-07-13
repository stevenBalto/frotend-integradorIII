import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActualizarInstanciaBody,
  CrearInstanciaBody,
  CrearInstanciaResp,
  Instancia,
} from '../models/instancia.model';

/**
 * CRUD de instancias (panel superadmin). El interceptor adjunta el token del
 * superadmin porque la URL contiene /superadmin/.
 */
@Injectable({ providedIn: 'root' })
export class InstanciaService {
  private readonly base = `${environment.apiBaseUrl}/superadmin/instancias`;

  constructor(private http: HttpClient) {}

  listar(): Observable<{ data: Instancia[] }> {
    return this.http.get<{ data: Instancia[] }>(this.base);
  }

  /** Crea la instancia; la respuesta trae las credenciales temporales (una vez). */
  crear(body: CrearInstanciaBody): Observable<CrearInstanciaResp> {
    return this.http.post<CrearInstanciaResp>(this.base, body);
  }

  actualizar(id: number, body: ActualizarInstanciaBody): Observable<{ data: Instancia }> {
    return this.http.put<{ data: Instancia }>(`${this.base}/${id}`, body);
  }

  cambiarEstado(id: number, estado: string): Observable<{ data: Instancia }> {
    return this.http.post<{ data: Instancia }>(`${this.base}/${id}/estado`, { estado });
  }

  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
