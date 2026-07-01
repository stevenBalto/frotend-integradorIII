import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { Usuario } from '../core/models/usuario.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  readonly usuario$: Observable<Usuario | null>;

  constructor(private auth: AuthService, private router: Router) {
    this.usuario$ = this.auth.usuarioActual$;
  }

  /** Boton temporal: cierra sesion en backend + local y vuelve al login. */
  cerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login', { replaceUrl: true }),
      error: () => this.router.navigateByUrl('/login', { replaceUrl: true }),
    });
  }
}
