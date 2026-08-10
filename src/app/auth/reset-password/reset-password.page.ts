import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { PasswordResetService } from '../../core/services/password-reset.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: false,
})
export class ResetPasswordPage implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(PasswordResetService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastController);

  readonly form: FormGroup;
  cargando = false;
  showPass = false;
  enlaceValido = true;
  private email = '';
  private token = '';

  constructor() {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(12)]],
      password_confirmation: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.email = q.get('email') ?? '';
    this.token = q.get('token') ?? '';
    this.enlaceValido = this.email !== '' && this.token !== '';
  }

  restablecer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.notificar('La contraseña debe tener al menos 12 caracteres.', 'warning');
      return;
    }
    const v = this.form.getRawValue();
    if (v.password !== v.password_confirmation) {
      void this.notificar('Las contraseñas no coinciden.', 'warning');
      return;
    }

    this.cargando = true;
    this.service
      .restablecer({
        email: this.email,
        token: this.token,
        password: v.password,
        password_confirmation: v.password_confirmation,
      })
      .subscribe({
        next: async () => {
          this.cargando = false;
          await this.notificar('Contraseña restablecida. Iniciá sesión.', 'success');
          void this.router.navigateByUrl('/login');
        },
        error: (err: HttpErrorResponse) => {
          this.cargando = false;
          void this.notificar(this.primerError(err), 'danger');
        },
      });
  }

  volver(): void {
    void this.router.navigateByUrl('/login');
  }

  private primerError(err: HttpErrorResponse): string {
    const errores = err.error?.errors;
    if (errores) {
      const primero = Object.values(errores)[0];
      if (Array.isArray(primero)) return primero[0] as string;
    }
    return err.error?.message ?? 'No se pudo restablecer la contraseña.';
  }

  private async notificar(mensaje: string, color: string): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 2600, position: 'top', color });
    await t.present();
  }
}
