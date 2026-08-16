import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';
import { PedidoService } from '../core/services/pedido.service';
import { Pedido } from '../core/models/pedido.model';
import { PedidoEstado, PEDIDO_ESTADO_LABEL } from '../shared/constants/pedido-estado';
import { MODALIDAD_LABEL } from '../shared/constants/modalidad';

@Component({
  selector: 'app-mis-pedidos',
  templateUrl: './mis-pedidos.page.html',
  styleUrls: ['./mis-pedidos.page.scss'],
  standalone: false,
})
export class MisPedidosPage implements OnInit, OnDestroy {
  private pedidoService = inject(PedidoService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastController);

  private destroy$ = new Subject<void>();

  /**
   * Pedido a abrir apenas carga la lista. Llega por `?pedido=N` cuando se entra
   * tocando una notificacion push.
   */
  private pedidoDestacado: number | null = null;

  pedidos: Pedido[] = [];
  cargando = false;
  error: string | null = null;

  // Detalle expandido
  pedidoExpandido: number | null = null;

  readonly MODALIDAD_LABEL = MODALIDAD_LABEL;

  ngOnInit(): void {
    const crudo = Number(this.route.snapshot.queryParamMap.get('pedido'));
    this.pedidoDestacado = Number.isInteger(crudo) && crudo > 0 ? crudo : null;
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
          // Los pedidos ya pagados salen de aqui y viven en "Historial de compras".
          this.pedidos = pedidos.filter((p) => !p.pagado);
          this.cargando = false;

          // Si venimos de una notificacion, se abre ese pedido (si sigue en la lista).
          if (this.pedidoDestacado !== null && this.pedidos.some((p) => p.id === this.pedidoDestacado)) {
            this.pedidoExpandido = this.pedidoDestacado;
          }
          this.pedidoDestacado = null;
        },
        error: () => {
          this.error = 'No se pudieron cargar tus pedidos. Intenta de nuevo.';
          this.cargando = false;
        },
      });
  }

  /** Copia el codigo del pedido al portapapeles (mismo patron que en "Pedir"). */
  async copiarCodigo(codigo: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(codigo);
      const t = await this.toast.create({
        message: 'Código copiado',
        duration: 1500,
        position: 'bottom',
        color: 'success',
      });
      await t.present();
    } catch {
      // Clipboard no disponible (ej. http sin TLS); no interrumpe el flujo.
    }
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
