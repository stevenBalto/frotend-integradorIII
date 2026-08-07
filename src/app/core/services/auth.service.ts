import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  CambiarPasswordExpiradaBody,
  LoginResultado,
  PasswordExpiradaResponse,
  Usuario,
} from '../models/usuario.model';
import { TokenStorageService } from './token-storage.service';

export interface RegistroBody {
  nombre: string;
  email: string;
  telefono?: string | null;
  password: string;
  password_confirmation: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

/**
 * Autenticacion contra el backend Laravel (Sanctum). Mantiene el token en memoria
 * (lectura sincrona para el interceptor) y lo persiste en storage.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiBaseUrl;
  private tokenMem: string | null = null;
  private readonly usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  readonly usuarioActual$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient, private storage: TokenStorageService) {}

  /** APP_INITIALIZER: carga token/usuario persistidos a memoria antes de arrancar. */
  async init(): Promise<void> {
    await this.storage.init();
    this.tokenMem = await this.storage.getToken();
    const usuario = await this.storage.getUsuario();
    if (usuario) {
      this.usuarioSubject.next(usuario);
    }
  }

  get token(): string | null {
    return this.tokenMem;
  }

  get usuario(): Usuario | null {
    return this.usuarioSubject.value;
  }

  get estaAutenticado(): boolean {
    return this.tokenMem !== null;
  }

  registrar(body: RegistroBody): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/register`, body)
      .pipe(tap((res) => this.persistir(res)));
  }

  login(body: LoginBody): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/login`, body)
      .pipe(tap((res) => this.persistir(res)));
  }

  // ── Inicio de sesion con Google ─────────────────────────────────────────────
  /**
   * Manda el navegador a Google. NO es una peticion XHR: es una navegacion real,
   * porque Google bloquea su pantalla de login dentro de iframes y WebViews.
   *
   * Se sale de Angular a proposito (location.href): el usuario vuelve despues al
   * front por el callback del backend, con un codigo en el fragmento (#).
   *
   * @param destino Ruta del front a la que volver ya con la sesion iniciada.
   */
  irAGoogle(destino: string): void {
    const url = `${this.base}/auth/google/redirect?destino=${encodeURIComponent(destino)}`;
    window.location.href = url;
  }

  /**
   * Canjea el codigo de un solo uso (el que llega en el fragmento al volver de
   * Google) por la sesion. Devuelve lo mismo que un login normal y la persiste.
   */
  canjearCodigoGoogle(codigo: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/auth/google/exchange`, { codigo })
      .pipe(tap((res) => this.persistir(res)));
  }

  /**
   * Lee el resultado que el backend dejo en el fragmento de la URL y lo limpia,
   * para que no quede en el historial ni se vuelva a procesar al recargar.
   * Devuelve null si no venimos de Google.
   */
  leerRespuestaDeGoogle(): { codigo?: string; error?: string } | null {
    const fragmento = window.location.hash.replace(/^#/, '');
    if (!fragmento) {
      return null;
    }

    const params = new URLSearchParams(fragmento);
    const codigo = params.get('google_codigo');
    const error = params.get('google_error');
    if (!codigo && !error) {
      return null;
    }

    // Saca el fragmento sin recargar ni ensuciar el historial.
    history.replaceState(null, '', window.location.pathname + window.location.search);

    return { codigo: codigo ?? undefined, error: error ?? undefined };
  }

  /**
   * Login UNIFICADO: NO persiste todavia (el caller decide donde guardar la
   * sesion segun `tipo`, porque un superadmin va a su propio storage aislado).
   * Puede devolver LoginResultado (con token) o PasswordExpiradaResponse (sin token).
   */
  loginUnificado(body: LoginBody): Observable<LoginResultado | PasswordExpiradaResponse> {
    return this.http.post<LoginResultado | PasswordExpiradaResponse>(`${this.base}/login`, body);
  }

  /**
   * Cambia la contrasena expirada. Si es exitoso, devuelve AuthResponse con token.
   */
  cambiarPasswordExpirada(body: CambiarPasswordExpiradaBody): Observable<LoginResultado> {
    return this.http.post<LoginResultado>(`${this.base}/auth/password-expirada`, body);
  }

  /** Adopta una sesión de usuario normal ya obtenida (la persiste en memoria + storage). */
  adoptarSesion(res: AuthResponse): void {
    this.persistir(res);
  }

  logout(): Observable<unknown> {
    return this.http
      .post(`${this.base}/logout`, {})
      .pipe(finalize(() => this.limpiarSesion()));
  }

  /**
   * Re-lee el perfil desde el backend y refresca la sesion local. Util tras acciones
   * que cambian datos del usuario (ej. ganar/canjear Roosters en un pedido).
   */
  refrescarPerfil(): Observable<Usuario> {
    return this.http.get<{ data: Usuario }>(`${this.base}/me`).pipe(
      map((res) => res.data),
      tap((usuario) => {
        this.usuarioSubject.next(usuario);
        void this.storage.setUsuario(usuario);
      }),
    );
  }

  /** Limpia la sesion local (sin llamar al backend). La usa el interceptor ante 401. */
  limpiarSesion(): void {
    this.tokenMem = null;
    this.usuarioSubject.next(null);
    void this.storage.clear();
  }

  private persistir(res: AuthResponse): void {
    this.tokenMem = res.token;
    this.usuarioSubject.next(res.data);
    void this.storage.setToken(res.token);
    void this.storage.setUsuario(res.data);
  }
}
