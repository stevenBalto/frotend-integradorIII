import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { SuperAdminAuthService } from '../../core/services/superadmin-auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  readonly form: FormGroup;
  showPassword = false;
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private superAuth: SuperAdminAuthService,
    private router: Router,
    private toast: ToastController,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.notificar('Completá correo y contraseña.');
      return;
    }
    this.cargando = true;
    this.auth.loginUnificado(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.tipo === 'superadmin') {
          // Superadmin: sesión aislada + panel de superadmin.
          this.superAuth.adoptarSesion({ data: res.data, token: res.token });
          void this.router.navigateByUrl('/superadmin/panel');
          return;
        }
        // Usuario normal: sesión normal + panel según rol.
        this.auth.adoptarSesion({ data: res.data, token: res.token });
        // Contraseña temporal / cambio obligatorio → primero cambiarla.
        if (res.data.must_change_password) {
          void this.router.navigateByUrl('/cambiar-password');
          return;
        }
        const esAdmin = res.data.rol === 'super_admin' || res.data.rol === 'admin_sede';
        void this.router.navigateByUrl(esAdmin ? '/admin' : '/tabs/home');
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        void this.notificar(err.error?.message ?? 'No se pudo iniciar sesión. Intentá de nuevo.');
      },
    });
  }

  irRegistro(): void {
    void this.router.navigateByUrl('/register');
  }

  irRecuperar(): void {
    void this.router.navigateByUrl('/forgot-password');
  }

  entrarInvitado(): void {
    void this.router.navigateByUrl('/tabs/home');
  }

  private async notificar(mensaje: string): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 2500, position: 'top', color: 'danger' });
    await t.present();
  }
}
