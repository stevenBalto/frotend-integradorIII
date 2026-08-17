import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { PedidoService } from '../core/services/pedido.service';
import { PushNotificationService } from '../core/services/push-notification.service';
import { Pedido } from '../core/models/pedido.model';
import { Usuario } from '../core/models/usuario.model';
import { PedidoEstado, PEDIDO_ESTADO_LABEL } from '../shared/constants/pedido-estado';
import { MODALIDAD_LABEL } from '../shared/constants/modalidad';

@Component({
  selector: 'app-mi-cuenta',
  templateUrl: 'mi-cuenta.page.html',
  styleUrls: ['mi-cuenta.page.scss'],
  standalone: false,
})
export class MiCuentaPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private pedidoService = inject(PedidoService);
  private push = inject(PushNotificationService);
  private toast = inject(ToastController);

  /** Usuario logueado (o null = invitado). El template muestra login o el menu segun esto. */
  readonly usuario$: Observable<Usuario | null>;

  // Modal buscar pedido
  buscarModalAbierto = false;
  codigoBusqueda = '';
  buscandoPedido = false;
  buscarError: string | null = null;
  pedidoEncontrado: Pedido | null = null;

  // Modal metodos de pago (informativo: aun se paga todo en caja)
  metodosPagoAbierto = false;

  /** Boton de login/registro en animacion de salida (null = ninguno). Ver
      irAAuth(): la navegacion se retrasa hasta que termina la secuencia CSS
      (pop del icono -> se esconde el texto -> el icono sale corriendo). */
  authBtnLaunching: 'login' | 'register' | null = null;

  /** Misma animacion que authBtnLaunching, aplicada a la tarjeta de Roosters. */
  roostersBtnLaunching = false;

  readonly MODALIDAD_LABEL = MODALIDAD_LABEL;

  /** Roosters se muestran como cantidad (no como colones, aunque 1 Rooster = ₡1
      al canjear): usar crcCurrency ahi confundia el saldo de puntos con dinero. */
  private readonly roostersFormatter = new Intl.NumberFormat('es-CR');

  constructor() {
    this.usuario$ = this.auth.usuarioActual$;
  }

  /** Red de seguridad: el reset real vive en irAAuth() (ver comentario ahi).
      Este hook no siempre se dispara al volver de login/register (Ionic
      cachea el tab shell y ese cruce no lo retrigger), pero se deja por si
      el usuario entra a Mi cuenta por otro camino con el flag pegado. */
  ionViewWillEnter(): void {
    this.authBtnLaunching = null;
    this.roostersBtnLaunching = false;
  }

  get estaAutenticado(): boolean {
    return this.auth.estaAutenticado;
  }

  /** Nombre del usuario logueado (para mostrar en el resultado de busqueda). */
  get nombreUsuario(): string {
    return this.auth.usuario?.nombre ?? 'Vos';
  }

  /** Saldo de Roosters del usuario logueado. */
  get roostersBalance(): number {
    return this.auth.usuario?.puntos_balance ?? 0;
  }

  formatRoosters(valor: number | null | undefined): string {
    return this.roostersFormatter.format(valor ?? 0);
  }

  // ── Metodos de pago (modal) ──

  abrirMetodosPago(): void {
    this.metodosPagoAbierto = true;
  }

  cerrarMetodosPago(): void {
    this.metodosPagoAbierto = false;
  }

  // ── Bienvenida (invitado): animacion de salida antes de ir a login/registro ──

  /** Dispara la animacion del boton (pop -> texto se esconde -> icono corre a
      la derecha) y navega cuando termina. 650ms = duracion total de la
      secuencia en el SCSS; si se cambia una hay que cambiar la otra.
      El reset de authBtnLaunching va ACA (no en ionViewWillEnter): login y
      register son rutas fuera de /tabs, e Ionic cachea (no destruye) el tab
      shell al volver -- probado que ionViewWillEnter NO se vuelve a disparar
      en ese cruce, asi que el boton quedaba "congelado" a medio-animar. */
  irAAuth(destino: 'login' | 'register'): void {
    if (this.authBtnLaunching) {
      return;
    }
    this.authBtnLaunching = destino;
    setTimeout(() => {
      this.authBtnLaunching = null;
      void this.router.navigateByUrl(destino === 'login' ? '/login' : '/register');
    }, 650);
  }

  /** Misma secuencia que irAAuth() (ver ahi el detalle), aplicada al logo de
      la tarjeta de Roosters: pop -> se esconde el texto -> el logo sale
      corriendo a la derecha, y ahi recien navega. El reset va en el propio
      setTimeout (no en un lifecycle hook) por la misma razon que irAAuth(). */
  irARoosters(): void {
    if (this.roostersBtnLaunching) {
      return;
    }
    this.roostersBtnLaunching = true;
    setTimeout(() => {
      this.roostersBtnLaunching = false;
      void this.router.navigateByUrl('/tabs/mi-cuenta/roosters');
    }, 650);
  }

  // ── Sesion ──

  /** Cierra sesion en backend + local y vuelve a la vitrina. */
  cerrarSesion(): void {
    // Primero se da de baja el push token: el endpoint es privado y necesita el
    // Bearer todavia vivo, asi que tiene que pasar ANTES del logout. Si falla igual
    // se cierra la sesion (desregistrar() nunca lanza).
    void this.push.desregistrar().finally(() => {
      this.auth.logout().subscribe({
        next: () => this.irAVitrina(),
        error: () => this.irAVitrina(),
      });
    });
  }

  /** Limpia la sesion ANTES de navegar (el finalize de logout corre despues del next). */
  private irAVitrina(): void {
    this.auth.limpiarSesion();
    void this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
  }

  // ── Buscar pedido ──

  abrirBuscarPedido(): void {
    this.buscarModalAbierto = true;
    this.codigoBusqueda = '';
    this.buscarError = null;
    this.pedidoEncontrado = null;
    document.body.classList.add('buscar-modal-open');
  }

  cerrarBuscarPedido(): void {
    this.buscarModalAbierto = false;
    document.body.classList.remove('buscar-modal-open');
  }

  /** Pega el codigo desde el portapapeles al input (un toque, sin escribir). */
  async pegarCodigo(): Promise<void> {
    try {
      const texto = (await navigator.clipboard.readText()).trim();
      if (!texto) {
        const t = await this.toast.create({ message: 'El portapapeles está vacío', duration: 1500, position: 'bottom', color: 'medium' });
        await t.present();
        return;
      }
      this.codigoBusqueda = texto;
    } catch {
      const t = await this.toast.create({ message: 'No pudimos leer el portapapeles', duration: 1800, position: 'bottom', color: 'medium' });
      await t.present();
    }
  }

  buscarPedido(): void {
    const codigo = this.codigoBusqueda.trim();
    if (!codigo) {
      return;
    }

    this.buscandoPedido = true;
    this.buscarError = null;
    this.pedidoEncontrado = null;

    this.pedidoService.buscarPropioPorCodigo(codigo).subscribe({
      next: (pedido) => {
        this.pedidoEncontrado = pedido;
        this.buscandoPedido = false;
      },
      error: (err) => {
        this.buscarError = err?.error?.message || 'No encontramos un pedido con ese código a tu nombre.';
        this.buscandoPedido = false;
      },
    });
  }

  getEstadoLabel(estado: PedidoEstado): string {
    return PEDIDO_ESTADO_LABEL[estado] || estado;
  }

  formatFecha(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getEstadoClass(estado: PedidoEstado): string {
    const clases: Record<PedidoEstado, string> = {
      pendiente: 'estado--pendiente',
      en_proceso: 'estado--proceso',
      listo: 'estado--listo',
      entregado: 'estado--entregado',
      cancelado: 'estado--cancelado',
    };
    return clases[estado] || '';
  }
}
