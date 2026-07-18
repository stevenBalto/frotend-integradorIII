import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';
import { ProductoService } from '../core/services/producto.service';
import { OfertaService } from '../core/services/oferta.service';
import { CuponService } from '../core/services/cupon.service';
import { HomeConfigService } from '../core/services/home-config.service';
import { Usuario } from '../core/models/usuario.model';
import { Producto } from '../core/models/producto.model';
import { Oferta } from '../core/models/oferta.model';
import { Cupon } from '../core/models/cupon.model';

/** Home cliente: vitrina (destacados + ofertas + cupones vigentes). El menu completo vive en la tab "Carrito". */
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

  constructor(
    private auth: AuthService,
    private productoService: ProductoService,
    private ofertaService: OfertaService,
    private cuponService: CuponService,
    private homeConfigService: HomeConfigService,
    private toast: ToastController,
  ) {
    this.usuario$ = this.auth.usuarioActual$;
  }

  ngOnInit(): void {
    this.cargarVitrina();
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
