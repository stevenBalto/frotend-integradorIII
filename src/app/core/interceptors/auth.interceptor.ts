import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SuperAdminAuthService } from '../services/superadmin-auth.service';

/**
 * Inyecta el Bearer token correcto segun la ruta y maneja 401 de forma global.
 * Las rutas /superadmin/* usan la sesion de superadmin (aislada); el resto usa
 * la sesion normal de admin/cliente. Asi ambas sesiones nunca se pisan.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private auth: AuthService,
    private superAuth: SuperAdminAuthService,
    private router: Router,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const esSuper = req.url.includes('/superadmin/');
    const token = esSuper ? this.superAuth.token : this.auth.token;

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const authReq = req.clone({ setHeaders: headers });

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          if (esSuper) {
            // Sesión de superadmin vencida → al login único.
            this.superAuth.limpiarSesion();
            void this.router.navigateByUrl('/login');
          } else if (!req.url.includes('/login')) {
            this.auth.limpiarSesion();
            void this.router.navigateByUrl('/login');
          }
        }

        // 423: contraseña temporal/obligatoria → a cambiar la contraseña.
        if (err.status === 423 && err.error?.must_change_password) {
          void this.router.navigateByUrl('/cambiar-password');
        }
        return throwError(() => err);
      }),
    );
  }
}
