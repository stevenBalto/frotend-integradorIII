import { Component, OnDestroy } from '@angular/core';
import { ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { Router } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardResumen, PedidoNuevo } from '../../core/models/dashboard.model';
import { estadoToStatusType } from '../shared/status-badge.component';
import { PedidoEstado } from '../../shared/constants/pedido-estado';
import { MODALIDAD_LABEL, Modalidad } from '../../shared/constants/modalidad';
import { montoCorto } from '../../shared/utils/monto';

/** Fecha local (no UTC) en formato YYYY-MM-DD. Se manda como "hoy" por defecto para no
 *  depender de la zona horaria del servidor (CR es UTC-6: el "hoy" del server puede ir un
 *  día adelante y dejar la tabla vacía). */
function hoyLocalISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Dashboard admin: KPIs + gráfico de área + pedidos nuevos + últimos pedidos. */
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class AdminDashboardPage implements ViewWillEnter, ViewWillLeave, OnDestroy {
  cargando = true;
  resumen: DashboardResumen | null = null;

  /** Rango de "Últimos pedidos" (independiente del gráfico). Vacío = HOY (lo resuelve
   *  el backend). Al abrir el calendario los campos arrancan vacíos; los últimos pedidos
   *  solo cambian cuando el usuario elige un rango. */
  ultimosDesde = '';
  ultimosHasta = '';
  /** Los calendarios de rango solo aparecen si el usuario los abre (por defecto: hoy). */
  rangoAbierto = false;

  /** Refresco en tiempo real (real-time) mientras la página está activa. */
  private pollHandle?: ReturnType<typeof setInterval>;
  private readonly POLL_MS = 20000;

  /** Monto compacto para las pastillas KPI del header. */
  readonly montoCorto = montoCorto;

  valores: number[] = [];
  xLabels: string[] = [];

  // #3 Ventana del gráfico de ventas (select funcional).
  rangoDias = 7;
  readonly rangos: { v: number; l: string }[] = [
    { v: 7, l: 'Últimos 7 días' },
    { v: 14, l: 'Últimos 14 días' },
    { v: 30, l: 'Últimos 30 días' },
  ];

  // #2 Filtro de la tabla "Últimos pedidos" (también lo alimentan los KPIs).
  filtroUltimos: 'todos' | 'activos' | PedidoEstado = 'todos';
  readonly filtrosUltimos: { v: 'todos' | 'activos' | PedidoEstado; l: string }[] = [
    { v: 'todos', l: 'Todos' },
    { v: 'activos', l: 'Activos' },
    { v: 'pendiente', l: 'Pendientes' },
    { v: 'en_proceso', l: 'En preparación' },
    { v: 'listo', l: 'Listos' },
    { v: 'entregado', l: 'Entregados' },
    { v: 'cancelado', l: 'Cancelados' },
  ];

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
  ) {}

  // Ciclo de vida Ionic (la página se cachea con IonicRouteStrategy → EF-13): cargar
  // y arrancar el polling al ENTRAR, detenerlo al SALIR (si no, sigue sondeando en
  // segundo plano en otras secciones).
  ionViewWillEnter(): void {
    this.cargar();
    this.iniciarPolling();
  }

  ionViewWillLeave(): void {
    this.detenerPolling();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  /**
   * Trae el resumen con la ventana del gráfico (`rangoDias`) y el rango de últimos
   * pedidos (`ultimosDesde`/`ultimosHasta`). `silencioso` = refresco de polling (no
   * muestra "Cargando..." para no parpadear).
   */
  private cargar(silencioso = false): void {
    if (!silencioso) {
      this.cargando = true;
    }
    // Campos vacíos = HOY: mando la fecha local explícita (no dejo que el server decida
    // "hoy" en su zona horaria, que puede diferir de la local y vaciar la tabla).
    const desde = this.ultimosDesde || hoyLocalISO();
    const hasta = this.ultimosHasta || hoyLocalISO();
    this.dashboardService.resumen(this.rangoDias, desde, hasta).subscribe({
      next: (data) => {
        this.resumen = data;
        this.calcularSemana(data);
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  private iniciarPolling(): void {
    this.detenerPolling();
    this.pollHandle = setInterval(() => this.cargar(true), this.POLL_MS);
  }

  private detenerPolling(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = undefined;
    }
  }

  /** #3 Cambia la ventana del gráfico y re-consulta. */
  cambiarRango(dias: number): void {
    this.rangoDias = dias;
    this.cargar();
  }

  /** Cambia el rango de fechas de "Últimos pedidos" y re-consulta (independiente del gráfico). */
  cambiarRangoUltimos(): void {
    this.cargar();
  }

  /** Abre/cierra los calendarios de rango. Al abrir: campos vacíos (arranca en HOY).
   *  Al cerrar: vacía el rango (vuelve a HOY) y recarga si había filtro puesto. */
  toggleRango(): void {
    if (this.rangoAbierto) {
      const teniaFiltro = this.ultimosDesde !== '' || this.ultimosHasta !== '';
      this.ultimosDesde = '';
      this.ultimosHasta = '';
      this.rangoAbierto = false;
      if (teniaFiltro) {
        this.cargar();
      }
    } else {
      this.rangoAbierto = true;
    }
  }

  /** Muestra el indicador "HOY" solo con el panel de fechas cerrado y sin rango elegido
   *  (los últimos pedidos son los del día). Al abrir "Fechas" o filtrar por rango se oculta. */
  get rangoEsHoy(): boolean {
    return !this.rangoAbierto && this.ultimosDesde === '' && this.ultimosHasta === '';
  }

  /** #2 Pedidos de la tabla "Últimos pedidos" según el filtro de estado activo.
   *  El rango de fechas lo resuelve el backend (no se filtra por fecha en cliente). */
  get ultimosPedidosFiltrados() {
    const lista = this.resumen?.ultimos_pedidos ?? [];
    if (this.filtroUltimos === 'todos') return lista;
    if (this.filtroUltimos === 'activos') {
      return lista.filter((o) => o.estado === 'pendiente' || o.estado === 'en_proceso' || o.estado === 'listo');
    }
    return lista.filter((o) => o.estado === this.filtroUltimos);
  }

  // #6 KPI resaltado como filtro activo (se trackea aparte del valor del filtro
  // para que dos KPIs con el mismo filtro no se resalten juntos ni haya default).
  kpiSel: string | null = null;

  /** #11 Aplica un filtro desde un KPI y enfoca la tabla si está lejos. */
  filtrarUltimos(filtro: 'todos' | 'activos' | PedidoEstado): void {
    this.filtroUltimos = filtro;
    setTimeout(() => {
      document.getElementById('dash-ultimos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  /** #6 Selecciona un KPI (todos son clickeables) → resalta + filtra + enfoca. */
  seleccionarKpi(kpi: string, filtro: 'todos' | 'activos' | PedidoEstado): void {
    this.kpiSel = kpi;
    this.filtrarUltimos(filtro);
  }

  private calcularSemana(data: DashboardResumen): void {
    // El <area-chart> recibe los montos crudos y arma su propia escala/pico en ₡.
    this.valores = data.ventas_semana.map((d) => d.total);
    this.xLabels = data.ventas_semana.map((d) => d.dia);
  }

  variacionTexto(variacion: number | null): string | undefined {
    if (variacion === null) {
      return undefined;
    }
    const flecha = variacion >= 0 ? '↑' : '↓';
    return `${flecha} ${Math.abs(variacion)}% vs ayer`;
  }

  variacionColor(variacion: number | null): string {
    if (variacion === null) {
      return '#6B7280';
    }
    return variacion >= 0 ? '#16A34A' : '#DC2626';
  }

  tiempoRelativo(fechaIso: string): string {
    const minutos = Math.max(0, Math.round((Date.now() - new Date(fechaIso).getTime()) / 60000));
    if (minutos < 1) {
      return 'ahora mismo';
    }
    if (minutos < 60) {
      return `hace ${minutos} min`;
    }
    const horas = Math.round(minutos / 60);
    if (horas < 24) {
      return `hace ${horas} h`;
    }
    const dias = Math.round(horas / 24);
    return `hace ${dias} d`;
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  modoModalidad(modalidad: Modalidad): string {
    return modalidad === 'comer_aqui' ? 'aqui' : 'llevar';
  }

  formatModalidad(modalidad: string): string {
    return MODALIDAD_LABEL[modalidad as Modalidad] ?? modalidad;
  }

  estadoToStatusType(estado: PedidoEstado) {
    return estadoToStatusType(estado);
  }

  irAPedidos(): void {
    void this.router.navigate(['/admin/pedidos']);
  }

  /** Va a Pedidos y le pide resaltar (scroll + animación) ESE pedido específico. */
  irAPedido(o: PedidoNuevo): void {
    void this.router.navigate(['/admin/pedidos'], { queryParams: { codigo: o.codigo } });
  }
}
