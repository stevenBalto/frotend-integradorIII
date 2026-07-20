import { Component, OnInit } from '@angular/core';
import { Cliente, PedidoResumen } from '../../core/models/cliente.model';
import { ClienteService } from '../../core/services/cliente.service';
import { MODALIDAD_LABEL, Modalidad } from '../../shared/constants/modalidad';

type FiltroCliente = 'todos' | 'recientes' | 'sin_compras' | 'top_comprador';

const DIAS_RECIENTE = 30;

/** Clientes: analítica de compra (quién compra más, con qué frecuencia), panel admin, solo lectura. */
@Component({
  selector: 'app-admin-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: false,
})
export class AdminClientesPage implements OnInit {
  clientes: Cliente[] = [];
  cargando = false;
  error: string | null = null;

  // Busqueda + filtro por KPI
  busqueda = '';
  filtro: FiltroCliente = 'todos';

  // Modal Historial de pedidos
  historialOpen = false;
  historialCliente: Cliente | null = null;
  historialPedidos: PedidoResumen[] = [];
  cargandoHistorial = false;
  historialError: string | null = null;

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.cargando = true;
    this.error = null;
    this.clienteService.listarConEstadisticas().subscribe({
      next: (clientes) => {
        this.clientes = clientes;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los clientes.';
        this.cargando = false;
      },
    });
  }

  // ---- KPIs ----
  get totalClientes(): number {
    return this.clientes.length;
  }
  get clientesRecientes(): number {
    return this.clientes.filter((c) => this.diasDesdeUltimoPedido(c) !== null && this.diasDesdeUltimoPedido(c)! <= DIAS_RECIENTE).length;
  }
  get clientesSinCompras(): number {
    return this.clientes.filter((c) => c.cantidad_pedidos === 0).length;
  }
  get topComprador(): Cliente | null {
    if (this.clientes.length === 0) return null;
    return this.clientes.reduce((top, c) => (c.total_gastado > top.total_gastado ? c : top), this.clientes[0]);
  }

  /** Top 5 clientes por gasto total, ya ordenado desc (el chart no reordena). */
  get topCincoParaChart(): { nombre: string; totalGastado: number }[] {
    return [...this.clientes]
      .sort((a, b) => b.total_gastado - a.total_gastado)
      .slice(0, 5)
      .map((c) => ({ nombre: c.nombre, totalGastado: Math.round(c.total_gastado) }));
  }

  setFiltro(filtro: FiltroCliente): void {
    this.filtro = this.filtro === filtro ? 'todos' : filtro;
  }

  /** Lista visible: aplica busqueda por nombre/email + filtro de KPI seleccionado. */
  get clientesFiltrados(): Cliente[] {
    const texto = this.busqueda.trim().toLowerCase();
    return this.clientes.filter((c) => {
      const coincideTexto =
        !texto || c.nombre.toLowerCase().includes(texto) || c.email.toLowerCase().includes(texto);
      const dias = this.diasDesdeUltimoPedido(c);
      const coincideFiltro =
        this.filtro === 'todos' ||
        (this.filtro === 'recientes' && dias !== null && dias <= DIAS_RECIENTE) ||
        (this.filtro === 'sin_compras' && c.cantidad_pedidos === 0) ||
        (this.filtro === 'top_comprador' && this.topComprador !== null && c.id === this.topComprador.id);
      return coincideTexto && coincideFiltro;
    });
  }

  // ---- Formato ----
  formatMonto(valor: number): string {
    return `₡${new Intl.NumberFormat('es-CR').format(valor)}`;
  }
  formatUltimoPedido(c: Cliente): string {
    if (c.ultimo_pedido_en === null) return 'Sin compras';
    const dias = this.diasDesdeUltimoPedido(c)!;
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    return `Hace ${dias} días`;
  }
  getBadgeType(c: Cliente): 'active' | 'inactive' {
    return c.activo ? 'active' : 'inactive';
  }
  getPedidoBadgeType(estado: string): 'completed' | 'process' | 'cancelled' {
    if (estado === 'cancelado') return 'cancelled';
    if (estado === 'entregado' || estado === 'listo') return 'completed';
    return 'process';
  }
  formatModalidad(modalidad: string): string {
    return MODALIDAD_LABEL[modalidad as Modalidad] ?? modalidad;
  }

  private diasDesdeUltimoPedido(c: Cliente): number | null {
    if (c.ultimo_pedido_en === null) return null;
    const fecha = new Date(c.ultimo_pedido_en);
    if (isNaN(fecha.getTime())) return null;
    const hoy = new Date();
    const ms = hoy.getTime() - fecha.getTime();
    return Math.max(0, Math.floor(ms / 86400000));
  }

  // ---- Modal Historial ----
  abrirHistorial(cliente: Cliente): void {
    this.historialCliente = cliente;
    this.historialPedidos = [];
    this.historialError = null;
    this.historialOpen = true;
    this.cargandoHistorial = true;
    this.clienteService.listarPedidos(cliente.id).subscribe({
      next: (pedidos) => {
        this.historialPedidos = pedidos;
        this.cargandoHistorial = false;
      },
      error: () => {
        this.historialError = 'No se pudo cargar el historial de pedidos.';
        this.cargandoHistorial = false;
      },
    });
  }

  cerrarHistorial(): void {
    this.historialOpen = false;
    this.historialCliente = null;
  }
}
