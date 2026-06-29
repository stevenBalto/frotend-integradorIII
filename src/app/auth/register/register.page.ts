import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

const PASSWORD_FUERTE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

function passwordFuerte(control: AbstractControl): ValidationErrors | null {
  const valor = (control.value ?? '') as string;
  return PASSWORD_FUERTE.test(valor) ? null : { weak: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  readonly form: FormGroup;
  showPassword = false;
  showConfirm = false;
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastController,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordFuerte]],
      confirm: ['', [Validators.required]],
    });
  }

  passwordsCoinciden(): boolean {
    const { password, confirm } = this.form.value;
    return !confirm || password === confirm;
  }

  registrar(): void {
    if (this.form.invalid || !this.passwordsCoinciden()) {
      this.form.markAllAsTouched();
      void this.notificar('Revisá los datos del formulario.');
      return;
    }
    this.cargando = true;
    const { nombre, email, password, confirm } = this.form.value;
    this.auth
      .registrar({ nombre, email, password, password_confirmation: confirm })
      .subscribe({
        next: () => {
          this.cargando = false;
          void this.router.navigateByUrl('/tabs/tab1');
        },
        error: (err: HttpErrorResponse) => {
          this.cargando = false;
          void this.notificar(this.mensajeError(err));
        },
      });
  }

  irLogin(): void {
    void this.router.navigateByUrl('/login');
  }

  private mensajeError(err: HttpErrorResponse): string {
    const errores = err.error?.errors as Record<string, string[]> | undefined;
    if (errores) {
      const primera = Object.values(errores)[0];
      if (Array.isArray(primera) && primera.length) {
        return primera[0];
      }
    }
    return err.error?.message ?? 'No se pudo crear la cuenta. Intentá de nuevo.';
  }

  private async notificar(mensaje: string): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 2800, position: 'top', color: 'danger' });
    await t.present();
  }
}
