import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, Usuario } from '../models/usuario.model';
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

  logout(): Observable<unknown> {
    return this.http
      .post(`${this.base}/logout`, {})
      .pipe(finalize(() => this.limpiarSesion()));
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
