import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

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
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.cargando = false;
        void this.router.navigateByUrl('/tabs/tab1');
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

  entrarInvitado(): void {
    void this.router.navigateByUrl('/tabs/tab1');
  }

  private async notificar(mensaje: string): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 2500, position: 'top', color: 'danger' });
    await t.present();
  }
}
