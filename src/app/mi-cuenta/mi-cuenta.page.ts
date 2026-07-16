import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { PedidoService } from '../core/services/pedido.service';
import { PedidoPublico } from '../core/models/pedido.model';
import { PedidoEstado, PEDIDO_ESTADO_LABEL } from '../shared/constants/pedido-estado';

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
  pedidoEncontrado: PedidoPublico | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private pedidoService: PedidoService,
  ) {}

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

    this.pedidoService.buscarPorCodigo(codigo).subscribe({
      next: (pedido) => {
        this.pedidoEncontrado = pedido;
        this.buscandoPedido = false;
      },
      error: (err) => {
        this.buscarError = err?.error?.message || 'No encontramos un pedido con ese codigo.';
        this.buscandoPedido = false;
      },
    });
  }

  getEstadoLabel(estado: PedidoEstado): string {
    return PEDIDO_ESTADO_LABEL[estado] || estado;
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
