import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CrearSuperAdminBody,
  SuperAdmin,
  SuperAdminAuthResponse,
  SuperAdminLoginBody,
} from '../models/superadmin.model';

const SA_TOKEN_KEY = 'sa_token';
const SA_USER_KEY = 'sa_user';

/**
 * Autenticacion y gestion del panel de SUPERADMIN (aislado de la sesion normal).
 * Guarda su token/usuario en sessionStorage con claves propias ('sa_token'/'sa_user'):
 * separado de la sesion de admin/cliente, y aislado por pestana/ventana (evita que
 * loguearse en una pestana pise la sesion de superadmin abierta en otra).
 */
@Injectable({ providedIn: 'root' })
export class SuperAdminAuthService {
  private readonly base = environment.apiBaseUrl;
  private tokenMem: string | null = null;
  private readonly superadminSubject = new BehaviorSubject<SuperAdmin | null>(null);
  readonly superadminActual$ = this.superadminSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** APP_INITIALIZER: carga token/superadmin persistidos a memoria antes de arrancar. */
  async init(): Promise<void> {
    this.tokenMem = sessionStorage.getItem(SA_TOKEN_KEY);
    const raw = sessionStorage.getItem(SA_USER_KEY);
    const sa = raw ? (JSON.parse(raw) as SuperAdmin) : null;
    if (sa) {
      this.superadminSubject.next(sa);
    }
  }

  get token(): string | null {
    return this.tokenMem;
  }

  get estaAutenticado(): boolean {
    return this.tokenMem !== null;
  }

  login(body: SuperAdminLoginBody): Observable<SuperAdminAuthResponse> {
    return this.http
      .post<SuperAdminAuthResponse>(`${this.base}/superadmin/login`, body)
      .pipe(tap((res) => this.persistir(res)));
  }

  logout(): Observable<unknown> {
    return this.http
      .post(`${this.base}/superadmin/logout`, {})
      .pipe(finalize(() => this.limpiarSesion()));
  }

  listarSuperadmins(): Observable<{ data: SuperAdmin[] }> {
    return this.http.get<{ data: SuperAdmin[] }>(`${this.base}/superadmin/superadmins`);
  }

  crearSuperadmin(body: CrearSuperAdminBody): Observable<{ data: SuperAdmin }> {
    return this.http.post<{ data: SuperAdmin }>(`${this.base}/superadmin/superadmins`, body);
  }

  actualizarSuperadmin(
    id: number,
    body: { nombre?: string; usuario?: string; email?: string; activo?: boolean },
  ): Observable<{ data: SuperAdmin }> {
    return this.http.put<{ data: SuperAdmin }>(`${this.base}/superadmin/superadmins/${id}`, body);
  }

  resetPasswordSuperadmin(
    id: number,
    body: { password: string; password_confirmation: string },
  ): Observable<unknown> {
    return this.http.post(`${this.base}/superadmin/superadmins/${id}/reset-password`, body);
  }

  eliminarSuperadmin(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/superadmin/superadmins/${id}`);
  }

  /** Adopta una sesión de superadmin obtenida por el login unificado. */
  adoptarSesion(res: SuperAdminAuthResponse): void {
    this.persistir(res);
  }

  /** Limpia la sesion local de superadmin (sin llamar al backend). */
  limpiarSesion(): void {
    this.tokenMem = null;
    this.superadminSubject.next(null);
    sessionStorage.removeItem(SA_TOKEN_KEY);
    sessionStorage.removeItem(SA_USER_KEY);
  }

  private persistir(res: SuperAdminAuthResponse): void {
    this.tokenMem = res.token;
    this.superadminSubject.next(res.data);
    sessionStorage.setItem(SA_TOKEN_KEY, res.token);
    sessionStorage.setItem(SA_USER_KEY, JSON.stringify(res.data));
  }
}
