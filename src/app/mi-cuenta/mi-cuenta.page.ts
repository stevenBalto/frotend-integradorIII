import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { PedidoService } from '../core/services/pedido.service';
import { Pedido } from '../core/models/pedido.model';
import { PedidoEstado, PEDIDO_ESTADO_LABEL } from '../shared/constants/pedido-estado';
import { MODALIDAD_LABEL } from '../shared/constants/modalidad';

@Component({
  selector: 'app-mi-cuenta',
  templateUrl: 'mi-cuenta.page.html',
  styleUrls: ['mi-cuenta.page.scss'],
  standalone: false,
})
export class MiCuentaPage {
  // Modal buscar pedido
  buscarModalAbierto = false;
  codigoBusqueda = '';
  buscandoPedido = false;
  buscarError: string | null = null;
  pedidoEncontrado: Pedido | null = null;

  readonly MODALIDAD_LABEL = MODALIDAD_LABEL;

  constructor(
    private auth: AuthService,
    private router: Router,
    private pedidoService: PedidoService,
  ) {}

  /** Nombre del usuario logueado (para mostrar en el resultado de busqueda). */
  get nombreUsuario(): string {
    return this.auth.usuario?.nombre ?? 'Vos';
  }

  /** Cierra sesion en backend + local y vuelve al login. */
  cerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => this.irAlLogin(),
      error: () => this.irAlLogin(),
    });
  }

  /**
   * Limpia la sesion ANTES de navegar. Sin esto, el guestGuard del login ve la
   * sesion todavia activa (el finalize de logout() corre despues del next) y
   * rebota a /tabs/home — por eso "no salia el login".
   */
  private irAlLogin(): void {
    this.auth.limpiarSesion();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  // ── Buscar pedido ──

  abrirBuscarPedido(): void {
    this.buscarModalAbierto = true;
    this.codigoBusqueda = '';
    this.buscarError = null;
    this.pedidoEncontrado = null;
  }

  cerrarBuscarPedido(): void {
    this.buscarModalAbierto = false;
  }

  buscarPedido(): void {
    const codigo = this.codigoBusqueda.trim();
    if (!codigo) {
      return;
    }

    this.buscandoPedido = true;
    this.buscarError = null;
    this.pedidoEncontrado = null;

    // Endpoint autenticado: devuelve el pedido completo del usuario logueado.
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
