import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { ConfirmService } from '../../core/services/confirm.service';
import { SuperAdminAuthService } from '../../core/services/superadmin-auth.service';
import { SuperAdmin } from '../../core/models/superadmin.model';
import { InactivityService } from '../../core/services/inactivity.service';
import { SuperAdminSessionWatchService } from '../../core/services/superadmin-session-watch.service';

@Component({
  selector: 'app-superadmin-panel',
  templateUrl: './superadmin-panel.page.html',
  styleUrls: ['./superadmin-panel.page.scss'],
  standalone: false,
  providers: [InactivityService, SuperAdminSessionWatchService],
})
export class SuperadminPanelPage implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(SuperAdminAuthService);
  private router = inject(Router);
  private toast = inject(ToastController);
  private confirm = inject(ConfirmService);
  private sessionWatch = inject(SuperAdminSessionWatchService);

  superadmins: SuperAdmin[] = [];
  cargando = false;
  miId: number | null = null;

  // Modal crear/editar
  mostrarForm = false;
  editandoId: number | null = null;
  guardando = false;
  showPassword = false;
  showPasswordConf = false;
  readonly form: FormGroup;

  // Modal reset password
  resetId: number | null = null;
  resetNombre = '';
  reseteando = false;
  showResetPass = false;
  showResetPassConf = false;
  readonly resetForm: FormGroup;

  /** Etiqueta legible de cada control, para nombrar el campo en los mensajes. */
  private static readonly ETIQUETAS: Record<string, string> = {
    nombre: 'Nombre completo',
    usuario: 'Usuario',
    email: 'Correo',
    password: 'Contraseña',
    password_confirmation: 'Confirmar contraseña',
  };

  constructor() {
    // Los máximos replican los del backend (nombre 60, usuario 60, email 120)
    // para avisar antes de enviar y no chocar contra un 422.
    this.form = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(60),
        SuperadminPanelPage.formatoNombre,
      ]],
      usuario: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(60),
        SuperadminPanelPage.formatoUsuario,
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(120),
        SuperadminPanelPage.formatoEmail,
      ]],
      password: [''],
      password_confirmation: [''],
    }, { validators: [SuperadminPanelPage.passwordsCoinciden] });
    this.resetForm = this.fb.group({
      password: ['', SuperadminPanelPage.VALIDADORES_PASSWORD],
      password_confirmation: ['', [Validators.required]],
    }, { validators: [SuperadminPanelPage.passwordsCoinciden] });
  }

  ngOnInit(): void {
    this.cargar();
    this.auth.superadminActual$.subscribe((sa) => (this.miId = sa?.id ?? null));
    // Si esta cuenta es eliminada o desactivada desde otra ventana, la sesión
    // de esta se cierra sola, sin tener que refrescar la página.
    this.sessionWatch.iniciar();
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
    this.showPasswordConf = false;
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
      void this.notificar(this.mensajeCamposInvalidos(this.form), 'warning');
      return;
    }
    const v = this.form.getRawValue();
    // Espacios de sobra al copiar/pegar: se limpian antes de enviar (la contraseña no,
    // ahi un espacio puede ser parte del valor).
    v.nombre = (v.nombre ?? '').trim().replace(/\s+/g, ' '); // sin espacios dobles
    v.usuario = (v.usuario ?? '').trim();
    v.email = (v.email ?? '').trim().toLowerCase();

    if (this.editandoId === null) {
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
    this.showResetPassConf = false;
  }

  cerrarReset(): void {
    this.resetId = null;
  }

  guardarReset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      void this.notificar(this.mensajeCamposInvalidos(this.resetForm), 'warning');
      return;
    }
    const v = this.resetForm.getRawValue();
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
    const confirmado = await this.confirm.preguntar({
      titulo: `¿Eliminar a ${sa.nombre}?`,
      mensaje:
        `Perderá el acceso al panel de inmediato, aunque tenga la sesión abierta. ` +
        `Su usuario "${sa.usuario}" y su correo quedan reservados y no podrán reutilizarse.`,
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Cancelar',
      tono: 'peligro',
      icono: 'trash-outline',
    });
    if (!confirmado) return;

    this.auth.eliminarSuperadmin(sa.id).subscribe({
      next: () => {
        void this.notificar('Superadministrador eliminado.', 'success');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => void this.notificar(this.primerError(err), 'danger'),
    });
  }

  cerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }

  /** Sesion cerrada por inactividad o por tope absoluto de horas (idle-session-modal). */
  async onSesionExpirada(): Promise<void> {
    this.auth.logout().subscribe({ complete: () => undefined, error: () => undefined });
    const toast = await this.toast.create({
      message: 'Tu sesión se cerró por inactividad.',
      duration: 4000,
      position: 'top',
      color: 'medium',
    });
    await toast.present();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  // ── Validación visible ────────────────────────────────────────────
  /** Nombre de persona: letras (con tildes/ñ), espacios, apóstrofes y guiones. */
  private static formatoNombre(control: AbstractControl): ValidationErrors | null {
    const valor = (control.value ?? '') as string;
    if (!valor) return null;
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/.test(valor.trim()) ? null : { formatoNombre: true };
  }

  /** Usuario de login: sin espacios ni acentos, para que sea fácil de teclear. */
  private static formatoUsuario(control: AbstractControl): ValidationErrors | null {
    const valor = (control.value ?? '') as string;
    if (!valor) return null;
    return /^[a-zA-Z0-9._-]+$/.test(valor) ? null : { formatoUsuario: true };
  }

  /**
   * Limite real de un correo: la parte antes de la @ no puede pasar de 64
   * caracteres (RFC 5321) y el total de 254. `Validators.email` no mira esto,
   * asi que sin esta regla entraban cadenas de relleno larguisimas antes de la @.
   */
  private static formatoEmail(control: AbstractControl): ValidationErrors | null {
    const valor = ((control.value ?? '') as string).trim();
    if (!valor || !valor.includes('@')) return null;

    const local = valor.slice(0, valor.indexOf('@'));
    return local.length > 64 ? { emailLocalLargo: true } : null;
  }

  /**
   * Misma exigencia que `Password::min(12)->mixedCase()->numbers()->symbols()`
   * del backend, pero diciendo qué falta en vez de un "contraseña inválida".
   * El tope de 72 es el de bcrypt: más allá, los caracteres se ignoran.
   */
  private static fortalezaPassword(control: AbstractControl): ValidationErrors | null {
    const valor = (control.value ?? '') as string;
    if (!valor) return null;

    const falta: string[] = [];
    if (!/[A-Z]/.test(valor)) falta.push('una mayúscula');
    if (!/[a-z]/.test(valor)) falta.push('una minúscula');
    if (!/[0-9]/.test(valor)) falta.push('un número');
    if (!/[^A-Za-z0-9]/.test(valor)) falta.push('un símbolo');

    return falta.length === 0 ? null : { fortaleza: falta };
  }

  private static readonly VALIDADORES_PASSWORD = [
    Validators.required,
    Validators.minLength(12),
    Validators.maxLength(72),
    SuperadminPanelPage.fortalezaPassword,
  ];

  /** Valida a nivel de grupo que ambas contraseñas coincidan. */
  private static passwordsCoinciden(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const conf = group.get('password_confirmation')?.value;
    if (!pass || !conf) return null;
    return pass === conf ? null : { passwordsDistintas: true };
  }

  /** true si el campo ya fue tocado/enviado y tiene error: dispara el borde rojo. */
  campoInvalido(grupo: FormGroup, campo: string): boolean {
    const c = grupo.get(campo);
    if (!c || !(c.touched || c.dirty)) return false;
    return c.invalid || this.hayMismatch(grupo, campo);
  }

  /** Mensaje concreto debajo del campo, o null si está bien. */
  errorDe(grupo: FormGroup, campo: string): string | null {
    if (!this.campoInvalido(grupo, campo)) return null;
    const c = grupo.get(campo);
    const etiqueta = SuperadminPanelPage.ETIQUETAS[campo] ?? 'Este campo';
    if (c?.hasError('backend')) return c.getError('backend') as string;
    if (c?.hasError('required')) return `${etiqueta} es obligatorio.`;
    if (c?.hasError('email')) return 'Ingresá un correo válido (ej. ana@rooster.com).';
    if (c?.hasError('minlength')) {
      const min = c.getError('minlength').requiredLength as number;
      return `${etiqueta} debe tener al menos ${min} caracteres.`;
    }
    if (c?.hasError('maxlength')) {
      const max = c.getError('maxlength').requiredLength as number;
      return `${etiqueta} no puede pasar de ${max} caracteres.`;
    }
    if (c?.hasError('emailLocalLargo')) {
      return 'La parte antes de la @ no puede pasar de 64 caracteres.';
    }
    if (c?.hasError('formatoNombre')) {
      return 'El nombre solo admite letras, espacios y guiones.';
    }
    if (c?.hasError('formatoUsuario')) {
      return 'El usuario solo admite letras, números, punto, guion y guion bajo (sin espacios ni tildes).';
    }
    if (c?.hasError('fortaleza')) {
      const falta = c.getError('fortaleza') as string[];
      return `A la contraseña le falta ${falta.join(', ')}.`;
    }
    if (this.hayMismatch(grupo, campo)) return 'Las contraseñas no coinciden.';
    return `Revisá ${etiqueta.toLowerCase()}.`;
  }

  private hayMismatch(grupo: FormGroup, campo: string): boolean {
    return campo === 'password_confirmation' && grupo.hasError('passwordsDistintas');
  }

  /** Toast que nombra los campos con problema en vez de un genérico. */
  private mensajeCamposInvalidos(grupo: FormGroup): string {
    const faltantes = Object.keys(grupo.controls)
      .filter((campo) => grupo.get(campo)?.invalid)
      .map((campo) => SuperadminPanelPage.ETIQUETAS[campo] ?? campo);
    if (grupo.hasError('passwordsDistintas')) return 'Las contraseñas no coinciden.';
    if (faltantes.length === 0) return 'Revisá los datos del formulario.';
    if (faltantes.length === 1) return `Revisá el campo: ${faltantes[0]}.`;
    return `Revisá estos campos: ${faltantes.join(', ')}.`;
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private setPasswordRequerido(requerido: boolean): void {
    const pass = this.form.get('password');
    const conf = this.form.get('password_confirmation');
    if (requerido) {
      pass?.setValidators(SuperadminPanelPage.VALIDADORES_PASSWORD);
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
    this.marcarErroresDelBackend(err);
    void this.notificar(this.primerError(err), 'danger');
  }

  /** Pinta bajo su campo los errores de validación que devuelve el backend. */
  private marcarErroresDelBackend(err: HttpErrorResponse): void {
    const errores = err.error?.errors as Record<string, string[]> | undefined;
    if (!errores) return;

    for (const [campo, mensajes] of Object.entries(errores)) {
      const control = this.form.get(campo);
      if (control && mensajes?.length) {
        control.setErrors({ backend: mensajes[0] });
        control.markAsTouched();
      }
    }
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
