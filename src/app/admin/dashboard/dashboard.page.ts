import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardResumen } from '../../core/models/dashboard.model';
import { estadoToStatusType } from '../shared/status-badge.component';
import { PedidoEstado } from '../../shared/constants/pedido-estado';
import { MODALIDAD_LABEL, Modalidad } from '../../shared/constants/modalidad';
import { montoCorto } from '../../shared/utils/monto';

/** Dashboard admin: KPIs + gráfico de área + pedidos nuevos + últimos pedidos. */
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class AdminDashboardPage implements OnInit {
  cargando = true;
  resumen: DashboardResumen | null = null;

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
  filtroUltimos: 'todos' | 'activos' | 'hoy' | PedidoEstado = 'todos';
  readonly filtrosUltimos: { v: 'todos' | 'activos' | 'hoy' | PedidoEstado; l: string }[] = [
    { v: 'todos', l: 'Todos' },
    { v: 'hoy', l: 'Hoy' },
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

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(dias = this.rangoDias): void {
    this.cargando = true;
    this.dashboardService.resumen(dias).subscribe({
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

  /** #3 Cambia la ventana del gráfico y re-consulta. */
  cambiarRango(dias: number): void {
    this.rangoDias = dias;
    this.cargar(dias);
  }

  /** #2 Pedidos de la tabla "Últimos pedidos" según el filtro activo. */
  get ultimosPedidosFiltrados() {
    const lista = this.resumen?.ultimos_pedidos ?? [];
    if (this.filtroUltimos === 'todos') return lista;
    if (this.filtroUltimos === 'hoy') {
      const hoy = new Date().toDateString();
      return lista.filter((o) => new Date(o.created_at).toDateString() === hoy);
    }
    if (this.filtroUltimos === 'activos') {
      return lista.filter((o) => o.estado === 'pendiente' || o.estado === 'en_proceso' || o.estado === 'listo');
    }
    return lista.filter((o) => o.estado === this.filtroUltimos);
  }

  // #6 KPI resaltado como filtro activo (se trackea aparte del valor del filtro
  // para que dos KPIs con el mismo filtro no se resalten juntos ni haya default).
  kpiSel: string | null = null;

  /** #11 Aplica un filtro desde un KPI y enfoca la tabla si está lejos. */
  filtrarUltimos(filtro: 'todos' | 'activos' | 'hoy' | PedidoEstado): void {
    this.filtroUltimos = filtro;
    setTimeout(() => {
      document.getElementById('dash-ultimos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  /** #6 Selecciona un KPI (todos son clickeables) → resalta + filtra + enfoca. */
  seleccionarKpi(kpi: string, filtro: 'todos' | 'activos' | 'hoy' | PedidoEstado): void {
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
}
