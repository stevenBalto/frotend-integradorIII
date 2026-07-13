import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertController, ToastController } from '@ionic/angular';
import { SuperAdminAuthService } from '../../core/services/superadmin-auth.service';
import { SuperAdmin } from '../../core/models/superadmin.model';

@Component({
  selector: 'app-superadmin-panel',
  templateUrl: './superadmin-panel.page.html',
  styleUrls: ['./superadmin-panel.page.scss'],
  standalone: false,
})
export class SuperadminPanelPage implements OnInit {
  superadmins: SuperAdmin[] = [];
  cargando = false;
  miId: number | null = null;

  // Modal crear/editar
  mostrarForm = false;
  editandoId: number | null = null;
  guardando = false;
  showPassword = false;
  readonly form: FormGroup;

  // Modal reset password
  resetId: number | null = null;
  resetNombre = '';
  reseteando = false;
  showResetPass = false;
  readonly resetForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: SuperAdminAuthService,
    private router: Router,
    private toast: ToastController,
    private alert: AlertController,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      usuario: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      password_confirmation: [''],
    });
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(12)]],
      password_confirmation: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.cargar();
    this.auth.superadminActual$.subscribe((sa) => (this.miId = sa?.id ?? null));
  }

  cargar(): void {
    this.cargando = true;
    this.auth.listarSuperadmins().subscribe({
      next: (res) => {
        this.superadmins = res.data;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        void this.notificar('No se pudo cargar la lista.', 'danger');
      },
    });
  }

  esYoMismo(sa: SuperAdmin): boolean {
    return sa.id === this.miId;
  }

  // ── Crear / Editar ────────────────────────────────────────────────
  abrirCrear(): void {
    this.editandoId = null;
    this.form.reset();
    this.setPasswordRequerido(true);
    this.showPassword = false;
    this.mostrarForm = true;
  }

  abrirEditar(sa: SuperAdmin): void {
    this.editandoId = sa.id;
    this.form.reset({ nombre: sa.nombre, usuario: sa.usuario, email: sa.email });
    this.setPasswordRequerido(false);
    this.mostrarForm = true;
  }

  cerrarForm(): void {
    this.mostrarForm = false;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.notificar('Revisá los datos del formulario.', 'warning');
      return;
    }
    const v = this.form.getRawValue();

    if (this.editandoId === null) {
      if (v.password !== v.password_confirmation) {
        void this.notificar('Las contraseñas no coinciden.', 'warning');
        return;
      }
      this.guardando = true;
      this.auth.crearSuperadmin(v).subscribe({
        next: () => this.trasGuardar('Superadministrador creado.'),
        error: (err) => this.errorGuardar(err),
      });
    } else {
      this.guardando = true;
      this.auth
        .actualizarSuperadmin(this.editandoId, { nombre: v.nombre, usuario: v.usuario, email: v.email })
        .subscribe({
          next: () => this.trasGuardar('Superadministrador actualizado.'),
          error: (err) => this.errorGuardar(err),
        });
    }
  }

  // ── Activar / Desactivar ──────────────────────────────────────────
  toggleActivo(sa: SuperAdmin): void {
    this.auth.actualizarSuperadmin(sa.id, { activo: !sa.activo }).subscribe({
      next: () => {
        void this.notificar(sa.activo ? 'Cuenta desactivada.' : 'Cuenta activada.', 'success');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => void this.notificar(this.primerError(err), 'danger'),
    });
  }

  // ── Reset password ────────────────────────────────────────────────
  abrirReset(sa: SuperAdmin): void {
    this.resetId = sa.id;
    this.resetNombre = sa.nombre;
    this.resetForm.reset();
    this.showResetPass = false;
  }

  cerrarReset(): void {
    this.resetId = null;
  }

  guardarReset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      void this.notificar('La contraseña debe tener 12+ caracteres.', 'warning');
      return;
    }
    const v = this.resetForm.getRawValue();
    if (v.password !== v.password_confirmation) {
      void this.notificar('Las contraseñas no coinciden.', 'warning');
      return;
    }
    this.reseteando = true;
    this.auth.resetPasswordSuperadmin(this.resetId as number, v).subscribe({
      next: () => {
        this.reseteando = false;
        this.resetId = null;
        void this.notificar('Contraseña restablecida.', 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.reseteando = false;
        void this.notificar(this.primerError(err), 'danger');
      },
    });
  }

  // ── Eliminar ──────────────────────────────────────────────────────
  async eliminar(sa: SuperAdmin): Promise<void> {
    const a = await this.alert.create({
      header: 'Eliminar superadministrador',
      message: `¿Eliminar a "${sa.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.auth.eliminarSuperadmin(sa.id).subscribe({
              next: () => {
                void this.notificar('Superadministrador eliminado.', 'success');
                this.cargar();
              },
              error: (err: HttpErrorResponse) => void this.notificar(this.primerError(err), 'danger'),
            });
          },
        },
      ],
    });
    await a.present();
  }

  cerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private setPasswordRequerido(requerido: boolean): void {
    const pass = this.form.get('password');
    const conf = this.form.get('password_confirmation');
    if (requerido) {
      pass?.setValidators([Validators.required, Validators.minLength(12)]);
      conf?.setValidators([Validators.required]);
    } else {
      pass?.clearValidators();
      conf?.clearValidators();
    }
    pass?.updateValueAndValidity();
    conf?.updateValueAndValidity();
  }

  private trasGuardar(msg: string): void {
    this.guardando = false;
    this.mostrarForm = false;
    void this.notificar(msg, 'success');
    this.cargar();
  }

  private errorGuardar(err: HttpErrorResponse): void {
    this.guardando = false;
    void this.notificar(this.primerError(err), 'danger');
  }

  private primerError(err: HttpErrorResponse): string {
    const errores = err.error?.errors;
    if (errores) {
      const primero = Object.values(errores)[0];
      if (Array.isArray(primero)) return primero[0] as string;
    }
    return err.error?.message ?? 'Ocurrió un error.';
  }

  private async notificar(mensaje: string, color: string): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 2500, position: 'top', color });
    await t.present();
  }
}
