import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, filter } from 'rxjs/operators';
import { PedidoService } from '../../core/services/pedido.service';
import { PedidoAdmin, FiltrosPedidoAdmin } from '../../core/models/pedido.model';
import {
  PedidoEstado,
  PEDIDO_ESTADO_LABEL,
  esTransicionValida,
} from '../../shared/constants/pedido-estado';
import { MODALIDAD_LABEL, Modalidad } from '../../shared/constants/modalidad';
import { estadoToStatusType } from '../shared/status-badge.component';

type FiltroEstado = 'todos' | PedidoEstado;

/** Gestion de pedidos: stats, tabla y modal de detalle (conectado a API real). */
@Component({
  selector: 'app-admin-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: false,
})
export class AdminPedidosPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private pausarPolling = false;

  // Lista de pedidos
  pedidos: PedidoAdmin[] = [];
  cargando = false;
  error: string | null = null;

  // Filtros
  filtroEstado: FiltroEstado = 'todos';
  busqueda = '';

  // Modal detalle
  modalOpen = false;
  pedidoSeleccionado: PedidoAdmin | null = null;
  cambiandoEstado = false;
  registrandoPago = false;
  accionError: string | null = null;

  // Estado que se esta revirtiendo ahora mismo (micro-feedback no bloqueante).
  revirtiendoEstado: PedidoEstado | null = null;

  constructor(private pedidoService: PedidoService) {}

  ngOnInit(): void {
    this.cargarPedidos();
    this.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── KPIs ──

  get totalPedidos(): number {
    return this.pedidos.length;
  }

  get totalPendientes(): number {
    return this.pedidos.filter((p) => p.estado === 'pendiente').length;
  }

  get totalEnProceso(): number {
    return this.pedidos.filter((p) => p.estado === 'en_proceso').length;
  }

  get totalListos(): number {
    return this.pedidos.filter((p) => p.estado === 'listo').length;
  }

  get totalEntregados(): number {
    return this.pedidos.filter((p) => p.estado === 'entregado').length;
  }

  setFiltroEstado(filtro: FiltroEstado): void {
    this.filtroEstado = this.filtroEstado === filtro ? 'todos' : filtro;
  }

  // ── Lista filtrada ──

  get pedidosFiltrados(): PedidoAdmin[] {
    let resultado = this.pedidos;

    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      resultado = resultado.filter((p) => p.estado === this.filtroEstado);
    }

    // Filtrar por busqueda (codigo o nombre de cliente)
    const texto = this.busqueda.trim().toLowerCase();
    if (texto) {
      resultado = resultado.filter(
        (p) =>
          p.codigo.toLowerCase().includes(texto) ||
          p.cliente.nombre.toLowerCase().includes(texto)
      );
    }

    return resultado;
  }

  // ── Carga ──

  cargarPedidos(): void {
    this.cargando = true;
    this.error = null;

    const filtros: FiltrosPedidoAdmin = {};
    if (this.filtroEstado !== 'todos') {
      filtros.estado = this.filtroEstado;
    }
    if (this.busqueda.trim()) {
      filtros.q = this.busqueda.trim();
    }

    this.pedidoService.listarAdmin(filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pedidos) => {
          this.pedidos = pedidos;
          this.cargando = false;
        },
        error: () => {
          this.error = 'No se pudieron cargar los pedidos. Intenta de nuevo.';
          this.cargando = false;
        },
      });
  }

  private iniciarPolling(): void {
    interval(15000)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => !this.pausarPolling && !this.modalOpen),
        switchMap(() => this.pedidoService.listarAdmin())
      )
      .subscribe({
        next: (pedidos) => {
          this.pedidos = pedidos;
        },
      });
  }

  // ── Modal detalle ──

  abrirDetalle(pedido: PedidoAdmin): void {
    this.pedidoSeleccionado = pedido;
    this.accionError = null;
    this.modalOpen = true;
    this.pausarPolling = true;
  }

  cerrarModal(): void {
    this.modalOpen = false;
    this.pedidoSeleccionado = null;
    this.pausarPolling = false;
  }

  // ── Cambio de estado ──

  puedeTransicionar(estado: PedidoEstado): boolean {
    if (!this.pedidoSeleccionado) {
      return false;
    }
    return esTransicionValida(this.pedidoSeleccionado.estado, estado);
  }

  /**
   * Avance de estado directo, de un solo click (sin modal ni motivo).
   * Mismo resultado que el viejo confirmarCambioEstado() pero sin el paso intermedio.
   */
  cambiarEstadoDirecto(estado: PedidoEstado): void {
    if (!this.pedidoSeleccionado || this.cambiandoEstado) {
      return;
    }

    this.cambiandoEstado = true;
    this.accionError = null;

    this.pedidoService
      .cambiarEstado(this.pedidoSeleccionado.id, estado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pedido) => {
          this.pedidoSeleccionado = pedido;
          this.actualizarPedidoEnLista(pedido);
          this.cambiandoEstado = false;
        },
        error: (err) => {
          this.accionError = err?.error?.message || 'No se pudo cambiar el estado.';
          this.cambiandoEstado = false;
        },
      });
  }

  // ── Revertir estado (historial) ──

  /**
   * Indice de la entrada MAS RECIENTE del historial (= estado actual).
   * A esa fila no le mostramos el boton de revertir (revertir al estado actual
   * no tiene sentido). Se calcula por timestamp para ser robusto al orden del array.
   */
  indiceHistorialActual(): number {
    const h = this.pedidoSeleccionado?.historial;
    if (!h || h.length === 0) {
      return -1;
    }
    let idx = 0;
    let max = new Date(h[0].creado_en).getTime();
    for (let i = 1; i < h.length; i++) {
      const t = new Date(h[i].creado_en).getTime();
      if (t >= max) {
        max = t;
        idx = i;
      }
    }
    return idx;
  }

  revertirAEstado(estado: PedidoEstado): void {
    if (!this.pedidoSeleccionado || this.revirtiendoEstado) {
      return;
    }

    this.revirtiendoEstado = estado;
    this.accionError = null;

    this.pedidoService
      .revertirEstado(this.pedidoSeleccionado.id, estado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pedido) => {
          this.pedidoSeleccionado = pedido;
          this.actualizarPedidoEnLista(pedido);
          this.revirtiendoEstado = null;
        },
        error: (err) => {
          this.accionError = err?.error?.message || 'No se pudo revertir el estado.';
          this.revirtiendoEstado = null;
        },
      });
  }

  // ── Registrar pago ──

  get puedeRegistrarPago(): boolean {
    return (
      this.pedidoSeleccionado !== null &&
      this.pedidoSeleccionado.estado === 'entregado' &&
      !this.pedidoSeleccionado.pagado
    );
  }

  registrarPago(): void {
    if (!this.pedidoSeleccionado || !this.puedeRegistrarPago) {
      return;
    }

    const confirmado = window.confirm('¿Confirmar pago de este pedido?');
    if (!confirmado) {
      return;
    }

    this.registrandoPago = true;
    this.accionError = null;

    this.pedidoService
      .registrarPago(this.pedidoSeleccionado.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pedido) => {
          this.pedidoSeleccionado = pedido;
          this.actualizarPedidoEnLista(pedido);
          this.registrandoPago = false;
        },
        error: (err) => {
          this.accionError = err?.error?.message || 'No se pudo registrar el pago.';
          this.registrandoPago = false;
        },
      });
  }

  // ── Helpers ──

  private actualizarPedidoEnLista(pedido: PedidoAdmin): void {
    const index = this.pedidos.findIndex((p) => p.id === pedido.id);
    if (index >= 0) {
      this.pedidos = [
        ...this.pedidos.slice(0, index),
        pedido,
        ...this.pedidos.slice(index + 1),
      ];
    }
    // Forzar recarga para tener datos frescos
    this.cargarPedidos();
  }

  estadoToStatusType(estado: PedidoEstado) {
    return estadoToStatusType(estado);
  }

  getEstadoLabel(estado: PedidoEstado): string {
    return PEDIDO_ESTADO_LABEL[estado] || estado;
  }

  formatFecha(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatModalidad(modalidad: string): string {
    return MODALIDAD_LABEL[modalidad as Modalidad] ?? modalidad;
  }

  getClienteInicial(nombre: string): string {
    return nombre.charAt(0).toUpperCase();
  }
}
