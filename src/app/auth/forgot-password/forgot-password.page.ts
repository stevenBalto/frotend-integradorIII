import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { PasswordResetService } from '../../core/services/password-reset.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: false,
})
export class ForgotPasswordPage {
  readonly form: FormGroup;
  cargando = false;
  enviado = false;

  constructor(
    private fb: FormBuilder,
    private service: PasswordResetService,
    private router: Router,
    private toast: ToastController,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.notificar('Escribí un correo válido.');
      return;
    }
    this.cargando = true;
    this.service.solicitar(this.form.getRawValue().email).subscribe({
      next: () => {
        this.cargando = false;
        this.enviado = true;
      },
      error: () => {
        // Mismo resultado que éxito (no se revela si el correo existe).
        this.cargando = false;
        this.enviado = true;
      },
    });
  }

  volver(): void {
    void this.router.navigateByUrl('/login');
  }

  private async notificar(mensaje: string): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 2500, position: 'top', color: 'danger' });
    await t.present();
  }
}
