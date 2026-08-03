import { Component, OnInit } from '@angular/core';
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
export class HomePage implements OnInit {
  readonly usuario$: Observable<Usuario | null>;

  destacados: Producto[] = [];
  populares: Producto[] = [];
  nuevos: Producto[] = [];
  ofertas: Oferta[] = [];
  cupones: Cupon[] = [];

  cargando = false;
  error: string | null = null;

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

  // Selecciones del modal de detalle
  tamanoSeleccionado: ProductoTamano | null = null;
  extrasSeleccionados: ExtraDisponible[] = [];
  cantidadDetalle = 1;

  // Reseñas del producto abierto en el detalle
  opinionesProducto: ResenaPublica[] = [];
  resumenProducto: ResumenProducto | null = null;

  constructor(
    private auth: AuthService,
    private productoService: ProductoService,
    private ofertaService: OfertaService,
    private cuponService: CuponService,
    private carritoService: CarritoService,
    private resenaService: ResenaService,
    private pedidoService: PedidoService,
    private toast: ToastController,
  ) {
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
  }

  cerrarBuscarPedido(): void {
    this.buscarModalAbierto = false;
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
