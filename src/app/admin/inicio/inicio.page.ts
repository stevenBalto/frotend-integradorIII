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
 * ya existentes. Ofertas y cupones se administran igual que las secciones de
 * productos (checkbox de activo/a). Lo unico que persiste esta pagina aparte es
 * la oferta "hero" (cuando hay varias vigentes a la vez) via /admin/home-config.
 */
@Component({
  selector: 'app-admin-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: false,
})
export class AdminInicioPage implements OnInit {
  productos: Producto[] = [];
  ofertas: Oferta[] = [];
  cupones: Cupon[] = [];
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

  /** Ofertas activas y no vencidas (elegibles como hero / contadas en el KPI). */
  get ofertasVigentes(): Oferta[] {
    return this.ofertas.filter((o) => o.activa && !this.estaVencida(o.fecha_fin));
  }

  /** Texto del descuento de una oferta, ej. "20% OFF" o "-₡500". */
  descuentoOferta(o: Oferta): string {
    return o.tipo_descuento === 'porcentaje' ? `${o.valor}% OFF` : `-₡${o.valor}`;
  }

  /** Texto del descuento de un cupon, ej. "15% OFF" o "-₡1000". */
  descuentoCupon(c: Cupon): string {
    return c.tipo === 'porcentaje' ? `${c.valor}% OFF` : `-₡${c.valor}`;
  }

  estadoOferta(o: Oferta): 'active' | 'inactive' | 'expired' {
    if (this.estaVencida(o.fecha_fin)) return 'expired';
    return o.activa ? 'active' : 'inactive';
  }

  estadoCupon(c: Cupon): 'active' | 'inactive' | 'expired' {
    if (this.estaVencida(c.fecha_fin)) return 'expired';
    return c.activo ? 'active' : 'inactive';
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
        this.mostrarToast(`${producto.nombre} actualizado.`, 'success');
      },
      error: () => this.mostrarToast('No se pudo actualizar el producto.', 'danger'),
    });
  }

  /** Activa/desactiva una oferta directamente desde Inicio. */
  toggleOferta(oferta: Oferta): void {
    const payload = {
      nombre: oferta.nombre,
      descripcion: oferta.descripcion,
      tipo_descuento: oferta.tipo_descuento,
      valor: oferta.valor,
      fecha_inicio: oferta.fecha_inicio,
      fecha_fin: oferta.fecha_fin,
      activa: !oferta.activa,
      producto_ids: oferta.productos.map((p) => p.id),
    };
    this.ofertaService.actualizar(oferta.id, payload).subscribe({
      next: (actualizada) => {
        oferta.activa = actualizada.activa;
        this.mostrarToast(`${oferta.nombre} ${oferta.activa ? 'activada' : 'desactivada'}.`, 'success');
      },
      error: () => this.mostrarToast('No se pudo actualizar la oferta.', 'danger'),
    });
  }

  /** Activa/desactiva un cupon directamente desde Inicio. */
  toggleCupon(cupon: Cupon): void {
    const payload = {
      codigo: cupon.codigo,
      tipo: cupon.tipo,
      valor: cupon.valor,
      monto_minimo: cupon.monto_minimo,
      fecha_inicio: cupon.fecha_inicio,
      fecha_fin: cupon.fecha_fin,
      usos_max: cupon.usos_max,
      activo: !cupon.activo,
    };
    this.cuponService.actualizar(cupon.id, payload).subscribe({
      next: (actualizado) => {
        cupon.activo = actualizado.activo;
        this.mostrarToast(`${cupon.codigo} ${cupon.activo ? 'activado' : 'desactivado'}.`, 'success');
      },
      error: () => this.mostrarToast('No se pudo actualizar el cupón.', 'danger'),
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

    this.ofertaService.listarTodos().subscribe({
      next: (ofertas) => (this.ofertas = ofertas),
    });

    this.cuponService.listarTodos().subscribe({
      next: (cupones) => (this.cupones = cupones),
    });

    this.homeConfigService.obtener().subscribe({
      next: (config) => (this.ofertaHeroId = config.oferta_hero_id),
    });
  }

  private estaVencida(fechaFin: string | null): boolean {
    if (!fechaFin) return false;
    return new Date(fechaFin) < new Date(new Date().toDateString());
  }

  private async mostrarToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const t = await this.toast.create({ message, duration: 2500, position: 'bottom', color });
    await t.present();
  }
}
