import { Component, OnInit, OnDestroy } from '@angular/core';
import { AnaliticasService } from '../../core/services/analiticas.service';
import { AnaliticasResponse, ComparacionMesAnterior, ModalidadApi, TopProductoApi, VentaCategoria } from '../../core/models/analiticas.model';
import { SalesBarDatum } from '../shared/sales-bar-chart.component';
import { ModalityDatum } from '../shared/modality-donut-chart.component';

interface TopProduct { name: string; units: number; color: string; }
interface Legend { label: string; pct: string; value: string; c: string; bg: string; }
interface ComparacionTexto { texto: string; color: string; }

/** Paleta de colores para el ranking de productos (rojo solo para el #1). */
const RANKING_COLORS = ['#E13642', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB'];

/** Reportes y analiticas: KPIs, barras por dia / horas pico, top productos, modalidad. */
@Component({
  selector: 'app-admin-analiticas',
  templateUrl: './analiticas.page.html',
  styleUrls: ['./analiticas.page.scss'],
  standalone: false,
})
export class AdminAnaliticasPage implements OnInit, OnDestroy {
  cargando = false;
  error: string | null = null;

  // Contador de caché (los datos se recalculan cada 30 min en el backend).
  ttlMinutos = 30;
  cacheModalOpen = false;
  restanteTexto = '—';
  private expiraEnMs: number | null = null;
  private refrescando = false;
  private timer?: ReturnType<typeof setInterval>;

  // KPIs
  ventasMes = 0;
  pedidosMes = 0;
  ticketPromedio = 0;

  // Charts
  dailySales: SalesBarDatum[] = [];
  peakHours: SalesBarDatum[] = [];
  modalityData: ModalityDatum[] = [];

  // Ranking productos
  topProducts: TopProduct[] = [];
  maxUnits = 0;

  // Leyenda modalidad
  legend: Legend[] = [];

  // Comparacion mensual
  compVentas: ComparacionTexto = { texto: '', color: '' };
  compPedidos: ComparacionTexto = { texto: '', color: '' };

  // Ventas por categoria
  ventasPorCategoria: VentaCategoria[] = [];
  maxCategoriaTotal = 0;

  // Comparativos mes actual vs anterior (charts de barras)
  comparativoVentas: SalesBarDatum[] = [];
  comparativoPedidos: SalesBarDatum[] = [];

  constructor(private analiticasService: AnaliticasService) {}

  ngOnInit(): void {
    this.cargarAnaliticas();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /** Recalcula el texto del contador cada segundo; refresca al llegar a 0. */
  private tick(): void {
    if (this.expiraEnMs === null) {
      this.restanteTexto = '—';
      return;
    }
    const ms = this.expiraEnMs - Date.now();
    if (ms <= 0) {
      this.restanteTexto = 'Actualizando…';
      // Al vencer la caché, re-consulta una vez (el backend regenera y devuelve nuevo expira_en).
      if (!this.cargando && !this.refrescando) {
        this.refrescando = true;
        this.cargarAnaliticas();
      }
      return;
    }
    const totalSeg = Math.floor(ms / 1000);
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    this.restanteTexto = min > 0
      ? `${min} min ${seg.toString().padStart(2, '0')} s`
      : `${seg} s`;
  }

  cargarAnaliticas(): void {
    this.cargando = true;
    this.error = null;
    this.analiticasService.obtenerAnaliticas().subscribe({
      next: (res) => {
        this.procesarRespuesta(res);
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las analiticas.';
        this.cargando = false;
      },
    });
  }

  private procesarRespuesta(res: AnaliticasResponse): void {
    // Contador de caché
    this.ttlMinutos = res.ttl_minutos ?? 30;
    this.expiraEnMs = res.expira_en ? new Date(res.expira_en).getTime() : null;
    this.refrescando = false;
    this.tick();

    // KPIs
    this.ventasMes = res.ventas_mes;
    this.pedidosMes = res.pedidos_mes;
    this.ticketPromedio = res.ticket_promedio;

    // Ventas por dia
    this.dailySales = res.ventas_por_dia.map((v) => ({
      label: this.formatFechaDia(v.fecha),
      value: v.total,
    }));

    // Horas pico
    this.peakHours = res.horas_pico.map((h) => ({
      label: h.hora,
      value: h.cantidad,
    }));

    // Top productos
    this.topProducts = res.top_productos.map((p: TopProductoApi, i: number) => ({
      name: p.nombre,
      units: p.unidades,
      color: RANKING_COLORS[i] ?? RANKING_COLORS[RANKING_COLORS.length - 1],
    }));
    this.maxUnits = Math.max(...this.topProducts.map((p) => p.units), 0);

    // Modalidad
    this.modalityData = res.modalidad.map((m: ModalidadApi) => ({
      modalidad: m.modalidad,
      cantidad: m.cantidad,
      pct: m.pct,
    }));

    // Leyenda modalidad
    this.legend = res.modalidad.map((m: ModalidadApi, i: number) => {
      const esPico = m.pct === Math.max(...res.modalidad.map((x) => x.pct));
      return {
        label: m.modalidad,
        pct: `${Math.round(m.pct)}%`,
        value: String(m.cantidad),
        c: esPico ? '#E13642' : '#374151',
        bg: esPico ? 'rgba(225,54,66,0.05)' : '#E5E7EB',
      };
    });

    // Comparacion mensual
    this.compVentas = this.formatComparacion(res.comparacion_mes_anterior?.ventas_pct);
    this.compPedidos = this.formatComparacion(res.comparacion_mes_anterior?.pedidos_pct);

    // Ventas por categoria
    this.ventasPorCategoria = res.ventas_por_categoria ?? [];
    this.maxCategoriaTotal = Math.max(...this.ventasPorCategoria.map((c) => c.total), 0);

    // Comparativos mes actual vs anterior
    const comp = res.comparacion_mes_anterior;
    this.comparativoVentas = [
      { label: 'Mes anterior', value: comp?.ventas_mes_anterior ?? 0 },
      { label: 'Este mes', value: res.ventas_mes },
    ];
    this.comparativoPedidos = [
      { label: 'Mes anterior', value: comp?.pedidos_mes_anterior ?? 0 },
      { label: 'Este mes', value: res.pedidos_mes },
    ];
  }

  /** Formatea un porcentaje de comparacion con flecha y color. */
  private formatComparacion(pct: number | null | undefined): ComparacionTexto {
    if (pct === null || pct === undefined) {
      return { texto: 'Sin datos previos', color: '#6B7280' };
    }
    if (pct > 0) {
      return { texto: `↑ ${Math.abs(pct).toFixed(1)}% vs anterior`, color: '#16A34A' };
    }
    if (pct < 0) {
      return { texto: `↓ ${Math.abs(pct).toFixed(1)}% vs anterior`, color: '#DC2626' };
    }
    return { texto: '0% vs anterior', color: '#6B7280' };
  }

  /** Convierte "2026-07-25" a "25" o dia de semana corto segun preferencia. */
  private formatFechaDia(fecha: string): string {
    const d = new Date(fecha);
    // Usar dia del mes (1-31)
    return String(d.getDate());
  }

  // ---- Formato ----
  formatMonto(valor: number): string {
    return `₡${new Intl.NumberFormat('es-CR').format(valor)}`;
  }
}
