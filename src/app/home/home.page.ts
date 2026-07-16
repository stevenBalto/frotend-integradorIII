import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';
import { CategoriaService } from '../core/services/categoria.service';
import { ProductoService } from '../core/services/producto.service';
import { CarritoService, LineaCarrito } from '../core/services/carrito.service';
import { Usuario } from '../core/models/usuario.model';
import { Categoria, Producto, ProductoTamano, ExtraDisponible } from '../core/models/producto.model';

/** Foto decorativa por categoria (placeholder hasta integrar Cloudinary). */
const IMAGEN_CATEGORIA: Record<string, string> = {
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop&auto=format',
  grill: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop&auto=format',
  pastas: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop&auto=format',
  bebidas: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop&auto=format',
};
const IMAGEN_CATEGORIA_DEFAULT = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop&auto=format';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  readonly usuario$: Observable<Usuario | null>;

  categorias: Categoria[] = [];
  activeCat: number | null = null;

  productos: Producto[] = [];
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
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private carritoService: CarritoService,
    private toast: ToastController,
  ) {
    this.usuario$ = this.auth.usuarioActual$;
  }

  ngOnInit(): void {
    this.categoriaService.listarActivas().subscribe({
      next: (categorias) => (this.categorias = categorias),
    });
    this.cargarProductos();
  }

  get productosFiltrados(): Producto[] {
    if (this.activeCat === null) {
      return this.productos;
    }
    return this.productos.filter((p) => p.categoria_id === this.activeCat);
  }

  imagenCategoria(nombre: string): string {
    return IMAGEN_CATEGORIA[nombre.toLowerCase()] ?? IMAGEN_CATEGORIA_DEFAULT;
  }

  seleccionarCategoria(id: number | null): void {
    this.activeCat = id;
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

  private cargarProductos(): void {
    this.cargando = true;
    this.error = null;
    this.productoService.listarDisponibles().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el menú. Intentá de nuevo más tarde.';
        this.cargando = false;
      },
    });
  }
}
