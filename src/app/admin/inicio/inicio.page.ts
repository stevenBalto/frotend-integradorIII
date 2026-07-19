import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ProductoService } from '../../core/services/producto.service';
import { OfertaService } from '../../core/services/oferta.service';
import { CuponService } from '../../core/services/cupon.service';
import { HomeConfigService } from '../../core/services/home-config.service';
import { Producto } from '../../core/models/producto.model';
import { Oferta } from '../../core/models/oferta.model';
import { Cupon } from '../../core/models/cupon.model';

/**
 * Curacion del Home cliente. No duplica datos: reutiliza Productos/Ofertas/Cupones
 * ya existentes. Lo unico que persiste esta pagina es la oferta "hero" (cuando hay
 * varias vigentes a la vez) via /admin/home-config.
 */
@Component({
  selector: 'app-admin-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: false,
})
export class AdminInicioPage implements OnInit {
  productos: Producto[] = [];
  ofertasVigentes: Oferta[] = [];
  cuponesVigentes: Cupon[] = [];
  ofertaHeroId: number | null = null;

  cargando = false;
  guardando = false;
  error: string | null = null;

  constructor(
    private productoService: ProductoService,
    private ofertaService: OfertaService,
    private cuponService: CuponService,
    private homeConfigService: HomeConfigService,
    private toast: ToastController,
  ) {}

  ngOnInit(): void {
    this.cargarTodo();
  }

  get destacados(): Producto[] {
    return this.productos.filter((p) => p.destacado);
  }

  get populares(): Producto[] {
    return this.productos.filter((p) => p.popular);
  }

  get nuevos(): Producto[] {
    return this.productos.filter((p) => p.nuevo);
  }

  /** Toggle rapido de una seccion del Home (destacado/popular/nuevo) sin ir al modulo Menu. */
  async toggleSeccion(producto: Producto, campo: 'destacado' | 'popular' | 'nuevo'): Promise<void> {
    const payload = {
      categoria_id: producto.categoria_id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio_base: producto.precio_base,
      destacado: producto.destacado,
      popular: producto.popular,
      nuevo: producto.nuevo,
      disponible: producto.disponible,
      [campo]: !producto[campo],
    };
    this.productoService.actualizar(producto.id, payload).subscribe({
      next: (actualizado) => {
        producto.destacado = actualizado.destacado;
        producto.popular = actualizado.popular;
        producto.nuevo = actualizado.nuevo;
      },
      error: () => this.mostrarToast('No se pudo actualizar el producto.', 'danger'),
    });
  }

  guardarHero(): void {
    this.guardando = true;
    this.homeConfigService.actualizar(this.ofertaHeroId).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarToast('Oferta destacada del Home actualizada.', 'success');
      },
      error: () => {
        this.guardando = false;
        this.mostrarToast('No se pudo guardar la oferta destacada.', 'danger');
      },
    });
  }

  private cargarTodo(): void {
    this.cargando = true;
    this.error = null;

    this.productoService.listarTodos().subscribe({
      next: (productos) => {
        this.productos = productos.filter((p) => p.disponible);
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el catálogo.';
        this.cargando = false;
      },
    });

    this.ofertaService.listarPublicas().subscribe({
      next: (ofertas) => (this.ofertasVigentes = ofertas),
    });

    this.cuponService.listarPublicos().subscribe({
      next: (cupones) => (this.cuponesVigentes = cupones),
    });

    this.homeConfigService.obtener().subscribe({
      next: (config) => (this.ofertaHeroId = config.oferta_hero_id),
    });
  }

  private async mostrarToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const t = await this.toast.create({ message, duration: 2500, position: 'bottom', color });
    await t.present();
  }
}
