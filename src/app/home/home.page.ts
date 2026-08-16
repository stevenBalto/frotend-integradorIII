import { Component, OnInit, OnDestroy, AfterViewInit, inject, NgZone, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';
import { ProductoService } from '../core/services/producto.service';
import { ResenaService } from '../core/services/resena.service';
import { ResenaPublica, ResumenProducto } from '../core/models/resena.model';
import { OfertaService } from '../core/services/oferta.service';
import { CuponService } from '../core/services/cupon.service';
import { CarritoService, LineaCarrito } from '../core/services/carrito.service';
import { PedidoService } from '../core/services/pedido.service';
import { Usuario } from '../core/models/usuario.model';
import { Producto, ProductoTamano, ExtraDisponible } from '../core/models/producto.model';
import { Pedido, PedidoPublico } from '../core/models/pedido.model';
import { PedidoEstado, PEDIDO_ESTADO_LABEL } from '../shared/constants/pedido-estado';
import { MODALIDAD_LABEL } from '../shared/constants/modalidad';
import { Oferta } from '../core/models/oferta.model';
import { Cupon } from '../core/models/cupon.model';

/** Home cliente: vitrina (destacados/populares/nuevo + ofertas + cupones vigentes). El menu completo vive en la tab "Carrito". */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy, AfterViewInit {
  private auth = inject(AuthService);
  private productoService = inject(ProductoService);
  private ofertaService = inject(OfertaService);
  private cuponService = inject(CuponService);
  private carritoService = inject(CarritoService);
  private resenaService = inject(ResenaService);
  private pedidoService = inject(PedidoService);
  private toast = inject(ToastController);
  private zone = inject(NgZone);
  private router = inject(Router);

  readonly usuario$: Observable<Usuario | null>;

  destacados: Producto[] = [];
  populares: Producto[] = [];
  nuevos: Producto[] = [];
  ofertas: Oferta[] = [];
  cupones: Cupon[] = [];

  cargando = false;
  error: string | null = null;

  /** Carrusel continuo de Destacados / Populares / Nuevos. En vez de animar por
      CSS (que bloquea el scroll manual), se usa SCROLL NATIVO manejado por JS:
      un loop rAF avanza `scrollLeft` a velocidad constante y va envolviendo en la
      mitad (la lista se renderiza DUPLICADA -> bucle sin costura). Asi el usuario
      puede arrastrar/scrollear a mano cuando quiera; al soltar (idle ~1.2s) el
      auto continua. Se activa SOLO si las tarjetas desbordan (si no, estatico, no
      se daña el diseño) y se respeta prefers-reduced-motion. Direccion:
      Destacados +derecha (dir -1), Populares +izquierda (dir +1), Nuevos +derecha. */
  destacadosMarquee = false;
  popularesMarquee = false;
  nuevosMarquee = false;
  get destacadosLoop(): Producto[] { return [...this.destacados, ...this.destacados]; }
  get popularesLoop(): Producto[] { return [...this.populares, ...this.populares]; }
  get nuevosLoop(): Producto[] { return [...this.nuevos, ...this.nuevos]; }

  private readonly MARQUEE_SPEED = 18; // px/s: igual para los 3 carruseles, lento para que no maree pero fluido (rAF)
  private marqueeObservers: ResizeObserver[] = [];
  private marqueeCleanups: (() => void)[] = [];
  private marqueeObserved = new WeakSet<HTMLElement>();

  @ViewChildren('dishGridEl') private dishGrids?: QueryList<ElementRef<HTMLElement>>;

  ngAfterViewInit(): void {
    this.wireDishGrids();
    this.dishGrids?.changes.subscribe(() => this.wireDishGrids());
  }

  /** Conecta cada .dish-grid (identificado por data-mq) con su motor de carrusel. */
  private wireDishGrids(): void {
    this.dishGrids?.forEach((ref) => {
      const el = ref.nativeElement;
      const k = el.dataset['mq'];
      // dir con transform: +1 = derecha, -1 = izquierda.
      if (k === 'destacados') this.setupMarquee(el, +1, () => this.destacadosMarquee, (b) => (this.destacadosMarquee = b));
      else if (k === 'populares') this.setupMarquee(el, -1, () => this.popularesMarquee, (b) => (this.popularesMarquee = b));
      else if (k === 'nuevos') this.setupMarquee(el, +1, () => this.nuevosMarquee, (b) => (this.nuevosMarquee = b));
    });
  }

  /** Motor de carrusel de una seccion: detecta overflow (ResizeObserver), avanza
      scrollLeft por rAF, pausa mientras el usuario interactua y reanuda al soltar. */
  private setupMarquee(host: HTMLElement, dir: number, getMq: () => boolean, setMq: (b: boolean) => void): void {
    if (this.marqueeObserved.has(host)) return;
    this.marqueeObserved.add(host);
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const track = host.querySelector('.dish-track') as HTMLElement | null;

    let pausado = false;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;
    let offset = 0;   // px de translateX del track; rango (-period, 0]
    let period = 0;   // ancho de UN set (con su gap): el bucle envuelve aqui
    const reanudar = () => { if (idle) clearTimeout(idle); idle = setTimeout(() => { pausado = false; }, 1000); };

    // Pausa al pasar el mouse (desktop) o con la rueda.
    const onEnter = () => { pausado = true; };
    const onLeave = () => { pausado = false; };
    host.addEventListener('mouseenter', onEnter);
    host.addEventListener('mouseleave', onLeave);
    host.addEventListener('wheel', () => { pausado = true; reanudar(); }, { passive: true });

    // Movemos el track con transform (sub-pixel, GPU) -> fluido, sin los saltos de
    // 1px que da scrollLeft (que solo acepta enteros). El bucle envuelve en `period`.
    const wrap = (o: number): number => {
      if (period <= 0) return 0;
      let m = o % period;
      if (m > 0) m -= period;   // mantiene el rango (-period, 0]
      return m;
    };
    const apply = () => { if (track) track.style.transform = `translate3d(${offset}px,0,0)`; };

    // Ancho de un set = offsetLeft del 1er item de la 2a copia (exacto, con su gap).
    const medirPeriodo = (): number => {
      if (!track) return 0;
      const kids = track.children;
      const n = Math.floor(kids.length / 2);
      const el = kids[n] as HTMLElement | undefined;
      return el ? el.offsetLeft : track.scrollWidth / 2;
    };

    // Arrastre manual con puntero (en modo carrusel ya no hay scroll nativo):
    // sigue el dedo y, al soltar, el carrusel continua desde donde quedo.
    let dragging = false;
    let startX = 0;
    let startOffset = 0;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      if (!getMq()) return;
      dragging = true; pausado = true; moved = false;
      startX = e.clientX; startOffset = offset;
      host.setPointerCapture?.(e.pointerId);
    };
    const onMoveP = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      offset = wrap(startOffset + dx);
      apply();
    };
    const onUpP = () => {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        // Evita que el arrastre dispare el (click) de la tarjeta.
        const block = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); host.removeEventListener('click', block, true); };
        host.addEventListener('click', block, true);
        setTimeout(() => host.removeEventListener('click', block, true), 80);
      }
      reanudar();
    };
    host.addEventListener('pointerdown', onDown);
    host.addEventListener('pointermove', onMoveP);
    host.addEventListener('pointerup', onUpP);
    host.addEventListener('pointercancel', onUpP);

    const evaluar = () => {
      const unSet = getMq() ? medirPeriodo() : host.scrollWidth;   // un set overflowea?
      const overflow = !reducido && unSet > host.clientWidth + 4;
      period = getMq() ? unSet : 0;
      this.zone.run(() => setMq(overflow));
    };

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (getMq() && track) {
        if (period <= 0) period = medirPeriodo();   // re-mide tras cargar imgs
        if (!pausado && !dragging && period > 0) {
          offset = wrap(offset + this.MARQUEE_SPEED * dt * dir);
          apply();
        }
      }
      raf = requestAnimationFrame(loop);
    };

    this.zone.runOutsideAngular(() => {
      const ro = new ResizeObserver(() => { period = 0; evaluar(); });
      ro.observe(host);
      if (track) ro.observe(track);
      this.marqueeObservers.push(ro);
      setTimeout(evaluar, 80);
      raf = requestAnimationFrame(loop);
    });

    this.marqueeCleanups.push(() => {
      cancelAnimationFrame(raf);
      if (idle) clearTimeout(idle);
      host.removeEventListener('mouseenter', onEnter);
      host.removeEventListener('mouseleave', onLeave);
      host.removeEventListener('pointerdown', onDown);
      host.removeEventListener('pointermove', onMoveP);
      host.removeEventListener('pointerup', onUpP);
      host.removeEventListener('pointercancel', onUpP);
    });
  }

  ngOnDestroy(): void {
    this.marqueeObservers.forEach((ro) => ro.disconnect());
    this.marqueeCleanups.forEach((fn) => fn());
    this.marqueeObservers = [];
    this.marqueeCleanups = [];
  }

  /** DEMO temporal: foto de relleno cuando el producto no tiene imagen_url real
      (ver assets/productos-demo/). Mismo id -> misma foto siempre. Quitar
      cuando el catalogo real tenga fotos cargadas. */
  private readonly TOTAL_DEMO_IMAGENES = 18;
  demoImagen(id: number): string {
    const n = ((id - 1) % this.TOTAL_DEMO_IMAGENES + this.TOTAL_DEMO_IMAGENES) % this.TOTAL_DEMO_IMAGENES + 1;
    return `assets/productos-demo/producto-${n}.jpg`;
  }

  detalleAbierto = false;
  productoDetalle: Producto | null = null;

  /** Modal de código QR (oferta o cupón), igual que en la pantalla "Ofertas y cupones". */
  qrAbierto = false;
  qrValor = '';
  qrCodigoTexto = '';
  qrTitulo = '';
  qrSubtitulo = '';

  /** Modal "Buscar mi pedido" (igual que en Carrito). Logueado -> detalle completo;
      invitado -> endpoint publico (estado/sucursal/fecha). */
  buscarModalAbierto = false;
  codigoBusqueda = '';
  buscandoPedido = false;
  buscarError: string | null = null;
  pedidoBuscado: Pedido | null = null;
  pedidoBuscadoPublico: PedidoPublico | null = null;
  readonly MODALIDAD_LABEL = MODALIDAD_LABEL;

  private readonly colores = ['#E13642', '#F58220', '#A8895E', '#F2B134'];

  /** Rail de categorias de marca (decorativo, enlaza al menu). Iconos reales
      de assets/sistema/*-rojo.svg — no depende de datos del backend. */
  readonly categoriasDestacadas: { label: string; icon: string; tab: 'pedir' | 'ofertas'; cat?: string; panel?: 'ofertas' | 'cupones' }[] = [
    { label: 'Pizza', icon: 'assets/sistema/pizza-rojo.svg', tab: 'pedir', cat: 'Pizza' },
    { label: 'Parrilla', icon: 'assets/sistema/grill-rojo.svg', tab: 'pedir', cat: 'Grill' },
    { label: 'Pastas', icon: 'assets/sistema/pastas-rojo.svg', tab: 'pedir', cat: 'Pastas' },
    { label: 'Bebidas', icon: 'assets/sistema/bebidas-rojo.svg', tab: 'pedir', cat: 'Bebidas' },
    { label: 'Ofertas', icon: 'assets/sistema/etiqueta-rojo.svg', tab: 'ofertas', panel: 'ofertas' },
    { label: 'Cupones', icon: 'assets/sistema/ticket-rojo.svg', tab: 'ofertas', panel: 'cupones' },
  ];

  /** Al tocar una categoria: el badge se encoge un instante, crece y "sale" del
      div, y cae animado hasta el boton del tab bar al que pertenece; al terminar
      navega a esa seccion y le hace focus (categoria en Carrito, o panel en
      Ofertas). Respeta prefers-reduced-motion (navega directo, sin animacion). */
  irACategoria(c: { tab: 'pedir' | 'ofertas'; cat?: string; panel?: 'ofertas' | 'cupones' }, ev: Event): void {
    ev.preventDefault();
    const item = ev.currentTarget as HTMLElement | null;
    const badge = item?.querySelector('.cat-rail__badge-wrap') as HTMLElement | null;
    const tabBtn = document.querySelector(`ion-tab-button[tab="${c.tab}"]`) as HTMLElement | null;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!badge || !tabBtn || reducido) { this.navegarCategoria(c); return; }

    const b = badge.getBoundingClientRect();
    const t = tabBtn.getBoundingClientRect();
    const clone = badge.cloneNode(true) as HTMLElement;
    Object.assign(clone.style, {
      position: 'fixed', left: `${b.left}px`, top: `${b.top}px`,
      width: `${b.width}px`, height: `${b.height}px`, margin: '0',
      zIndex: '99999', pointerEvents: 'none', borderRadius: '50%',
    });
    document.body.appendChild(clone);

    const dx = (t.left + t.width / 2) - (b.left + b.width / 2);
    const dy = (t.top + t.height / 2) - (b.top + b.height / 2);
    const anim = clone.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0 },
      { transform: 'translate(0,0) scale(0.72)', opacity: 1, offset: 0.15 },     // instante pequeno
      { transform: 'translate(0,0) scale(1.75)', opacity: 1, offset: 0.42 },     // grande, sale del div
      { transform: `translate(${dx * 0.45}px, ${dy * 0.28}px) scale(1.5)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.32)`, opacity: 0.85, offset: 1 }, // cae al tab bar
    ], { duration: 950, easing: 'cubic-bezier(.5,.05,.4,1)', fill: 'forwards' });

    anim.onfinish = () => { clone.remove(); this.navegarCategoria(c); };
    anim.oncancel = () => { clone.remove(); };
  }

  private navegarCategoria(c: { tab: 'pedir' | 'ofertas'; cat?: string; panel?: 'ofertas' | 'cupones' }): void {
    if (c.tab === 'ofertas') {
      void this.router.navigate(['/tabs/ofertas'], { queryParams: { panel: c.panel } });
    } else {
      void this.router.navigate(['/tabs/pedir'], { queryParams: { cat: c.cat } });
    }
  }

  // Selecciones del modal de detalle
  tamanoSeleccionado: ProductoTamano | null = null;
  extrasSeleccionados: ExtraDisponible[] = [];
  cantidadDetalle = 1;

  // Reseñas del producto abierto en el detalle
  opinionesProducto: ResenaPublica[] = [];
  resumenProducto: ResumenProducto | null = null;

  constructor() {
    this.usuario$ = this.auth.usuarioActual$;
  }

  ngOnInit(): void {
    this.cargarVitrina();
  }

  /** Ionic cachea las paginas de los tabs, asi que ngOnInit corre una sola vez
      por sesion: sin esto, una oferta/cupon que el admin extiende o vence no se
      reflejaba hasta un F5. Se dispara tambien en la primera entrada, por eso
      cargarPromos() NO va ademas en ngOnInit (serian dos requests). */
  ionViewWillEnter(): void {
    this.cargarPromos();
  }

  // ── Buscar mi pedido (modal in-place) ──

  get esInvitado(): boolean {
    return !this.auth.estaAutenticado;
  }

  get nombreClientePlaceholder(): string {
    return this.auth.usuario?.nombre ?? 'Vos';
  }

  abrirBuscarPedido(): void {
    this.buscarModalAbierto = true;
    this.codigoBusqueda = '';
    this.buscarError = null;
    this.pedidoBuscado = null;
    this.pedidoBuscadoPublico = null;
    document.body.classList.add('buscar-modal-open');
  }

  cerrarBuscarPedido(): void {
    this.buscarModalAbierto = false;
    document.body.classList.remove('buscar-modal-open');
  }

  /** Pega el codigo desde el portapapeles al input (un toque, sin escribir). */
  async pegarCodigo(): Promise<void> {
    try {
      const texto = (await navigator.clipboard.readText()).trim();
      if (!texto) {
        const t = await this.toast.create({ message: 'El portapapeles está vacío', duration: 1500, position: 'bottom', color: 'medium' });
        await t.present();
        return;
      }
      this.codigoBusqueda = texto;
    } catch {
      const t = await this.toast.create({ message: 'No pudimos leer el portapapeles', duration: 1800, position: 'bottom', color: 'medium' });
      await t.present();
    }
  }

  buscarMiPedido(): void {
    const codigo = this.codigoBusqueda.trim();
    if (!codigo) {
      return;
    }

    this.buscandoPedido = true;
    this.buscarError = null;
    this.pedidoBuscado = null;
    this.pedidoBuscadoPublico = null;

    if (this.esInvitado) {
      this.pedidoService.buscarPorCodigo(codigo).subscribe({
        next: (pedido) => {
          this.pedidoBuscadoPublico = pedido;
          this.buscandoPedido = false;
        },
        error: (err) => {
          this.buscarError = err?.error?.message || 'No encontramos un pedido con ese código.';
          this.buscandoPedido = false;
        },
      });
      return;
    }

    this.pedidoService.buscarPropioPorCodigo(codigo).subscribe({
      next: (pedido) => {
        this.pedidoBuscado = pedido;
        this.buscandoPedido = false;
      },
      error: (err) => {
        this.buscarError = err?.error?.message || 'No encontramos un pedido con ese código a tu nombre.';
        this.buscandoPedido = false;
      },
    });
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

  formatFecha(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  async copiarCodigo(codigo: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(codigo);
      const t = await this.toast.create({ message: 'Código copiado', duration: 1500, position: 'bottom', color: 'success' });
      await t.present();
    } catch {
      // Clipboard no disponible (http sin TLS): no interrumpe el flujo.
    }
  }

  abrirDetalle(producto: Producto): void {
    this.productoDetalle = producto;
    // Resetear selecciones. Si el producto tiene tamanos, se preselecciona el
    // primero (ya viene ordenado por "orden" desde el backend) para que el
    // boton de agregar arranque habilitado en vez de mostrarse bloqueado.
    this.tamanoSeleccionado = producto.tamanos && producto.tamanos.length > 0 ? producto.tamanos[0] : null;
    this.extrasSeleccionados = [];
    this.cantidadDetalle = 1;
    this.detalleAbierto = true;

    // Cargar reseñas del producto
    this.opinionesProducto = [];
    this.resumenProducto = null;
    this.resenaService.productoResenas(producto.id).subscribe({
      next: (r) => {
        this.resumenProducto = r.resumen;
        this.opinionesProducto = r.opiniones;
      },
      error: () => { /* sin reseñas o error: no molestamos */ },
    });
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.productoDetalle = null;
  }

  /** Selecciona un tamano (radio button). */
  seleccionarTamano(tamano: ProductoTamano): void {
    this.tamanoSeleccionado = tamano;
  }

  /** Alterna un extra (checkbox). */
  toggleExtra(extra: ExtraDisponible): void {
    const index = this.extrasSeleccionados.findIndex((e) => e.id === extra.id);
    if (index >= 0) {
      this.extrasSeleccionados = this.extrasSeleccionados.filter((e) => e.id !== extra.id);
    } else {
      this.extrasSeleccionados = [...this.extrasSeleccionados, extra];
    }
  }

  /** Verifica si un extra esta seleccionado. */
  extraSeleccionado(extra: ExtraDisponible): boolean {
    return this.extrasSeleccionados.some((e) => e.id === extra.id);
  }

  /** Calcula el precio del producto con tamano y extras seleccionados. */
  get precioCalculado(): number {
    if (!this.productoDetalle) {
      return 0;
    }
    const precioBase = this.tamanoSeleccionado?.precio ?? this.productoDetalle.precio_base;
    const precioExtras = this.extrasSeleccionados.reduce((acc, e) => acc + e.precio, 0);
    return (precioBase + precioExtras) * this.cantidadDetalle;
  }

  /** Verifica si se puede agregar al carrito (tamano requerido si hay tamanos). */
  get puedeAgregar(): boolean {
    if (!this.productoDetalle) {
      return false;
    }
    // Si el producto tiene tamanos, debe seleccionarse uno
    if (this.productoDetalle.tamanos && this.productoDetalle.tamanos.length > 0) {
      return this.tamanoSeleccionado !== null;
    }
    return true;
  }

  async agregarAlCarrito(): Promise<void> {
    if (!this.productoDetalle || !this.puedeAgregar) {
      return;
    }

    // El nombre se captura ANTES de cerrar: cerrarDetalle() pone productoDetalle
    // en null, y el toast (mas abajo) lo leia despues -> "Cannot read 'nombre'".
    const nombre = this.productoDetalle.nombre;

    const linea: LineaCarrito = {
      producto: this.productoDetalle,
      tamano: this.tamanoSeleccionado,
      extras: this.extrasSeleccionados,
      cantidad: this.cantidadDetalle,
    };

    this.carritoService.agregar(linea);
    this.cerrarDetalle();

    const t = await this.toast.create({
      message: `${nombre} agregado al carrito`,
      duration: 2000,
      position: 'bottom',
      color: 'success',
    });
    await t.present();
  }

  /** Texto del descuento de una oferta, ej. "20% OFF" o "-₡500". */
  descuentoOferta(o: Oferta): string {
    return o.tipo_descuento === 'porcentaje' ? `${o.valor}% OFF` : `-₡${o.valor}`;
  }

  /** Texto del descuento de un cupon, ej. "15% OFF" o "-₡1000". */
  descuentoCupon(c: Cupon): string {
    return c.tipo === 'porcentaje' ? `${c.valor}% OFF` : `-₡${c.valor}`;
  }

  /** Color rotativo (mismo set que la pantalla "Ofertas") para el icono/badge de cada tarjeta. */
  colorFor(index: number): string {
    return this.colores[index % this.colores.length];
  }

  /** Icono representativo de una oferta segun su nombre (mismo criterio que la pantalla "Ofertas"). */
  iconOferta(o: Oferta): string {
    const nombre = o.nombre.toLowerCase();

    if (nombre.includes('pizza')) return 'pizza-outline';
    if (nombre.includes('grill') || nombre.includes('costilla') || nombre.includes('carne')) return 'restaurant-outline';
    if (nombre.includes('pasta')) return 'wine-outline';

    return o.tipo_descuento === 'porcentaje' ? 'pricetag-outline' : 'restaurant-outline';
  }

  /** Icono representativo de un cupon segun su tipo (mismo criterio que la pantalla "Ofertas"). */
  iconCupon(c: Cupon): string {
    if (c.tipo === 'porcentaje') return 'pricetag-outline';
    if ((c.monto_minimo ?? 0) > 0) return 'card-outline';
    return 'gift-outline';
  }

  /** Muestra el QR de una oferta: el staff lo escanea/tipea para validarla en el mostrador. */
  verQrOferta(o: Oferta): void {
    this.qrCodigoTexto = `OF-${o.id.toString().padStart(4, '0')}`;
    this.qrValor = this.qrCodigoTexto;
    this.qrTitulo = o.nombre;
    this.qrSubtitulo = 'Mostrá este código en el mostrador para validar la oferta.';
    this.qrAbierto = true;
  }

  /** Muestra el QR de un cupón: el staff lo escanea/tipea para canjearlo en un pedido real. */
  verQrCupon(c: Cupon): void {
    this.qrCodigoTexto = `CU-${c.id.toString().padStart(4, '0')}`;
    this.qrValor = this.qrCodigoTexto;
    this.qrTitulo = c.codigo;
    this.qrSubtitulo = 'Mostrá este código en el mostrador para canjear el cupón.';
    this.qrAbierto = true;
  }

  cerrarQr(): void {
    this.qrAbierto = false;
  }

  private cargarVitrina(): void {
    this.cargando = true;
    this.error = null;

    // Pedimos solo una página pequeña para la vitrina (mejora TTFB y reduce payload)
    this.productoService.listarDisponibles(24, 1).subscribe({
      next: (res) => {
        // Si viene paginado, la lista está en res.data, si no, el servicio ya devolvió el array
        const productos: Producto[] = Array.isArray(res) ? res : res.data ?? [];
        this.destacados = productos.filter((p) => p.destacado);
        this.populares = productos.filter((p) => p.popular);
        this.nuevos = productos.filter((p) => p.nuevo);
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el menú. Intentá de nuevo más tarde.';
        this.cargando = false;
      },
    });
  }

  /** Ofertas y cupones, aparte de la vitrina de productos: son lo unico que
      caduca por FECHA, asi que se refrescan en cada entrada al tab (ver
      ionViewWillEnter). Van separados del menu a proposito — recargar tambien
      los productos haria parpadear el skeleton cada vez que volves al Home,
      y el menu no cambia con la frecuencia que cambian las promos. */
  private cargarPromos(): void {
    this.ofertaService.listarPublicas().subscribe({
      next: (ofertas) => (this.ofertas = ofertas),
    });

    this.cuponService.listarPublicos().subscribe({
      next: (cupones) => (this.cupones = cupones),
    });
  }
}
