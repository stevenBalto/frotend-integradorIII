import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { SuperAdminAuthService } from '../../core/services/superadmin-auth.service';
import { LoginResultado, PasswordExpiradaResponse } from '../../core/models/usuario.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private superAuth = inject(SuperAdminAuthService);
  private router = inject(Router);
  private toast = inject(ToastController);

  readonly form: FormGroup;
  showPassword = false;
  cargando = false;

  // Item 19: Modal de cambio de contrasena expirada
  showPasswordModal = false;
  passwordModalForm: FormGroup;
  passwordModalCargando = false;
  showPasswordActual = false;
  showPasswordNueva = false;
  showPasswordConfirm = false;
  private loginPendiente: string = '';
  private motivoExpiracion: string = '';

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.passwordModalForm = this.fb.group({
      password_actual: ['', [Validators.required]],
      password_nueva: ['', [Validators.required, Validators.minLength(8)]],
      password_nueva_confirmation: ['', [Validators.required]],
    });
  }

  /**
   * Al entrar a la pantalla se revisa si venimos de Google: el backend deja el
   * resultado en el fragmento (#) de la URL. Vale tanto para el navegador de
   * escritorio como para el del telefono.
   */
  ngOnInit(): void {
    const respuesta = this.auth.leerRespuestaDeGoogle();
    if (!respuesta) {
      return;
    }

    if (respuesta.error) {
      void this.notificar(respuesta.error);
      return;
    }

    if (respuesta.codigo) {
      this.canjearGoogle(respuesta.codigo);
    }
  }

  /** Manda al usuario a elegir su cuenta de Google. Sale de la app y vuelve aca. */
  entrarConGoogle(): void {
    this.cargando = true;
    this.auth.irAGoogle('/login');
  }

  /** Cambia el codigo de un solo uso por la sesion y entra. */
  private canjearGoogle(codigo: string): void {
    this.cargando = true;
    this.auth.canjearCodigoGoogle(codigo).subscribe({
      next: (res) => {
        this.cargando = false;
        // Google es puerta de CLIENTES (el backend rechaza cuentas admin), asi
        // que el destino es siempre la app del cliente.
        void this.router.navigateByUrl('/tabs/home');
        void this.notificarExito(`Hola, ${res.data.nombre.split(' ')[0]}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        void this.notificar(err.error?.message ?? 'No se pudo iniciar sesion con Google.');
      },
    });
  }

  /** Type guard para identificar respuesta de password expirada. */
  private esPasswordExpirada(res: LoginResultado | PasswordExpiradaResponse): res is PasswordExpiradaResponse {
    return 'debe_cambiar_password' in res && res.debe_cambiar_password === true;
  }

  login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.notificar('Completa correo y contrasena.');
      return;
    }
    this.cargando = true;
    const credenciales = this.form.getRawValue();

    this.auth.loginUnificado(credenciales).subscribe({
      next: (res) => {
        this.cargando = false;

        // Item 19: Verificar si la contrasena esta expirada
        if (this.esPasswordExpirada(res)) {
          this.loginPendiente = credenciales.email;
          this.motivoExpiracion = res.motivo;
          this.abrirModalPassword();
          return;
        }

        // Login exitoso normal
        const loginRes = res as LoginResultado;

        if (loginRes.tipo === 'superadmin') {
          // Superadmin: sesion aislada + panel de superadmin.
          this.superAuth.adoptarSesion({ data: loginRes.data, token: loginRes.token });
          void this.router.navigateByUrl('/superadmin/panel');
          return;
        }

        // Usuario normal: sesion normal + panel segun rol.
        this.auth.adoptarSesion({ data: loginRes.data, token: loginRes.token });

        // Contraseña temporal / cambio obligatorio -> primero cambiarla.
        if (loginRes.data.must_change_password) {
          void this.router.navigateByUrl('/cambiar-password');
          return;
        }

        const esAdmin = loginRes.data.rol === 'super_admin' || loginRes.data.rol === 'admin_sede';
        void this.router.navigateByUrl(esAdmin ? '/admin' : '/tabs/home');
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        void this.notificar(err.error?.message ?? 'No se pudo iniciar sesion. Intenta de nuevo.');
      },
    });
  }

  // -- Modal de cambio de contrasena expirada --
  private abrirModalPassword(): void {
    this.passwordModalForm.reset();
    this.showPasswordActual = false;
    this.showPasswordNueva = false;
    this.showPasswordConfirm = false;
    this.showPasswordModal = true;
  }

  cerrarModalPassword(): void {
    this.showPasswordModal = false;
    this.loginPendiente = '';
  }

  get mensajeExpiracion(): string {
    switch (this.motivoExpiracion) {
      case 'expirada':
        return 'Tu contrasena ha expirado. Por seguridad, debes crear una nueva para continuar.';
      case 'temporal':
        return 'Esta es una contrasena temporal. Por seguridad, debes crear una nueva para continuar.';
      case 'obligatorio':
        return 'Se requiere que cambies tu contrasena. Por seguridad, debes crear una nueva para continuar.';
      default:
        return 'Por seguridad, debes actualizar tu contrasena para continuar.';
    }
  }

  cambiarPassword(): void {
    if (this.passwordModalForm.invalid) {
      this.passwordModalForm.markAllAsTouched();
      void this.notificar('Completa todos los campos.');
      return;
    }

    const v = this.passwordModalForm.getRawValue();

    if (v.password_nueva !== v.password_nueva_confirmation) {
      void this.notificar('Las contrasenas nuevas no coinciden.');
      return;
    }

    this.passwordModalCargando = true;

    this.auth.cambiarPasswordExpirada({
      login: this.loginPendiente,
      password_actual: v.password_actual,
      password_nueva: v.password_nueva,
      password_nueva_confirmation: v.password_nueva_confirmation,
    }).subscribe({
      next: (res) => {
        this.passwordModalCargando = false;
        this.showPasswordModal = false;

        // Continuar con el login normal usando el token recibido
        if (res.tipo === 'superadmin') {
          this.superAuth.adoptarSesion({ data: res.data, token: res.token });
          void this.router.navigateByUrl('/superadmin/panel');
          return;
        }

        this.auth.adoptarSesion({ data: res.data, token: res.token });
        const esAdmin = res.data.rol === 'super_admin' || res.data.rol === 'admin_sede';
        void this.router.navigateByUrl(esAdmin ? '/admin' : '/tabs/home');
        void this.notificarExito('Contrasena actualizada. Bienvenido.');
      },
      error: (err: HttpErrorResponse) => {
        this.passwordModalCargando = false;
        const mensaje = err.error?.message ?? 'No se pudo cambiar la contrasena.';
        void this.notificar(mensaje);
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

  private async notificarExito(mensaje: string): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 2500, position: 'top', color: 'success' });
    await t.present();
  }
}
