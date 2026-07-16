import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PedidoService } from '../core/services/pedido.service';
import { Pedido } from '../core/models/pedido.model';
import { PedidoEstado, PEDIDO_ESTADO_LABEL } from '../shared/constants/pedido-estado';

@Component({
  selector: 'app-mis-pedidos',
  templateUrl: './mis-pedidos.page.html',
  styleUrls: ['./mis-pedidos.page.scss'],
  standalone: false,
})
export class MisPedidosPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  pedidos: Pedido[] = [];
  cargando = false;
  error: string | null = null;

  // Detalle expandido
  pedidoExpandido: number | null = null;

  constructor(private pedidoService: PedidoService) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarPedidos(): void {
    this.cargando = true;
    this.error = null;
    this.pedidoService.misPedidos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pedidos) => {
          this.pedidos = pedidos;
          this.cargando = false;
        },
        error: () => {
          this.error = 'No se pudieron cargar tus pedidos. Intenta de nuevo.';
          this.cargando = false;
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

  toggleDetalle(pedidoId: number): void {
    this.pedidoExpandido = this.pedidoExpandido === pedidoId ? null : pedidoId;
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
}
