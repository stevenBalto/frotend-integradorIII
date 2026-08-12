import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { PedidoService } from '../core/services/pedido.service';
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

  readonly MODALIDAD_LABEL = MODALIDAD_LABEL;

  constructor() {
    this.usuario$ = this.auth.usuarioActual$;
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

  // ── Metodos de pago (modal) ──

  abrirMetodosPago(): void {
    this.metodosPagoAbierto = true;
  }

  cerrarMetodosPago(): void {
    this.metodosPagoAbierto = false;
  }

  // ── Sesion ──

  /** Cierra sesion en backend + local y vuelve a la vitrina. */
  cerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => this.irAVitrina(),
      error: () => this.irAVitrina(),
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
