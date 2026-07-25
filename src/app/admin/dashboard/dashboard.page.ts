import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardResumen } from '../../core/models/dashboard.model';
import { estadoToStatusType } from '../shared/status-badge.component';
import { PedidoEstado } from '../../shared/constants/pedido-estado';
import { MODALIDAD_LABEL, Modalidad } from '../../shared/constants/modalidad';

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

  readonly areaData: number[] = [];
  readonly xLabels: string[] = [];
  peakIdx = 0;
  peakValue = '';

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando = true;
    this.dashboardService.resumen().subscribe({
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

  private calcularSemana(data: DashboardResumen): void {
    const totales = data.ventas_semana.map((d) => d.total);
    const max = Math.max(...totales, 1);

    this.areaData.length = 0;
    this.xLabels.length = 0;

    data.ventas_semana.forEach((d, i) => {
      this.areaData.push(Math.round((d.total / max) * 100));
      this.xLabels.push(d.dia);
    });

    let peakIdx = 0;
    for (let i = 1; i < totales.length; i++) {
      if (totales[i] > totales[peakIdx]) {
        peakIdx = i;
      }
    }
    this.peakIdx = peakIdx;
    this.peakValue = totales[peakIdx] > 0 ? this.formatCortoColones(totales[peakIdx]) : '₡0';
  }

  private formatCortoColones(valor: number): string {
    if (valor >= 1000) {
      return `₡${Math.round(valor / 1000)}k`;
    }
    return `₡${Math.round(valor)}`;
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
