import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { CategoriaService } from '../core/services/categoria.service';
import { ProductoService } from '../core/services/producto.service';
import { Categoria, Producto } from '../core/models/producto.model';

/** Menu completo del cliente (antes vivia en Home). Buscador + filtro por categoria. */
@Component({
  selector: 'app-pedir',
  templateUrl: 'pedir.page.html',
  styleUrls: ['pedir.page.scss'],
  standalone: false,
})
export class PedirPage implements OnInit {
  categorias: Categoria[] = [];
  activeCat: number | null = null;
  busqueda = '';

  productos: Producto[] = [];
  cargando = false;
  error: string | null = null;

  detalleAbierto = false;
  productoDetalle: Producto | null = null;

  constructor(
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private toast: ToastController,
  ) {}

  ngOnInit(): void {
    this.categoriaService.listarActivas().subscribe({
      next: (categorias) => (this.categorias = categorias),
    });
    this.cargarProductos();
  }

  get productosFiltrados(): Producto[] {
    const texto = this.busqueda.trim().toLowerCase();
    return this.productos.filter((p) => {
      const coincideCategoria = this.activeCat === null || p.categoria_id === this.activeCat;
      const coincideBusqueda = !texto || p.nombre.toLowerCase().includes(texto);
      return coincideCategoria && coincideBusqueda;
    });
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
