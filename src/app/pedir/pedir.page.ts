import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { CarritoService, LineaCarrito } from '../core/services/carrito.service';
import { SucursalService } from '../core/services/sucursal.service';
import { PedidoService } from '../core/services/pedido.service';
import { CategoriaService } from '../core/services/categoria.service';
import { ProductoService } from '../core/services/producto.service';
import { Sucursal } from '../core/models/sucursal.model';
import { Categoria, Producto, ProductoTamano, ExtraDisponible } from '../core/models/producto.model';
import { Pedido, CrearPedidoPayload, ItemPedidoPayload } from '../core/models/pedido.model';
import { PedidoEstado, PEDIDO_ESTADO_LABEL } from '../shared/constants/pedido-estado';
import { MODALIDAD_LABEL } from '../shared/constants/modalidad';

type VistaCarrito = 'menu' | 'carrito' | 'checkout' | 'confirmacion';

@Component({
  selector: 'app-pedir',
  templateUrl: 'pedir.page.html',
  styleUrls: ['pedir.page.scss'],
  standalone: false,
})
export class PedirPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Vista actual
  vista: VistaCarrito = 'menu';

  // Sucursales
  sucursales: Sucursal[] = [];
  cargandoSucursales = false;
  readonly sucursalSelectOptions = { header: 'Elegí tu sucursal' };

  // Categorias y productos
  categorias: Categoria[] = [];
  productos: Producto[] = [];
  activeCat: number | null = null;
  cargandoProductos = false;
  errorProductos: string | null = null;
  busqueda = '';

  // Modal detalle producto
  detalleAbierto = false;
  productoDetalle: Producto | null = null;
  tamanoSeleccionado: ProductoTamano | null = null;
  extrasSeleccionados: ExtraDisponible[] = [];
  cantidadDetalle = 1;

  // Carrito (observables)
  lineas$: Observable<LineaCarrito[]>;
  total$: Observable<number>;
  cantidadItems$: Observable<number>;

  // Checkout
  nombreCliente = '';
  /** Nombre del usuario logueado mostrado solo como placeholder (no como valor). */
  nombreClientePlaceholder = 'Tu nombre';
  notasPedido = '';
  enviandoPedido = false;
  errorPedido: string | null = null;

  // Confirmacion
  pedidoConfirmado: Pedido | null = null;

  // Buscar mi pedido (modal, endpoint autenticado)
  buscarModalAbierto = false;
  codigoBusqueda = '';
  buscandoPedido = false;
  buscarError: string | null = null;
  pedidoBuscado: Pedido | null = null;

  // Etiquetas compartidas para el template
  readonly MODALIDAD_LABEL = MODALIDAD_LABEL;

  constructor(
    private auth: AuthService,
    public carritoService: CarritoService,
    private sucursalService: SucursalService,
    private pedidoService: PedidoService,
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private toast: ToastController,
    private router: Router,
  ) {
    this.lineas$ = this.carritoService.lineas$;
    this.total$ = this.carritoService.total$;
    this.cantidadItems$ = this.carritoService.cantidadItems$;
  }

  ngOnInit(): void {
    this.cargarSucursales();
    this.cargarCategorias();
    this.cargarProductos();

    // El nombre del usuario logueado aparece solo como placeholder (texto fantasma);
    // el campo arranca vacio y es obligatorio confirmarlo antes de pagar.
    const usuario = this.auth.usuario;
    if (usuario?.nombre) {
      this.nombreClientePlaceholder = usuario.nombre;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Sucursales ──

  private cargarSucursales(): void {
    this.cargandoSucursales = true;
    this.sucursalService.listarActivas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sucursales) => {
          this.sucursales = sucursales.filter((s) => s.activa);
          this.cargandoSucursales = false;
          // Seleccionar la primera si no hay ninguna seleccionada
          if (!this.carritoService.datos.sucursalId && this.sucursales.length > 0) {
            this.carritoService.setSucursal(this.sucursales[0].id);
          }
        },
        error: () => {
          this.cargandoSucursales = false;
        },
      });
  }

  get sucursalSeleccionada(): Sucursal | null {
    const id = this.carritoService.datos.sucursalId;
    return this.sucursales.find((s) => s.id === id) ?? null;
  }

  seleccionarSucursal(id: number): void {
    this.carritoService.setSucursal(id);
  }

  get modalidad(): 'para_llevar' | 'comer_aqui' {
    return this.carritoService.datos.modalidad;
  }

  setModalidad(m: 'para_llevar' | 'comer_aqui'): void {
    this.carritoService.setModalidad(m);
  }

  get modalidadLabel(): string {
    return MODALIDAD_LABEL[this.modalidad];
  }

  // ── Categorias y productos ──

  private cargarCategorias(): void {
    this.categoriaService.listarActivas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categorias) => {
          this.categorias = categorias;
        },
      });
  }

  private cargarProductos(): void {
    this.cargandoProductos = true;
    this.errorProductos = null;
    this.productoService.listarDisponibles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productos) => {
          this.productos = productos;
          this.cargandoProductos = false;
        },
        error: () => {
          this.errorProductos = 'No se pudo cargar el menu. Intenta de nuevo.';
          this.cargandoProductos = false;
        },
      });
  }

  get productosFiltrados(): Producto[] {
    let resultado = this.productos;

    // Filtrar por categoria
    if (this.activeCat !== null) {
      resultado = resultado.filter((p) => p.categoria_id === this.activeCat);
    }

    // Filtrar por busqueda
    const texto = this.busqueda.trim().toLowerCase();
    if (texto) {
      resultado = resultado.filter((p) =>
        p.nombre.toLowerCase().includes(texto) ||
        (p.descripcion?.toLowerCase().includes(texto) ?? false)
      );
    }

    return resultado;
  }

  seleccionarCategoria(id: number | null): void {
    this.activeCat = id;
  }

  // ── Modal detalle producto ──

  abrirDetalle(producto: Producto): void {
    this.productoDetalle = producto;
    this.tamanoSeleccionado = null;
    this.extrasSeleccionados = [];
    this.cantidadDetalle = 1;
    this.detalleAbierto = true;
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.productoDetalle = null;
  }

  seleccionarTamano(tamano: ProductoTamano): void {
    this.tamanoSeleccionado = tamano;
  }

  toggleExtra(extra: ExtraDisponible): void {
    const index = this.extrasSeleccionados.findIndex((e) => e.id === extra.id);
    if (index >= 0) {
      this.extrasSeleccionados = this.extrasSeleccionados.filter((e) => e.id !== extra.id);
    } else {
      this.extrasSeleccionados = [...this.extrasSeleccionados, extra];
    }
  }

  extraSeleccionado(extra: ExtraDisponible): boolean {
    return this.extrasSeleccionados.some((e) => e.id === extra.id);
  }

  get precioCalculado(): number {
    if (!this.productoDetalle) {
      return 0;
    }
    const precioBase = this.tamanoSeleccionado?.precio ?? this.productoDetalle.precio_base;
    const precioExtras = this.extrasSeleccionados.reduce((acc, e) => acc + e.precio, 0);
    return (precioBase + precioExtras) * this.cantidadDetalle;
  }

  get puedeAgregar(): boolean {
    if (!this.productoDetalle) {
      return false;
    }
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

  // ── Carrito ──

  calcularPrecioLinea(linea: LineaCarrito): number {
    return this.carritoService.calcularPrecioLinea(linea);
  }

  actualizarCantidad(index: number, delta: number): void {
    const lineas = this.carritoService.lineas;
    const cantidad = lineas[index].cantidad + delta;
    this.carritoService.actualizarCantidad(index, cantidad);
  }

  quitarLinea(index: number): void {
    this.carritoService.quitar(index);
  }

  vaciarCarrito(): void {
    if (window.confirm('¿Vaciar el carrito?')) {
      this.carritoService.vaciar();
    }
  }

  // ── Navegacion entre vistas ──

  irACarrito(): void {
    this.vista = 'carrito';
  }

  irAMenu(): void {
    this.vista = 'menu';
  }

  irACheckout(): void {
    if (this.carritoService.estaVacio) {
      return;
    }
    if (!this.carritoService.datos.sucursalId) {
      this.mostrarError('Selecciona una sucursal primero');
      return;
    }
    this.vista = 'checkout';
  }

  // ── Checkout ──

  get puedeEnviarPedido(): boolean {
    return (
      !this.enviandoPedido &&
      this.nombreCliente.trim().length > 0 &&
      !this.carritoService.estaVacio &&
      this.carritoService.datos.sucursalId !== null
    );
  }

  async enviarPedido(): Promise<void> {
    if (!this.puedeEnviarPedido) {
      return;
    }

    this.enviandoPedido = true;
    this.errorPedido = null;

    const items: ItemPedidoPayload[] = this.carritoService.lineas.map((l) => ({
      producto_id: l.producto.id,
      cantidad: l.cantidad,
      producto_tamano_id: l.tamano?.id,
      extra_ids: l.extras.map((e) => e.id),
      notas: l.notas,
    }));

    const payload: CrearPedidoPayload = {
      sucursal_id: this.carritoService.datos.sucursalId!,
      modalidad: this.carritoService.datos.modalidad,
      nombre_cliente: this.nombreCliente.trim(),
      notas: this.notasPedido.trim() || undefined,
      items,
    };

    this.pedidoService.crear(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pedido) => {
          this.pedidoConfirmado = pedido;
          this.carritoService.vaciar();
          this.enviandoPedido = false;
          this.vista = 'confirmacion';
        },
        error: (err) => {
          this.enviandoPedido = false;
          this.errorPedido = err?.error?.message || 'No se pudo crear el pedido. Intenta de nuevo.';
        },
      });
  }

  // ── Confirmacion ──

  volverAlInicio(): void {
    this.pedidoConfirmado = null;
    this.vista = 'menu';
    this.notasPedido = '';
    void this.router.navigateByUrl('/tabs/home');
  }

  // ── Buscar mi pedido (endpoint autenticado) ──

  abrirBuscarPedido(): void {
    this.buscarModalAbierto = true;
    this.codigoBusqueda = '';
    this.buscarError = null;
    this.pedidoBuscado = null;
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

    this.pedidoService.buscarPropioPorCodigo(codigo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ── Helpers ──

  private async mostrarError(mensaje: string): Promise<void> {
    const t = await this.toast.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
    });
    await t.present();
  }
}
