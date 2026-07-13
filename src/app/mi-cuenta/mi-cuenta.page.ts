import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-mi-cuenta',
  templateUrl: 'mi-cuenta.page.html',
  styleUrls: ['mi-cuenta.page.scss'],
  standalone: false,
})
export class MiCuentaPage {
  constructor(private auth: AuthService, private router: Router) {}

  /** Cierra sesion en backend + local y vuelve al login. */
  cerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => this.irAlLogin(),
      error: () => this.irAlLogin(),
    });
  }

  /**
   * Limpia la sesion ANTES de navegar. Sin esto, el guestGuard del login ve la
   * sesion todavia activa (el finalize de logout() corre despues del next) y
   * rebota a /tabs/home — por eso "no salia el login".
   */
  private irAlLogin(): void {
    this.auth.limpiarSesion();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
