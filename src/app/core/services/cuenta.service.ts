import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActualizarPerfilBody, Usuario } from '../models/usuario.model';
import { AuthService } from './auth.service';

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
  private auth = inject(AuthService);

  private readonly base = environment.apiBaseUrl;

  /** Object URL vigente de la foto, para revocarlo antes de crear otro. */
  private fotoObjectUrl: string | null = null;

  cambiarPassword(body: CambiarPasswordBody): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/cuenta/cambiar-password`, body);
  }

  /**
   * Actualiza nombre / teléfono / correo propios.
   *
   * Ojo: si el body cambia el correo, el backend exige `password_actual` (el
   * correo ES el login). Si la cuenta entró con Google, rechaza el cambio de
   * correo con 422 — por eso la pantalla ni siquiera lo deja editar.
   */
  actualizarPerfil(body: ActualizarPerfilBody): Observable<Usuario> {
    return this.http.put<{ data: Usuario }>(`${this.base}/cuenta/perfil`, body).pipe(
      map((res) => res.data),
      // refrescarPerfil() empuja el usuario nuevo al BehaviorSubject de
      // AuthService; sin esto la tarjeta de Mi cuenta seguiría mostrando el
      // correo viejo hasta reiniciar la app.
      tap(() => this.auth.refrescarPerfil().subscribe({ error: () => {} })),
    );
  }

  /** Sube (o reemplaza) la foto de perfil. */
  subirFoto(archivo: File): Observable<unknown> {
    const form = new FormData();
    form.append('foto', archivo);

    // Sin Content-Type manual a propósito: el navegador tiene que ponerlo él
    // solo para incluir el boundary del multipart.
    return this.http.post(`${this.base}/cuenta/foto`, form);
  }

  /** Borra la foto y deja el ícono por defecto. */
  eliminarFoto(): Observable<unknown> {
    return this.http.delete(`${this.base}/cuenta/foto`);
  }

  /**
   * Descarga la foto propia y devuelve un object URL listo para un <img>.
   *
   * No se puede usar <img src="/api/cuenta/foto"> directo: esa petición la hace
   * el navegador por fuera de Angular, así que NO pasa por el interceptor que
   * agrega el Authorization y volvería 401. Se baja como blob y se envuelve en
   * un object URL.
   */
  obtenerFotoUrl(): Observable<string> {
    return this.http
      .get(`${this.base}/cuenta/foto`, { responseType: 'blob' })
      .pipe(map((blob) => this.aObjectUrl(blob)));
  }

  /**
   * Libera el object URL actual. Hay que llamarlo al salir de la pantalla: los
   * object URL viven hasta que se revocan, así que sin esto cada recarga de la
   * foto deja el blob anterior colgado en memoria.
   */
  revocarFoto(): void {
    if (this.fotoObjectUrl) {
      URL.revokeObjectURL(this.fotoObjectUrl);
      this.fotoObjectUrl = null;
    }
  }

  private aObjectUrl(blob: Blob): string {
    this.revocarFoto();
    this.fotoObjectUrl = URL.createObjectURL(blob);

    return this.fotoObjectUrl;
  }
}
