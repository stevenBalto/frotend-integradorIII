import { Component, OnDestroy, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CuentaService } from '../../core/services/cuenta.service';
import { ActualizarPerfilBody, Usuario } from '../../core/models/usuario.model';

/** "Mi cuenta": muestra y edita los datos del usuario logueado. */
@Component({
  selector: 'app-perfil',
  standalone: false,
  styleUrls: ['./sub-page.scss', './perfil.page.scss'],
  templateUrl: './perfil.page.html',
})
export class PerfilPage implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private cuenta = inject(CuentaService);
  private toast = inject(ToastController);

  /** Input de archivo oculto: el botón de la cámara lo dispara por código. */
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly usuario$: Observable<Usuario | null>;

  /** Object URL de la foto (null = todavía no hay o no cargó). */
  fotoUrl: string | null = null;
  subiendoFoto = false;

  // ── Edición ──
  editando = false;
  guardando = false;
  form: { nombre: string; telefono: string; email: string } = { nombre: '', telefono: '', email: '' };
  errores: Record<string, string> = {};

  /** Modal de confirmación de contraseña (solo si cambia el correo). */
  pidiendoPassword = false;
  passwordActual = '';

  constructor() {
    this.usuario$ = this.auth.usuarioActual$;
  }

  ngOnInit(): void {
    // Refresca datos por si cambiaron (ej. saldo de Roosters tras un pedido).
    this.auth.refrescarPerfil().subscribe({
      next: (u) => this.cargarFotoSiHay(u),
      error: () => this.cargarFotoSiHay(this.auth.usuario),
    });
  }

  ngOnDestroy(): void {
    // El object URL vive hasta que se revoca: sin esto el blob queda en memoria.
    this.cuenta.revocarFoto();
  }

  // ── Foto ────────────────────────────────────────────────────────────────

  private cargarFotoSiHay(usuario: Usuario | null): void {
    if (!usuario?.tiene_foto) {
      this.fotoUrl = null;
      return;
    }

    this.cuenta.obtenerFotoUrl().subscribe({
      next: (url) => (this.fotoUrl = url),
      error: () => (this.fotoUrl = null),
    });
  }

  /**
   * Abre el selector nativo. Con accept="image/*" y capture ausente, Android e
   * iOS muestran el menú de siempre (Cámara / Galería / Archivos), así que no
   * hace falta ningún plugin extra.
   */
  elegirFoto(): void {
    this.fileInput?.nativeElement.click();
  }

  onFotoElegida(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    this.subiendoFoto = true;

    this.cuenta.subirFoto(archivo).subscribe({
      next: () => {
        // Se re-lee el perfil para que tiene_foto quede en true y luego se baja
        // la imagen ya normalizada por el backend (cuadrada, 512px).
        this.auth.refrescarPerfil().subscribe({
          next: (u) => {
            this.cargarFotoSiHay(u);
            this.subiendoFoto = false;
            void this.avisar('Foto actualizada');
          },
          error: () => (this.subiendoFoto = false),
        });
      },
      error: (err) => {
        this.subiendoFoto = false;
        void this.avisar(this.primerError(err) ?? 'No pudimos subir la foto', 'danger');
      },
    });

    // Permite volver a elegir el mismo archivo (si no, el change no dispara).
    input.value = '';
  }

  quitarFoto(): void {
    this.subiendoFoto = true;

    this.cuenta.eliminarFoto().subscribe({
      next: () => {
        this.cuenta.revocarFoto();
        this.fotoUrl = null;
        this.auth.refrescarPerfil().subscribe({ error: () => {} });
        this.subiendoFoto = false;
        void this.avisar('Foto eliminada');
      },
      error: () => {
        this.subiendoFoto = false;
        void this.avisar('No pudimos eliminar la foto', 'danger');
      },
    });
  }

  // ── Edición de datos ────────────────────────────────────────────────────

  empezarEdicion(u: Usuario): void {
    this.form = { nombre: u.nombre, telefono: u.telefono ?? '', email: u.email };
    this.errores = {};
    this.editando = true;
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.errores = {};
    this.pidiendoPassword = false;
    this.passwordActual = '';
  }

  /**
   * Al guardar: si el correo cambió hay que confirmar con la contraseña actual
   * (el backend la exige porque el correo es el login). Si no cambió, va directo.
   */
  guardar(u: Usuario): void {
    const emailCambio = this.form.email.trim().toLowerCase() !== u.email.toLowerCase();

    if (emailCambio && !u.es_google) {
      this.pidiendoPassword = true;
      return;
    }

    this.enviar(u, undefined);
  }

  confirmarConPassword(u: Usuario): void {
    if (!this.passwordActual) {
      return;
    }

    this.enviar(u, this.passwordActual);
  }

  private enviar(u: Usuario, passwordActual?: string): void {
    const body: ActualizarPerfilBody = {
      nombre: this.form.nombre.trim(),
      telefono: this.form.telefono.trim() || null,
    };

    // El correo solo se manda si de verdad cambió y la cuenta no es de Google:
    // así una cuenta de Google nunca dispara el 422 del backend.
    if (!u.es_google && this.form.email.trim().toLowerCase() !== u.email.toLowerCase()) {
      body.email = this.form.email.trim();
      body.password_actual = passwordActual;
    }

    this.guardando = true;
    this.errores = {};

    this.cuenta.actualizarPerfil(body).subscribe({
      next: () => {
        this.guardando = false;
        this.editando = false;
        this.pidiendoPassword = false;
        this.passwordActual = '';
        void this.avisar('Datos actualizados');
      },
      error: (err) => {
        this.guardando = false;
        this.errores = this.erroresDe(err);
        // Si falló la contraseña, se deja el modal abierto para reintentar.
        this.pidiendoPassword = !!this.errores['password_actual'];
        void this.avisar(this.primerError(err) ?? 'No pudimos guardar los cambios', 'danger');
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Aplana los errores 422 de Laravel a { campo: 'primer mensaje' }. */
  private erroresDe(err: any): Record<string, string> {
    const bag = err?.error?.errors;

    if (!bag) {
      return {};
    }

    return Object.keys(bag).reduce<Record<string, string>>((acc, campo) => {
      acc[campo] = Array.isArray(bag[campo]) ? bag[campo][0] : String(bag[campo]);
      return acc;
    }, {});
  }

  private primerError(err: any): string | null {
    const errores = this.erroresDe(err);
    const claves = Object.keys(errores);

    return claves.length ? errores[claves[0]] : (err?.error?.message ?? null);
  }

  private async avisar(mensaje: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 1900, position: 'bottom', color });
    await t.present();
  }
}
