import { Component, OnInit, OnDestroy, AfterViewInit, inject, NgZone, ElementRef, ViewChildren, QueryList } from '@angular/core';
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

  private readonly MARQUEE_SPEED = 26; // px/s (lento, legible)
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
      if (k === 'destacados') this.setupMarquee(el, -1, () => this.destacadosMarquee, (b) => (this.destacadosMarquee = b));
      else if (k === 'populares') this.setupMarquee(el, +1, () => this.popularesMarquee, (b) => (this.popularesMarquee = b));
      else if (k === 'nuevos') this.setupMarquee(el, -1, () => this.nuevosMarquee, (b) => (this.nuevosMarquee = b));
    });
  }

  /** Motor de carrusel de una seccion: detecta overflow (ResizeObserver), avanza
      scrollLeft por rAF, pausa mientras el usuario interactua y reanuda al soltar. */
  private setupMarquee(host: HTMLElement, dir: number, getMq: () => boolean, setMq: (b: boolean) => void): void {
    if (this.marqueeObserved.has(host)) return;
    this.marqueeObserved.add(host);
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let pausado = false;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;
    const pausar = () => { pausado = true; };
    const reanudarPronto = () => { if (idle) clearTimeout(idle); idle = setTimeout(() => { pausado = false; }, 1200); };
    const onEnter = () => { pausado = true; };
    const onLeave = () => { pausado = false; };
    host.addEventListener('mouseenter', onEnter);
    host.addEventListener('mouseleave', onLeave);
    host.addEventListener('pointerdown', pausar);
    host.addEventListener('pointerup', reanudarPronto);
    host.addEventListener('touchstart', pausar, { passive: true });
    host.addEventListener('touchend', reanudarPronto, { passive: true });
    host.addEventListener('wheel', () => { pausado = true; reanudarPronto(); }, { passive: true });

    const evaluar = () => {
      const total = host.scrollWidth;
      const unSet = getMq() ? total / 2 : total;            // si ya esta duplicado, un set = la mitad
      const overflow = !reducido && unSet > host.clientWidth + 4;
      this.zone.run(() => setMq(overflow));
    };

    let last = performance.now();
    let pos = host.scrollLeft;   // acumulador FLOAT (scrollLeft se redondea; el sub-pixel se perderia)
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const half = host.scrollWidth / 2;
      if (getMq() && half > 0) {
        if (pausado) {
          pos = host.scrollLeft;            // sincroniza con el scroll manual: al soltar, sigue desde ahi
        } else {
          pos += this.MARQUEE_SPEED * dt * dir;
          // envolver en la mitad: como el contenido esta duplicado, el salto es invisible
          if (pos >= half) pos -= half;
          else if (pos < 0) pos += half;
          host.scrollLeft = pos;
        }
      }
      raf = requestAnimationFrame(loop);
    };

    this.zone.runOutsideAngular(() => {
      const ro = new ResizeObserver(() => evaluar());
      ro.observe(host);
      this.marqueeObservers.push(ro);
      setTimeout(evaluar, 80);
      raf = requestAnimationFrame(loop);
    });

    this.marqueeCleanups.push(() => {
      cancelAnimationFrame(raf);
      if (idle) clearTimeout(idle);
      host.removeEventListener('mouseenter', onEnter);
      host.removeEventListener('mouseleave', onLeave);
      host.removeEventListener('pointerdown', pausar);
      host.removeEventListener('pointerup', reanudarPronto);
      host.removeEventListener('touchstart', pausar);
      host.removeEventListener('touchend', reanudarPronto);
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
  readonly categoriasDestacadas = [
    { label: 'Pizza', icon: 'assets/sistema/pizza-rojo.svg' },
    { label: 'Parrilla', icon: 'assets/sistema/grill-rojo.svg' },
    { label: 'Pastas', icon: 'assets/sistema/pastas-rojo.svg' },
    { label: 'Bebidas', icon: 'assets/sistema/bebidas-rojo.svg' },
    { label: 'Ofertas', icon: 'assets/sistema/etiqueta-rojo.svg' },
    { label: 'Cupones', icon: 'assets/sistema/ticket-rojo.svg' },
  ];

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
    // Resetear selecciones
    this.tamanoSeleccionado = null;
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

    const linea: LineaCarrito = {
      producto: this.productoDetalle,
      tamano: this.tamanoSeleccionado,
      extras: this.extrasSeleccionados,
      cantidad: this.cantidadDetalle,
    };

    this.carritoService.agregar(linea);
    this.cerrarDetalle();

    const t = await this.toast.create({
      message: `${this.productoDetalle.nombre} agregado al carrito`,
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

    this.ofertaService.listarPublicas().subscribe({
      next: (ofertas) => (this.ofertas = ofertas),
    });

    this.cuponService.listarPublicos().subscribe({
      next: (cupones) => (this.cupones = cupones),
    });
  }
}
