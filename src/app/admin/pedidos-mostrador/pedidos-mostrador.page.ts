import { Component, inject } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductoService } from '../../core/services/producto.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { CuponService } from '../../core/services/cupon.service';
import { OfertaService } from '../../core/services/oferta.service';
import { PedidoService } from '../../core/services/pedido.service';
import { Producto } from '../../core/models/producto.model';
import { Sucursal } from '../../core/models/sucursal.model';
import { Cupon } from '../../core/models/cupon.model';
import { Oferta } from '../../core/models/oferta.model';
import { CrearPedidoPayload, PedidoAdmin } from '../../core/models/pedido.model';
import { Modalidad } from '../../shared/constants/modalidad';

interface LineaMostrador {
  producto: Producto;
  productoTamanoId: number | null;
  tamanoNombre: string | null;
  precioUnitario: number;
  cantidad: number;
}

/**
 * Pedido de mostrador: el staff arma el pedido de un cliente que pidio en el
 * mostrador (sin usar el carrito de la app) despues de escanear su cupon por QR
 * en "Ofertas y cupones" (admin). Version simplificada del carrito (sin extras):
 * cantidad + tamano si aplica, el resto se resuelve con la nota libre.
 */
@Component({
  selector: 'app-admin-pedidos-mostrador',
  templateUrl: './pedidos-mostrador.page.html',
  styleUrls: ['./pedidos-mostrador.page.scss'],
  standalone: false,
})
export class PedidosMostradorPage implements ViewWillEnter {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productoService = inject(ProductoService);
  private sucursalService = inject(SucursalService);
  private cuponService = inject(CuponService);
  private ofertaService = inject(OfertaService);
  private pedidoService = inject(PedidoService);

  productos: Producto[] = [];
  sucursales: Sucursal[] = [];
  busqueda = '';

  lineas: LineaMostrador[] = [];

  nombreCliente = '';
  sucursalId: number | null = null;
  modalidad: Modalidad = 'comer_aqui';
  notas = '';

  cuponCodigo: string | null = null;
  cupon: Cupon | null = null;

  ofertaId: number | null = null;
  oferta: Oferta | null = null;

  cargandoCanje = false;
  errorCanje: string | null = null;

  enviando = false;
  errorEnvio: string | null = null;
  pedidoCreado: PedidoAdmin | null = null;

  private productosListos = false;

  /**
   * Ionic cachea esta página (IonicRouteStrategy): si se entra dos veces (ej.
   * escaneando un código, volviendo a Ofertas y escaneando otro), Angular NO
   * vuelve a correr ngOnInit — reusa la misma instancia. Sin este hook se veía
   * un instante el carrito/canje de la visita anterior antes de refrescar
   * ("carga con las dimensiones de antes y ya"). ionViewWillEnter sí dispara
   * cada vez, incluida la primera entrada — reemplaza a ngOnInit por completo.
   */
  ionViewWillEnter(): void {
    this.resetEstado();

    this.productoService.listarDisponibles().subscribe({
      next: (p) => {
        this.productos = p;
        this.productosListos = true;
        this.autoAgregarProductosDeOferta();
      },
    });
    this.sucursalService.listarActivas().subscribe({
      next: (s) => {
        this.sucursales = s;
        if (s.length === 1) {
          this.sucursalId = s[0].id;
        }
      },
    });

    const codigo = this.route.snapshot.queryParamMap.get('cupon');
    const ofertaIdParam = this.route.snapshot.queryParamMap.get('oferta');

    if (codigo) {
      this.cuponCodigo = codigo;
      this.validarCupon(codigo);
    } else if (ofertaIdParam) {
      this.ofertaId = Number(ofertaIdParam);
      this.validarOferta(this.ofertaId);
    }
  }

  /** Vuelve la página al estado inicial antes de recargar — evita arrastrar el
   *  carrito/canje de una visita anterior a esta misma instancia cacheada. */
  private resetEstado(): void {
    this.productos = [];
    this.sucursales = [];
    this.busqueda = '';
    this.lineas = [];
    this.nombreCliente = '';
    this.sucursalId = null;
    this.modalidad = 'comer_aqui';
    this.notas = '';
    this.cuponCodigo = null;
    this.cupon = null;
    this.ofertaId = null;
    this.oferta = null;
    this.cargandoCanje = false;
    this.errorCanje = null;
    this.enviando = false;
    this.errorEnvio = null;
    this.pedidoCreado = null;
    this.productosListos = false;
  }

  /**
   * Cuando se canjea una OFERTA, sus productos ya fueron elegidos al crearla
   * (checklist de "Productos incluidos") — no tiene sentido pedirle al staff que
   * los busque de nuevo. Se agregan TODOS solos al carrito (cantidad 1) apenas
   * están listos tanto el catálogo como la oferta, para que el staff solo tenga
   * que registrar el pedido. Los que tienen tamaños entran con el primero de la
   * lista por defecto (queda resaltado con el tag "oferta"); el staff lo puede
   * ajustar como cualquier línea del carrito si el cliente pidió otro tamaño.
   */
  private autoAgregarProductosDeOferta(): void {
    if (!this.productosListos || !this.oferta || this.lineas.length > 0) {
      return;
    }

    const idsOferta = this.oferta.productos.map((p) => p.id);
    const productosDeLaOferta = this.productos.filter((p) => idsOferta.includes(p.id));

    this.lineas = productosDeLaOferta.map((producto) => {
      const tamano = producto.tamanos.length > 0 ? producto.tamanos[0] : null;
      return {
        producto,
        productoTamanoId: tamano?.id ?? null,
        tamanoNombre: tamano?.nombre ?? null,
        precioUnitario: tamano?.precio ?? producto.precio_base,
        cantidad: 1,
      };
    });
  }

  private validarCupon(codigo: string): void {
    this.cargandoCanje = true;
    this.errorCanje = null;
    this.cuponService.validar(codigo).subscribe({
      next: (res) => {
        this.cupon = res.data;
        this.cargandoCanje = false;
      },
      error: (err: HttpErrorResponse) => {
        this.cupon = null;
        this.errorCanje = this.primerError(err);
        this.cargandoCanje = false;
      },
    });
  }

  private validarOferta(id: number): void {
    this.cargandoCanje = true;
    this.errorCanje = null;
    this.ofertaService.listarTodos().subscribe({
      next: (ofertas) => {
        this.oferta = ofertas.find((o) => o.id === id) ?? null;
        this.errorCanje = this.oferta ? null : 'Esta oferta ya no existe.';
        this.cargandoCanje = false;
        this.autoAgregarProductosDeOferta();
      },
      error: () => {
        this.errorCanje = 'No se pudo validar la oferta.';
        this.cargandoCanje = false;
      },
    });
  }

  /** Si hay una oferta activa, indica si un producto es elegible para su descuento. */
  esProductoDeLaOferta(producto: Producto): boolean {
    return this.oferta?.productos.some((p) => p.id === producto.id) ?? false;
  }

  get ofertaProductosTexto(): string {
    const nombres = this.oferta?.productos.map((p) => p.nombre) ?? [];
    return nombres.length > 0 ? nombres.join(', ') : 'todos los productos';
  }

  get productosFiltrados(): Producto[] {
    const texto = this.busqueda.trim().toLowerCase();
    if (!texto) {
      return this.productos;
    }
    return this.productos.filter((p) => p.nombre.toLowerCase().includes(texto));
  }

  agregarProducto(producto: Producto, tamanoId: string | null): void {
    const tamano = tamanoId ? producto.tamanos.find((t) => t.id === Number(tamanoId)) ?? null : null;

    if (producto.tamanos.length > 0 && tamano === null) {
      return;
    }

    this.lineas = [
      ...this.lineas,
      {
        producto,
        productoTamanoId: tamano?.id ?? null,
        tamanoNombre: tamano?.nombre ?? null,
        precioUnitario: tamano?.precio ?? producto.precio_base,
        cantidad: 1,
      },
    ];
  }

  quitarLinea(index: number): void {
    this.lineas = this.lineas.filter((_, i) => i !== index);
  }

  cambiarCantidad(index: number, delta: number): void {
    const linea = this.lineas[index];
    const cantidad = linea.cantidad + delta;
    if (cantidad < 1) {
      this.quitarLinea(index);
      return;
    }
    this.lineas = this.lineas.map((l, i) => (i === index ? { ...l, cantidad } : l));
  }

  get subtotal(): number {
    return this.lineas.reduce((acc, l) => acc + l.precioUnitario * l.cantidad, 0);
  }

  /** Estimado en pantalla — el backend recalcula el descuento real al confirmar. */
  get descuentoEstimado(): number {
    if (this.cupon) {
      const monto = this.cupon.tipo === 'porcentaje' ? this.subtotal * (this.cupon.valor / 100) : this.cupon.valor;
      return Math.min(monto, this.subtotal);
    }

    if (this.oferta) {
      const subtotalElegible = this.lineas
        .filter((l) => this.esProductoDeLaOferta(l.producto))
        .reduce((acc, l) => acc + l.precioUnitario * l.cantidad, 0);
      const monto = this.oferta.tipo_descuento === 'porcentaje' ? subtotalElegible * (this.oferta.valor / 100) : this.oferta.valor;
      return Math.min(monto, subtotalElegible);
    }

    return 0;
  }

  get total(): number {
    return this.subtotal - this.descuentoEstimado;
  }

  /** Campos requeridos completos, sin importar si ya se está enviando. Controla si el
   *  botón/aviso se muestran — separado de `puedeConfirmar` para que el botón no
   *  desaparezca (y el aviso "falta el nombre" no aparezca por error) mientras carga. */
  get camposCompletos(): boolean {
    return this.lineas.length > 0 && this.sucursalId !== null && this.nombreCliente.trim().length > 0;
  }

  get puedeConfirmar(): boolean {
    return !this.enviando && this.camposCompletos;
  }

  confirmar(): void {
    if (!this.puedeConfirmar || this.sucursalId === null) {
      return;
    }

    this.enviando = true;
    this.errorEnvio = null;

    const payload: CrearPedidoPayload = {
      sucursal_id: this.sucursalId,
      modalidad: this.modalidad,
      nombre_cliente: this.nombreCliente.trim(),
      notas: this.notas.trim() || undefined,
      cupon_codigo: this.cuponCodigo ?? undefined,
      oferta_id: this.ofertaId ?? undefined,
      items: this.lineas.map((l) => ({
        producto_id: l.producto.id,
        cantidad: l.cantidad,
        producto_tamano_id: l.productoTamanoId ?? undefined,
        extra_ids: [],
      })),
    };

    this.pedidoService.crearMostrador(payload).subscribe({
      next: (pedido) => {
        this.enviando = false;
        this.pedidoCreado = pedido;
      },
      error: (err: HttpErrorResponse) => {
        this.enviando = false;
        this.errorEnvio = this.primerError(err);
      },
    });
  }

  irAPedidos(): void {
    void this.router.navigate(['/admin/pedidos']);
  }

  /** Cierra la confirmación (X o click afuera). Sin un cupón/oferta nuevo no hay nada
   *  más que armar acá — vuelve a Ofertas y cupones para el próximo canje. */
  cerrarConfirmacion(): void {
    void this.router.navigate(['/admin/ofertas']);
  }

  private primerError(err: HttpErrorResponse): string {
    const errores = err.error?.errors;
    if (errores) {
      const primero = Object.values(errores)[0];
      if (Array.isArray(primero)) return primero[0] as string;
    }
    return err.error?.message ?? 'Ocurrió un error.';
  }
}
