import { Component, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { AnaliticasParams, AnaliticasService } from '../../core/services/analiticas.service';
import { AnaliticasResponse, ComparacionMesAnterior, Granularidad, ModalidadApi, TopProductoApi, VentaCategoria } from '../../core/models/analiticas.model';
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
export class AdminAnaliticasPage implements ViewWillEnter, ViewWillLeave, OnDestroy {
  cargando = false;
  error: string | null = null;
  exportando: 'excel' | 'pdf' | null = null;

  // Filtro de periodo
  granularidad: Granularidad = 'mes';
  private fechaAncla: Date = new Date();

  // Selector de calendario
  pickerOpen = false;
  pickerValue = '';

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
  modalidadTotalPedidos = 0;
  modalidadInsight = '';

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

  /**
   * Ionic cachea las páginas (IonicRouteStrategy) y no siempre destruye el
   * componente al salir, por lo que ngOnInit/ngOnDestroy no son confiables
   * para el timer. Se usan los hooks de vista de Ionic, que sí se disparan
   * en cada entrada/salida real de la página.
   */
  ionViewWillEnter(): void {
    this.iniciarTimer();
    this.cargarAnaliticas();
  }

  ionViewWillLeave(): void {
    this.detenerTimer();
  }

  ngOnDestroy(): void {
    this.detenerTimer();
  }

  private iniciarTimer(): void {
    this.detenerTimer();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  private detenerTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
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
    this.analiticasService.obtenerAnaliticas(this.paramsActuales()).subscribe({
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

  /** Params del periodo actualmente filtrado, compartidos entre la carga y las exportaciones. */
  private paramsActuales(): AnaliticasParams {
    return this.granularidad === 'mes'
      ? { granularidad: this.granularidad, mes: this.formatMes(this.fechaAncla) }
      : { granularidad: this.granularidad, fecha: this.formatFecha(this.fechaAncla) };
  }

  /** Descarga el resumen del periodo filtrado como Excel (.xlsx). */
  exportarExcel(): void {
    this.descargar(this.analiticasService.exportarExcel(this.paramsActuales()), 'excel', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  /** Descarga el resumen del periodo filtrado como PDF. */
  exportarPdf(): void {
    this.descargar(this.analiticasService.exportarPdf(this.paramsActuales()), 'pdf', 'pdf', 'application/pdf');
  }

  private descargar(obs: Observable<Blob>, tipo: 'excel' | 'pdf', extension: string, mime: string): void {
    if (this.exportando) {
      return;
    }
    this.exportando = tipo;
    obs.subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(new Blob([blob], { type: mime }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `analiticas-${this.granularidad}-${this.formatFecha(this.fechaAncla)}.${extension}`;
        link.click();
        URL.revokeObjectURL(url);
        this.exportando = null;
      },
      error: () => {
        this.error = 'No se pudo generar el archivo de exportación.';
        this.exportando = null;
      },
    });
  }

  /** Cambia la granularidad del filtro, vuelve a hoy como fecha ancla y recarga. */
  cambiarGranularidad(g: Granularidad): void {
    if (g === this.granularidad) {
      return;
    }
    this.granularidad = g;
    this.fechaAncla = new Date();
    this.cargarAnaliticas();
  }

  /** Retrocede un periodo (mes/semana/dia segun granularidad actual) y recarga. */
  periodoAnterior(): void {
    this.moverPeriodo(-1);
  }

  /** Avanza un periodo (mes/semana/dia segun granularidad actual) y recarga. */
  periodoSiguiente(): void {
    this.moverPeriodo(1);
  }

  private moverPeriodo(direccion: 1 | -1): void {
    const fecha = new Date(this.fechaAncla);
    if (this.granularidad === 'mes') {
      fecha.setDate(1);
      fecha.setMonth(fecha.getMonth() + direccion);
    } else if (this.granularidad === 'semana') {
      fecha.setDate(fecha.getDate() + direccion * 7);
    } else {
      fecha.setDate(fecha.getDate() + direccion);
    }
    this.fechaAncla = fecha;
    this.cargarAnaliticas();
  }

  /** Texto legible del periodo actualmente seleccionado. */
  etiquetaPeriodo(): string {
    if (this.granularidad === 'mes') {
      const texto = this.fechaAncla.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    }
    if (this.granularidad === 'dia') {
      const texto = this.fechaAncla.toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    }
    const inicio = this.inicioSemana(this.fechaAncla);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    const mismoMes = inicio.getMonth() === fin.getMonth();
    const diaInicio = inicio.toLocaleDateString('es-CR', { day: 'numeric', month: mismoMes ? undefined : 'short' });
    const diaFin = fin.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
    return `Semana del ${diaInicio} al ${diaFin}`;
  }

  /** Frase para labels de KPI: "del mes" / "de la semana" / "del día". */
  etiquetaKpi(): string {
    if (this.granularidad === 'semana') {
      return 'de la semana';
    }
    if (this.granularidad === 'dia') {
      return 'del día';
    }
    return 'del mes';
  }

  /** Frase corta para el "vs X anterior" del ticket promedio. */
  etiquetaAnteriorCorta(): string {
    if (this.granularidad === 'semana') {
      return 'semana anterior';
    }
    if (this.granularidad === 'dia') {
      return 'día anterior';
    }
    return 'mes anterior';
  }

  /** Abre el selector de calendario con la fecha ancla actual precargada. */
  abrirPicker(): void {
    this.pickerValue = this.granularidad === 'mes' ? this.formatMes(this.fechaAncla) : this.formatFecha(this.fechaAncla);
    this.pickerOpen = true;
  }

  cerrarPicker(): void {
    this.pickerOpen = false;
  }

  /** Presentación del ion-datetime según la granularidad activa. */
  pickerPresentation(): 'month-year' | 'date' {
    return this.granularidad === 'mes' ? 'month-year' : 'date';
  }

  /** Límite superior del calendario: no se puede navegar a periodos futuros. */
  pickerMax(): string {
    const hoy = new Date();
    return this.granularidad === 'mes' ? this.formatMes(hoy) : this.formatFecha(hoy);
  }

  /** Guarda la selección del calendario en espera de confirmación (no aplica todavía). */
  onFechaPicker(evento: CustomEvent): void {
    const valor = evento.detail?.value;
    if (!valor || typeof valor !== 'string') {
      return;
    }
    this.pickerValue = valor;
  }

  /** Confirma la selección del calendario, la aplica como nueva fecha ancla y recarga. */
  confirmarPicker(): void {
    const partes = this.pickerValue.split('-').map(Number);
    const [year, month, day] = partes;
    this.fechaAncla = this.granularidad === 'mes'
      ? new Date(year, month - 1, 1)
      : new Date(year, month - 1, day ?? 1);
    this.pickerOpen = false;
    this.cargarAnaliticas();
  }

  /** Traduce el codigo crudo de modalidad ("para_llevar", "comer_aqui") a texto legible. */
  private nombreModalidad(codigo: string): string {
    const mapa: Record<string, string> = {
      para_llevar: 'Para llevar',
      comer_aqui: 'Comer aquí',
    };
    if (mapa[codigo]) {
      return mapa[codigo];
    }
    return codigo
      .split('_')
      .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
  }

  /** Formato corto para el eje del gráfico: "7am", "7pm". */
  private formatHoraCorta(hora: string | number): string {
    const h = Number(hora);
    const periodo = h < 12 ? 'am' : 'pm';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}${periodo}`;
  }

  /** Icono por modalidad ("Comer aquí" / "Para llevar"; fallback genérico). */
  iconoModalidad(label: string): string {
    const l = label.toLowerCase();
    if (l.includes('aqu') || l.includes('mesa') || l.includes('salon') || l.includes('salón')) {
      return 'restaurant-outline';
    }
    if (l.includes('llevar')) {
      return 'bag-handle-outline';
    }
    return 'ellipse-outline';
  }

  /** Lunes de la semana calendario que contiene la fecha dada. */
  private inicioSemana(fecha: Date): Date {
    const d = new Date(fecha);
    const dia = d.getDay(); // 0=domingo..6=sabado
    const offset = dia === 0 ? -6 : 1 - dia;
    d.setDate(d.getDate() + offset);
    return d;
  }

  private formatMes(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private formatFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      label: this.formatHoraCorta(h.hora),
      value: h.cantidad,
    }));

    // Top productos
    this.topProducts = res.top_productos.map((p: TopProductoApi, i: number) => ({
      name: p.nombre,
      units: p.unidades,
      color: RANKING_COLORS[i] ?? RANKING_COLORS[RANKING_COLORS.length - 1],
    }));
    this.maxUnits = Math.max(...this.topProducts.map((p) => p.units), 0);

    // Modalidad (el backend manda el codigo crudo: para_llevar, comer_aqui)
    this.modalityData = res.modalidad.map((m: ModalidadApi) => ({
      modalidad: this.nombreModalidad(m.modalidad),
      cantidad: m.cantidad,
      pct: m.pct,
    }));

    // Leyenda modalidad
    this.legend = res.modalidad.map((m: ModalidadApi, i: number) => {
      const esPico = m.pct === Math.max(...res.modalidad.map((x) => x.pct));
      return {
        label: this.nombreModalidad(m.modalidad),
        pct: `${Math.round(m.pct)}%`,
        value: String(m.cantidad),
        c: esPico ? '#E13642' : '#374151',
        bg: esPico ? 'rgba(225,54,66,0.05)' : '#E5E7EB',
      };
    });

    // Resumen de modalidad (llena el espacio vacío bajo la dona con un dato accionable)
    this.modalidadTotalPedidos = res.modalidad.reduce((sum, m) => sum + m.cantidad, 0);
    const lider = res.modalidad.length > 0
      ? res.modalidad.reduce((a, b) => (b.pct > a.pct ? b : a), res.modalidad[0])
      : null;
    this.modalidadInsight = lider
      ? `${this.nombreModalidad(lider.modalidad)} lidera con ${Math.round(lider.pct)}% de los ${this.modalidadTotalPedidos} pedidos ${this.etiquetaKpi()}.`
      : '';

    // Comparacion vs periodo anterior
    this.compVentas = this.formatComparacion(res.comparacion_periodo_anterior?.ventas_pct);
    this.compPedidos = this.formatComparacion(res.comparacion_periodo_anterior?.pedidos_pct);

    // Ventas por categoria
    this.ventasPorCategoria = res.ventas_por_categoria ?? [];
    this.maxCategoriaTotal = Math.max(...this.ventasPorCategoria.map((c) => c.total), 0);

    // Comparativos periodo actual vs anterior
    const comp = res.comparacion_periodo_anterior;
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
