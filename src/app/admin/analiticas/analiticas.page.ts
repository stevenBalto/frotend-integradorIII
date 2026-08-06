import { Component, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { AnaliticasParams, AnaliticasService } from '../../core/services/analiticas.service';
import { AnaliticasResponse, ComparacionMesAnterior, Granularidad, ModalidadApi, TopProductoApi, VentaCategoria } from '../../core/models/analiticas.model';
import { PeakHourDatum } from './peak-hours-chart.component';
import { ModalityItem } from './modality-compact.component';
import { RankingItem } from './ranking-list.component';
import { TopProductItem } from './top-products-table.component';
import { montoCorto } from '../../shared/utils/monto';

interface ComparacionTexto { texto: string; color: string; pct: number | null; }

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

  /** Monto compacto para las pastillas KPI del header. */
  readonly montoCorto = montoCorto;

  // Filtro de periodo
  granularidad: Granularidad = 'mes';
  private fechaAncla: Date = new Date();

  // Rango de fechas personalizado (granularidad='rango') — item 24.
  rangoDesde = '';
  rangoHasta = '';

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
  peakHours: PeakHourDatum[] = [];

  // Tendencia de ventas (area-chart)
  trendValues: number[] = [];
  trendLabels: string[] = [];
  /** El area-chart avisa cuándo no caben los puntos y hay scroll horizontal. */
  trendScrollable = false;

  // Productos más vendidos (tabla) y ranking de categorías (lista HTML/CSS)
  /** Filas visibles en la tabla; el backend manda 10. Ver procesarRespuesta(). */
  private readonly TOP_PRODUCTOS_VISIBLES = 6;
  topProductos: TopProductItem[] = [];
  categoriesChart: RankingItem[] = [];

  // Modalidad de pedido (versión compacta)
  modalityDataNormalized: ModalityItem[] = [];

  // Comparacion mensual
  compVentas: ComparacionTexto = { texto: '', color: '', pct: null };
  compPedidos: ComparacionTexto = { texto: '', color: '', pct: null };

  // Ventas por categoria
  ventasPorCategoria: VentaCategoria[] = [];
  maxCategoriaTotal = 0;

  // Comparativos mes actual vs anterior (charts de barras)
  comparativoVentas: PeakHourDatum[] = [];
  comparativoPedidos: PeakHourDatum[] = [];

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
    // En modo rango, no consultamos hasta tener desde y hasta válidos.
    if (this.granularidad === 'rango' && (!this.rangoDesde || !this.rangoHasta || this.rangoDesde > this.rangoHasta)) {
      return;
    }
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
    if (this.granularidad === 'mes') {
      return { granularidad: 'mes', mes: this.formatMes(this.fechaAncla) };
    }
    if (this.granularidad === 'rango') {
      return { granularidad: 'rango', desde: this.rangoDesde, hasta: this.rangoHasta };
    }
    return { granularidad: this.granularidad, fecha: this.formatFecha(this.fechaAncla) };
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
    if (g === 'rango') {
      // Defaults útiles: del primer día del mes actual a hoy.
      const hoy = new Date();
      if (!this.rangoDesde) {
        this.rangoDesde = this.formatFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
      }
      if (!this.rangoHasta) {
        this.rangoHasta = this.formatFecha(hoy);
      }
    }
    this.cargarAnaliticas();
  }

  /** Aplica el rango de fechas elegido (si es válido) y recarga. */
  aplicarRango(): void {
    if (this.rangoDesde && this.rangoHasta && this.rangoDesde <= this.rangoHasta) {
      this.cargarAnaliticas();
    }
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
    if (this.granularidad === 'rango') {
      if (!this.rangoDesde || !this.rangoHasta) {
        return 'Elegí un rango';
      }
      return `Del ${this.formatFechaCorta(this.rangoDesde)} al ${this.formatFechaCorta(this.rangoHasta)}`;
    }
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
    if (this.granularidad === 'rango') {
      return 'del período';
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
    if (this.granularidad === 'rango') {
      return 'período anterior';
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

  /**
   * Filtra ventas_por_dia para quedarse solo con los 7 dias de la semana que
   * contiene a fechaAncla (lunes a domingo). Fix defensivo: el backend deberia
   * devolver exactamente estos 7 dias cuando granularidad=semana, pero si
   * devuelve el mes completo, este filtro evita que el grafico active scroll.
   */
  private filtrarSemana(ventas: { fecha: string; total: number }[]): { fecha: string; total: number }[] {
    const lunes = this.inicioSemana(this.fechaAncla);
    const domingo = new Date(lunes);
    domingo.setDate(domingo.getDate() + 6);

    // Normalizar a YYYY-MM-DD para comparar strings
    const desde = this.formatFecha(lunes);
    const hasta = this.formatFecha(domingo);

    // Filtrar y ordenar por fecha
    const filtrados = ventas
      .filter((v) => v.fecha >= desde && v.fecha <= hasta)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Si el backend no devolvio datos para algunos dias de la semana, rellenar con 0
    const resultado: { fecha: string; total: number }[] = [];
    const cursor = new Date(lunes);
    for (let i = 0; i < 7; i++) {
      const fechaStr = this.formatFecha(cursor);
      const existente = filtrados.find((v) => v.fecha === fechaStr);
      resultado.push({ fecha: fechaStr, total: existente?.total ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    return resultado;
  }

  /** "2026-07-25" → "25 jul" (para la etiqueta del rango). */
  private formatFechaCorta(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
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

    // Tendencia de ventas (area-chart): valores y etiquetas separados.
    // En modo semana, filtrar solo los 7 dias de la semana seleccionada (fix defensivo
    // mientras el backend corrige el filtro de granularidad=semana).
    const ventasFiltradas = this.granularidad === 'semana'
      ? this.filtrarSemana(res.ventas_por_dia)
      : res.ventas_por_dia;
    this.trendValues = ventasFiltradas.map((v) => v.total);
    this.trendLabels = ventasFiltradas.map((v) => this.formatFechaDia(v.fecha));

    // Horas pico
    this.peakHours = res.horas_pico.map((h) => ({
      label: this.formatHoraCorta(h.hora),
      value: h.cantidad,
    }));

    // Top productos (tabla Producto / Cantidad / Ingresos).
    // Se recorta a TOP_PRODUCTOS_VISIBLES para que la card iguale el alto de la
    // columna izquierda (categorías + modalidad) y no quede un hueco blanco.
    // Las exportaciones a Excel/PDF siguen incluyendo el top completo del backend.
    this.topProductos = res.top_productos.slice(0, this.TOP_PRODUCTOS_VISIBLES).map((p: TopProductoApi) => ({
      nombre: p.nombre,
      unidades: p.unidades,
      ingresos: p.ingresos ?? null,
      imagenUrl: p.imagen_url ?? null,
    }));

    // Modalidad de pedido — normalizar para garantizar que ambas modalidades existan
    this.modalityDataNormalized = this.normalizarModalidades(res.modalidad);

    // Comparacion vs periodo anterior
    this.compVentas = this.formatComparacion(res.comparacion_periodo_anterior?.ventas_pct);
    this.compPedidos = this.formatComparacion(res.comparacion_periodo_anterior?.pedidos_pct);

    // Ventas por categoria
    this.ventasPorCategoria = res.ventas_por_categoria ?? [];
    this.maxCategoriaTotal = Math.max(...this.ventasPorCategoria.map((c) => c.total), 0);
    this.categoriesChart = this.ventasPorCategoria.map((c) => ({
      label: c.categoria,
      value: c.total,
    }));

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
      return { texto: 'Sin datos previos', color: '#6B7280', pct: null };
    }
    if (pct > 0) {
      return { texto: `↑ ${Math.abs(pct).toFixed(1)}% vs anterior`, color: '#16A34A', pct };
    }
    if (pct < 0) {
      return { texto: `↓ ${Math.abs(pct).toFixed(1)}% vs anterior`, color: '#DC2626', pct };
    }
    return { texto: '0% vs anterior', color: '#6B7280', pct: 0 };
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

  /**
   * Normaliza las modalidades para garantizar que ambas ("Comer aquí", "Para llevar")
   * siempre estén presentes, rellenando con 0 la que falte.
   */
  private normalizarModalidades(modalidades: ModalidadApi[]): ModalityItem[] {
    const MODALIDADES_FIJAS = ['Comer aquí', 'Para llevar'];
    const result: ModalityItem[] = [];

    for (const nombre of MODALIDADES_FIJAS) {
      // Buscar en el backend por código crudo o nombre ya transformado
      const existing = modalidades.find((m) => this.nombreModalidad(m.modalidad) === nombre);
      if (existing) {
        result.push({
          modalidad: nombre,
          cantidad: existing.cantidad,
          pct: existing.pct,
        });
      } else {
        result.push({ modalidad: nombre, cantidad: 0, pct: 0 });
      }
    }

    return result;
  }
}
