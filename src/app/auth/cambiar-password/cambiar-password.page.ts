import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { CuentaService } from '../../core/services/cuenta.service';

@Component({
  selector: 'app-cambiar-password',
  templateUrl: './cambiar-password.page.html',
  styleUrls: ['./cambiar-password.page.scss'],
  standalone: false,
})
export class CambiarPasswordPage {
  readonly form: FormGroup;
  cargando = false;
  showActual = false;
  showNueva = false;

  constructor(
    private fb: FormBuilder,
    private cuenta: CuentaService,
    private auth: AuthService,
    private router: Router,
    private toast: ToastController,
  ) {
    this.form = this.fb.group({
      password_actual: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(12)]],
      password_confirmation: ['', [Validators.required]],
    });
  }

  cambiar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.notificar('Completá los campos. La nueva debe tener 12+ caracteres.', 'warning');
      return;
    }
    const v = this.form.getRawValue();
    if (v.password !== v.password_confirmation) {
      void this.notificar('Las contraseñas no coinciden.', 'warning');
      return;
    }

    this.cargando = true;
    this.cuenta.cambiarPassword(v).subscribe({
      next: async () => {
        this.cargando = false;
        await this.notificar('Contraseña actualizada. ¡Bienvenido!', 'success');
        this.irAPanel();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        void this.notificar(this.primerError(err), 'danger');
      },
    });
  }

  salir(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }

  private irAPanel(): void {
    const rol = this.auth.usuario?.rol;
    const esAdmin = rol === 'super_admin' || rol === 'admin_sede';
    void this.router.navigateByUrl(esAdmin ? '/admin' : '/tabs/home');
  }

  private primerError(err: HttpErrorResponse): string {
    const errores = err.error?.errors;
    if (errores) {
      const primero = Object.values(errores)[0];
      if (Array.isArray(primero)) return primero[0] as string;
    }
    return err.error?.message ?? 'No se pudo cambiar la contraseña.';
  }

  private async notificar(mensaje: string, color: string): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 2600, position: 'top', color });
    await t.present();
  }
}
