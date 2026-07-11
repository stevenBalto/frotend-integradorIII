import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';
import { CategoriaService } from '../core/services/categoria.service';
import { ProductoService } from '../core/services/producto.service';
import { Usuario } from '../core/models/usuario.model';
import { Categoria, Producto } from '../core/models/producto.model';

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

  constructor(
    private auth: AuthService,
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
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
    this.detalleAbierto = true;
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.productoDetalle = null;
  }

  async agregarAlCarrito(): Promise<void> {
    const t = await this.toast.create({
      message: 'El carrito todavía no está disponible. ¡Muy pronto!',
      duration: 2000,
      position: 'bottom',
      color: 'medium',
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
