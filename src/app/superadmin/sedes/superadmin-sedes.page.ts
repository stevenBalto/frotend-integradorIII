import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { ConfirmService } from '../../core/services/confirm.service';
import { SedeSuperadminService } from '../../core/services/sede-superadmin.service';
import { SuperAdminAuthService } from '../../core/services/superadmin-auth.service';
import { CredencialesSede, Sucursal } from '../../core/models/sucursal.model';
import { InactivityService } from '../../core/services/inactivity.service';
import { SuperAdminSessionWatchService } from '../../core/services/superadmin-session-watch.service';

/**
 * Sedes del negocio (La Fortuna, Liberia, ...).
 *
 * Todas las sedes comparten menú, precios, ofertas y clientes: son el MISMO
 * negocio. Lo único que se separa es la operación diaria — cada administrador
 * de sede ve solamente los pedidos y las analíticas de la suya.
 *
 * Es el único lugar del sistema donde se dan de alta las sedes. Al crear una se
 * genera su administrador con credenciales temporales, que se muestran una sola vez.
 */
@Component({
  selector: 'app-superadmin-sedes',
  templateUrl: './superadmin-sedes.page.html',
  styleUrls: ['./superadmin-sedes.page.scss'],
  standalone: false,
  providers: [InactivityService, SuperAdminSessionWatchService],
})
export class SuperadminSedesPage implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(SedeSuperadminService);
  private superAuth = inject(SuperAdminAuthService);
  private router = inject(Router);
  private toast = inject(ToastController);
  private confirm = inject(ConfirmService);
  private sessionWatch = inject(SuperAdminSessionWatchService);

  sedes: Sucursal[] = [];
  cargando = false;

  showModal = false;
  editandoId: number | null = null;
  guardando = false;
  readonly form: FormGroup;

  /** Credenciales del admin de la sede recién creada: se muestran UNA sola vez. */
  credenciales: CredencialesSede | null = null;
  sedeCreada = '';

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
      direccion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      telefono: ['', [Validators.maxLength(20)]],
      correo_admin: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    });
  }

  ngOnInit(): void {
    this.cargar();
    // Cierra sola esta ventana si la cuenta se elimina/desactiva desde otra.
    this.sessionWatch.iniciar();
  }

  cargar(): void {
    this.cargando = true;
    this.service.listar().subscribe({
      next: (sedes) => {
        this.sedes = sedes;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        void this.notificar('No se pudo cargar la lista de sedes.', 'danger');
      },
    });
  }

  abrirCrear(): void {
    this.editandoId = null;
    this.form.reset();
    this.form.get('correo_admin')?.enable();
    this.showModal = true;
  }

  abrirEditar(sede: Sucursal): void {
    this.editandoId = sede.id;
    this.form.reset({
      nombre: sede.nombre,
      direccion: sede.direccion,
      telefono: sede.telefono ?? '',
      correo_admin: '',
    });
    // El administrador ya existe: su correo no se toca al editar la sede.
    this.form.get('correo_admin')?.disable();
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.notificar(this.mensajeCamposInvalidos(), 'warning');
      return;
    }

    const v = this.form.getRawValue();
    const base = {
      nombre: (v.nombre ?? '').trim(),
      direccion: (v.direccion ?? '').trim(),
      telefono: (v.telefono ?? '').trim() || null,
    };
    this.guardando = true;

    if (this.editandoId === null) {
      this.service
        .crear({ ...base, correo_admin: (v.correo_admin ?? '').trim().toLowerCase() })
        .subscribe({
          next: (res) => {
            this.guardando = false;
            this.showModal = false;
            // Se muestran ANTES de recargar: no hay forma de recuperarlas después.
            this.sedeCreada = res.sucursal.nombre;
            this.credenciales = res.credenciales;
            this.cargar();
          },
          error: (err) => this.errorGuardar(err),
        });
      return;
    }

    this.service.actualizar(this.editandoId, base).subscribe({
      next: () => {
        this.guardando = false;
        this.showModal = false;
        void this.notificar('Sede actualizada.', 'success');
        this.cargar();
      },
      error: (err) => this.errorGuardar(err),
    });
  }

  /**
   * Cierra o reabre una sede. Cerrar no borra nada: sale del selector del
   * cliente y deja de recibir pedidos, pero su historial queda intacto y sus
   * administradores siguen entrando en modo solo lectura.
   */
  async toggleEstado(sede: Sucursal): Promise<void> {
    const cerrando = sede.activa;

    if (cerrando) {
      const confirmado = await this.confirm.preguntar({
        titulo: `¿Cerrar la sede ${sede.nombre}?`,
        mensaje:
          'Dejará de aparecer para los clientes y no recibirá pedidos nuevos. ' +
          'No se borra nada: su historial se conserva y sus administradores podrán ' +
          'entrar a consultarlo, pero no a modificar. Podés reabrirla cuando quieras.',
        textoConfirmar: 'Sí, cerrar la sede',
        textoCancelar: 'Cancelar',
        tono: 'peligro',
        icono: 'lock-closed-outline',
      });
      if (!confirmado) return;
    }

    this.service.cambiarEstado(sede.id, !sede.activa).subscribe({
      next: () => {
        void this.notificar(cerrando ? 'Sede cerrada.' : 'Sede reabierta.', 'success');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => void this.notificar(this.primerError(err), 'danger'),
    });
  }

  cerrarCredenciales(): void {
    this.credenciales = null;
    this.sedeCreada = '';
  }

  async copiar(texto: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      void this.notificar('Copiado.', 'success');
    } catch {
      void this.notificar('No se pudo copiar.', 'warning');
    }
  }

  cerrarSesion(): void {
    this.superAuth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }

  /** Sesion cerrada por inactividad o por tope absoluto de horas (idle-session-modal). */
  async onSesionExpirada(): Promise<void> {
    this.superAuth.logout().subscribe({ complete: () => undefined, error: () => undefined });
    const toast = await this.toast.create({
      message: 'Tu sesión se cerró por inactividad.',
      duration: 4000,
      position: 'top',
      color: 'medium',
    });
    await toast.present();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  // ── Validación visible ──────────────────────────────────────────────
  campoInvalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && (c.touched || c.dirty) && c.invalid;
  }

  errorDe(campo: string): string | null {
    if (!this.campoInvalido(campo)) return null;
    const c = this.form.get(campo);
    const etiqueta = SuperadminSedesPage.ETIQUETAS[campo] ?? 'Este campo';

    if (c?.hasError('backend')) return c.getError('backend') as string;
    if (c?.hasError('required')) return `${etiqueta} es obligatorio.`;
    if (c?.hasError('email')) return 'Ingresá un correo válido (ej. liberia@rooster.com).';
    if (c?.hasError('minlength')) {
      return `${etiqueta} debe tener al menos ${c.getError('minlength').requiredLength} caracteres.`;
    }
    if (c?.hasError('maxlength')) {
      return `${etiqueta} no puede pasar de ${c.getError('maxlength').requiredLength} caracteres.`;
    }
    return `Revisá ${etiqueta.toLowerCase()}.`;
  }

  private static readonly ETIQUETAS: Record<string, string> = {
    nombre: 'El nombre de la sede',
    direccion: 'La dirección',
    telefono: 'El teléfono',
    correo_admin: 'El correo del administrador',
  };

  private mensajeCamposInvalidos(): string {
    const faltantes = Object.keys(this.form.controls)
      .filter((campo) => this.form.get(campo)?.invalid)
      .map((campo) => SuperadminSedesPage.ETIQUETAS[campo] ?? campo);

    if (faltantes.length === 0) return 'Revisá los datos del formulario.';
    if (faltantes.length === 1) return `Revisá: ${faltantes[0]}.`;
    return `Revisá estos campos: ${faltantes.join(', ')}.`;
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
    const t = await this.toast.create({ message: mensaje, duration: 2600, position: 'top', color });
    await t.present();
  }
}
