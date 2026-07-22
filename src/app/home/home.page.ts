import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';
import { ProductoService } from '../core/services/producto.service';
import { OfertaService } from '../core/services/oferta.service';
import { CuponService } from '../core/services/cupon.service';
import { HomeConfigService } from '../core/services/home-config.service';
import { CarritoService, LineaCarrito } from '../core/services/carrito.service';
import { Usuario } from '../core/models/usuario.model';
import { Producto, ProductoTamano, ExtraDisponible } from '../core/models/producto.model';
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
  ofertaHeroId: number | null = null;

  cargando = false;
  error: string | null = null;

  detalleAbierto = false;
  productoDetalle: Producto | null = null;

  // Selecciones del modal de detalle
  tamanoSeleccionado: ProductoTamano | null = null;
  extrasSeleccionados: ExtraDisponible[] = [];
  cantidadDetalle = 1;

  constructor(
    private auth: AuthService,
    private productoService: ProductoService,
    private ofertaService: OfertaService,
    private cuponService: CuponService,
    private homeConfigService: HomeConfigService,
    private carritoService: CarritoService,
    private toast: ToastController,
  ) {
    this.usuario$ = this.auth.usuarioActual$;
  }

  ngOnInit(): void {
    this.cargarVitrina();
  }

  abrirDetalle(producto: Producto): void {
    this.productoDetalle = producto;
    // Resetear selecciones
    this.tamanoSeleccionado = null;
    this.extrasSeleccionados = [];
    this.cantidadDetalle = 1;
    this.detalleAbierto = true;
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

  esOfertaHero(o: Oferta): boolean {
    return this.ofertaHeroId !== null && o.id === this.ofertaHeroId;
  }

  private cargarVitrina(): void {
    this.cargando = true;
    this.error = null;

    this.productoService.listarDisponibles().subscribe({
      next: (productos) => {
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

    this.homeConfigService.obtener().subscribe({
      next: (config) => {
        this.ofertaHeroId = config.oferta_hero_id;
        this.ordenarOfertas();
      },
    });

    this.ofertaService.listarPublicas().subscribe({
      next: (ofertas) => {
        this.ofertas = ofertas;
        this.ordenarOfertas();
      },
    });

    this.cuponService.listarPublicos().subscribe({
      next: (cupones) => (this.cupones = cupones),
    });
  }

  /** Pone la oferta "hero" elegida en admin primero, si hay alguna vigente. */
  private ordenarOfertas(): void {
    if (this.ofertaHeroId === null) {
      return;
    }
    const heroId = this.ofertaHeroId;
    this.ofertas = [...this.ofertas].sort((a, b) => (a.id === heroId ? -1 : b.id === heroId ? 1 : 0));
  }
}
