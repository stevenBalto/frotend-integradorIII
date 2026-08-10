import { Component, ElementRef, HostListener, NgZone, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Gesture, GestureController } from '@ionic/angular';
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
import { ConfirmService } from '../../core/services/confirm.service';

type FiltroEstado = 'todos' | PedidoEstado;

/** Gestion de pedidos: stats, tabla y modal de detalle (conectado a API real). */
@Component({
  selector: 'app-admin-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: false,
})
export class AdminPedidosPage implements OnInit, OnDestroy {
  private pedidoService = inject(PedidoService);
  private route = inject(ActivatedRoute);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private gestureCtrl = inject(GestureController);
  private confirm = inject(ConfirmService);

  private destroy$ = new Subject<void>();
  private pausarPolling = false;

  // Lista de pedidos
  pedidos: PedidoAdmin[] = [];
  cargando = false;
  error: string | null = null;

  // Filtros
  filtroEstado: FiltroEstado = 'todos';
  busqueda = '';

  // Filtro por fecha (a la par de "Pedidos recientes"): todos / hoy / semana / una fecha puntual.
  filtroFecha: 'todos' | 'hoy' | 'semana' | 'fecha' = 'todos';
  fechaEspecifica = '';

  // Modal detalle
  modalOpen = false;
  pedidoSeleccionado: PedidoAdmin | null = null;

  // Modal "pantalla completa": lista todos los pedidos del filtro actual en grande
  // (util cuando entran muchos pendientes y hay que verlos de un vistazo).
  pantallaCompletaOpen = false;

  // Gesto de cierre de la pantalla completa (deslizar de izquierda a derecha).
  private gestoCierre?: Gesture;

  // Modal de ayuda: explica los colores de cliente registrado vs invitado (item 29).
  ayudaColoresOpen = false;

  cambiandoEstado = false;
  registrandoPago = false;
  accionError: string | null = null;

  // Estado que se esta revirtiendo ahora mismo (micro-feedback no bloqueante).
  revirtiendoEstado: PedidoEstado | null = null;

  // Resaltado de un pedido puntual (al venir desde Dashboard "pedidos nuevos" o una
  // notificación con ?codigo=). La fila anima con .ped-row--destacado unos segundos.
  destacadoCodigo: string | null = null;
  private destacarTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    // Si venimos con ?codigo= (Dashboard "pedidos nuevos" o una notificación),
    // resaltamos ESE pedido (scroll + animación). Suscripción (no snapshot) para que
    // también funcione con la página cacheada por IonicRouteStrategy (EF-13).
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((pm) => {
      const codigo = pm.get('codigo');
      if (codigo) {
        this.destacarPedido(codigo);
      }
    });
    this.cargarPedidos();
    this.iniciarPolling();
  }

  /**
   * Resalta y hace scroll al pedido `codigo`. La fila anima con `.ped-row--destacado`
   * y se limpia sola a los ~3s. Reintenta el scroll hasta que la fila exista (la lista
   * puede estar cargando todavía).
   */
  private destacarPedido(codigo: string): void {
    this.destacadoCodigo = codigo;
    this.scrollADestacado(codigo, 24);
    clearTimeout(this.destacarTimer);
    this.destacarTimer = setTimeout(() => (this.destacadoCodigo = null), 3000);
  }

  private scrollADestacado(codigo: string, intentos: number): void {
    const el = document.getElementById('ped-' + codigo);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (intentos > 0) {
      setTimeout(() => this.scrollADestacado(codigo, intentos - 1), 150);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.destacarTimer);
    this.destroy$.next();
    this.destroy$.complete();
    // Limpieza defensiva del modo inmersivo (EF-13: IonicRouteStrategy cachea la
    // pagina; no dejamos clase, listener ni gesto colgando).
    document.body.classList.remove('admin-inmersivo');
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    this.gestoCierre?.destroy();
    this.gestoCierre = undefined;
  }

  /**
   * Al salir de la pagina cerramos el modo inmersivo aunque Ionic cachee la pagina
   * (ngOnDestroy no siempre corre — EF-13). Asi el sidebar-hide (body.admin-inmersivo)
   * nunca se filtra a otra seccion del panel si se navega con la vista abierta.
   */
  ionViewWillLeave(): void {
    this.cerrarPantallaCompleta();
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

  /** Etiqueta legible del filtro de estado actual (para el titulo de la pantalla completa). */
  get filtroEstadoLabel(): string {
    return this.filtroEstado === 'todos' ? 'Todos los pedidos' : this.getEstadoLabel(this.filtroEstado);
  }

  // ── Pantalla completa (todos los pedidos del filtro) ──
  // Modo inmersivo: oculta el sidebar del admin (clase en body -> regla global) y
  // entra en fullscreen del navegador. Se cierra con Esc, deslizando de izquierda a
  // derecha, o si el usuario sale del fullscreen del navegador.

  abrirPantallaCompleta(): void {
    if (this.pantallaCompletaOpen) {
      return;
    }
    this.pantallaCompletaOpen = true;
    // Oculta el sidebar del shell admin (solo PC; en movil ya es off-canvas).
    document.body.classList.add('admin-inmersivo');
    // Sincroniza el estado si el usuario sale del fullscreen del navegador (Esc/F11).
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    // Fullscreen del navegador (best-effort: el gesto del click lo permite; si el
    // navegador lo bloquea, no rompe nada).
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen && !document.fullscreenElement) {
        void docEl.requestFullscreen().catch(() => { /* bloqueado: seguimos igual */ });
      }
    } catch { /* noop */ }
    // El overlay .ped-fs se renderiza en el proximo ciclo: montamos el gesto luego.
    setTimeout(() => this.setupSwipeCierre(), 0);
  }

  cerrarPantallaCompleta(): void {
    if (!this.pantallaCompletaOpen) {
      return;
    }
    this.pantallaCompletaOpen = false;
    document.body.classList.remove('admin-inmersivo');
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    this.gestoCierre?.destroy();
    this.gestoCierre = undefined;
    // Salir del fullscreen del navegador si seguimos dentro.
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => { /* noop */ });
    }
  }

  /** Esc cierra la pantalla completa (PC/tablet). */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.pantallaCompletaOpen) {
      this.cerrarPantallaCompleta();
    }
  }

  /**
   * Si el usuario sale del fullscreen del navegador (Esc/F11) con el modo aun
   * abierto, cerramos tambien la expansion para no quedar desincronizados.
   * Arrow-property: referencia estable para add/removeEventListener.
   */
  private onFullscreenChange = (): void => {
    if (!document.fullscreenElement && this.pantallaCompletaOpen) {
      this.zone.run(() => this.cerrarPantallaCompleta());
    }
  };

  /** Monta el gesto "deslizar de izquierda a derecha" sobre el overlay para cerrarlo. */
  private setupSwipeCierre(): void {
    const el = this.host.nativeElement.querySelector('.ped-fs') as HTMLElement | null;
    if (!el) {
      return;
    }
    this.gestoCierre?.destroy();
    this.gestoCierre = this.gestureCtrl.create({
      el,
      gestureName: 'ped-fs-swipe-close',
      direction: 'x',
      threshold: 15,
      onEnd: (ev) => {
        // Deslizar hacia la derecha (deltaX positivo) supera el umbral -> cerrar.
        if (ev.deltaX > 80 && Math.abs(ev.deltaY) < 60) {
          this.zone.run(() => this.cerrarPantallaCompleta());
        }
      },
    });
    this.gestoCierre.enable(true);
  }

  abrirAyudaColores(): void {
    this.ayudaColoresOpen = true;
  }

  cerrarAyudaColores(): void {
    this.ayudaColoresOpen = false;
  }

  // ── Filtro por fecha ──

  setFiltroFecha(f: 'todos' | 'hoy' | 'semana' | 'fecha'): void {
    this.filtroFecha = f;
    if (f !== 'fecha') {
      this.fechaEspecifica = '';
    }
  }

  /** Al elegir una fecha en el calendario, activa el filtro "fecha". */
  onFechaEspecifica(): void {
    this.filtroFecha = this.fechaEspecifica ? 'fecha' : 'todos';
  }

  private mismaFecha(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private enFiltroFecha(p: PedidoAdmin): boolean {
    if (this.filtroFecha === 'todos') {
      return true;
    }
    const d = new Date(p.created_at);
    const hoy = new Date();
    if (this.filtroFecha === 'hoy') {
      return this.mismaFecha(d, hoy);
    }
    if (this.filtroFecha === 'semana') {
      const inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - 6);
      inicio.setHours(0, 0, 0, 0);
      return d >= inicio;
    }
    // 'fecha': un dia puntual elegido en el calendario.
    if (!this.fechaEspecifica) {
      return true;
    }
    const sel = new Date(this.fechaEspecifica + 'T00:00:00');
    return this.mismaFecha(d, sel);
  }

  // ── Lista filtrada ──

  get pedidosFiltrados(): PedidoAdmin[] {
    let resultado = this.pedidos;

    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      resultado = resultado.filter((p) => p.estado === this.filtroEstado);
    }

    // Filtrar por fecha (todos / hoy / semana / fecha puntual)
    if (this.filtroFecha !== 'todos') {
      resultado = resultado.filter((p) => this.enFiltroFecha(p));
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

    // Orden: los pedidos NO cerrados (abiertos) van primero y, dentro de ellos, los más
    // antiguos arriba (el que lleva más tiempo esperando encabeza). Los cerrados después.
    return [...resultado].sort((a, b) => {
      const ca = this.esCerrado(a.estado) ? 1 : 0;
      const cb = this.esCerrado(b.estado) ? 1 : 0;
      if (ca !== cb) {
        return ca - cb;
      }
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      // Abiertos: antiguo → nuevo. Cerrados: nuevo → antiguo (historial reciente arriba).
      return ca === 0 ? ta - tb : tb - ta;
    });
  }

  /** "Cerrado" = estado terminal (entregado o cancelado). Los demás siguen abiertos. */
  private esCerrado(estado: PedidoEstado): boolean {
    return estado === 'entregado' || estado === 'cancelado';
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

  async registrarPago(): Promise<void> {
    if (!this.pedidoSeleccionado || !this.puedeRegistrarPago) {
      return;
    }

    // Dialogo propio, NO window.confirm: el nativo hace que Chrome salga del
    // fullscreen, y como el modo extendido escucha `fullscreenchange` para
    // cerrarse, confirmar un pago expulsaba al usuario de ese modo (EF: ver
    // ConfirmDialogComponent).
    const confirmado = await this.confirm.preguntar({
      titulo: '¿Confirmar pago de este pedido?',
      mensaje: `Se marcará como pagado el pedido de ${this.pedidoSeleccionado.nombre_cliente || 'este cliente'}.`,
      textoConfirmar: 'Registrar pago',
      icono: 'cash-outline',
    });
    // Se revalida despues del await: el dialogo es asincronico y el usuario pudo
    // cerrar el detalle (o cambiar de pedido) mientras estaba abierto.
    if (!confirmado || !this.pedidoSeleccionado || !this.puedeRegistrarPago) {
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
