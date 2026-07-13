import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CrearSuperAdminBody,
  SuperAdmin,
  SuperAdminAuthResponse,
  SuperAdminLoginBody,
} from '../models/superadmin.model';

/**
 * Autenticacion y gestion del panel de SUPERADMIN (aislado de la sesion normal).
 * Guarda su token/usuario con claves propias ('sa_token'/'sa_user') para que la
 * sesion de superadmin y la de admin/cliente NUNCA se mezclen.
 */
@Injectable({ providedIn: 'root' })
export class SuperAdminAuthService {
  private readonly base = environment.apiBaseUrl;
  private store: Storage | null = null;
  private tokenMem: string | null = null;
  private readonly superadminSubject = new BehaviorSubject<SuperAdmin | null>(null);
  readonly superadminActual$ = this.superadminSubject.asObservable();

  constructor(private http: HttpClient, private ionicStorage: Storage) {}

  /** APP_INITIALIZER: carga token/superadmin persistidos a memoria antes de arrancar. */
  async init(): Promise<void> {
    if (!this.store) {
      this.store = await this.ionicStorage.create();
    }
    this.tokenMem = (await this.store.get('sa_token')) ?? null;
    const sa = (await this.store.get('sa_user')) ?? null;
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
    void this.store?.remove('sa_token');
    void this.store?.remove('sa_user');
  }

  private persistir(res: SuperAdminAuthResponse): void {
    this.tokenMem = res.token;
    this.superadminSubject.next(res.data);
    void this.store?.set('sa_token', res.token);
    void this.store?.set('sa_user', res.data);
  }
}
