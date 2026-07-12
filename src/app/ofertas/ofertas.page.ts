import { Component, OnInit } from '@angular/core';
import { Oferta } from '../core/models/oferta.model';
import { Cupon } from '../core/models/cupon.model';
import { OfertaService } from '../core/services/oferta.service';
import { CuponService } from '../core/services/cupon.service';

type OfferTab = 'ofertas' | 'cupones';

interface OfferCard {
  name: string;
  badge: string;
  price: string;
  color: string;
  icon: string;
}

interface CouponCard {
  code: string;
  desc: string;
  expira: string;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-ofertas',
  templateUrl: 'ofertas.page.html',
  styleUrls: ['ofertas.page.scss'],
  standalone: false,
})
export class OfertasPage implements OnInit {
  tab: OfferTab = 'ofertas';

  ofertas: OfferCard[] = [];
  cargandoOfertas = false;
  errorOfertas: string | null = null;

  cupones: CouponCard[] = [];
  cargandoCupones = false;
  errorCupones: string | null = null;

  private readonly colores = ['#E13642', '#F58220', '#A8895E', '#F2B134'];

  constructor(
    private readonly ofertaService: OfertaService,
    private readonly cuponService: CuponService,
  ) {}

  ngOnInit(): void {
    this.cargarOfertas();
    this.cargarCupones();
  }

  cargarOfertas(): void {
    this.cargandoOfertas = true;
    this.errorOfertas = null;

    this.ofertaService.listarPublicas().subscribe({
      next: (ofertas) => {
        this.ofertas = ofertas.map((oferta, index) => this.mapOferta(oferta, index));
        this.cargandoOfertas = false;
      },
      error: () => {
        this.errorOfertas = 'No se pudieron cargar las ofertas.';
        this.cargandoOfertas = false;
      },
    });
  }

  cargarCupones(): void {
    this.cargandoCupones = true;
    this.errorCupones = null;

    this.cuponService.listarPublicos().subscribe({
      next: (cupones) => {
        this.cupones = cupones.map((cupon, index) => this.mapCupon(cupon, index));
        this.cargandoCupones = false;
      },
      error: () => {
        this.errorCupones = 'No se pudieron cargar los cupones.';
        this.cargandoCupones = false;
      },
    });
  }

  private mapOferta(oferta: Oferta, index: number): OfferCard {
    const icon = this.getIconForOferta(oferta);
    const color = this.colores[index % this.colores.length];

    return {
      name: oferta.nombre.toUpperCase(),
      badge: this.getBadgeForOferta(oferta),
      price: this.getPriceForOferta(oferta),
      color,
      icon,
    };
  }

  private getBadgeForOferta(oferta: Oferta): string {
    if (oferta.descripcion?.trim()) {
      return oferta.descripcion.trim().toUpperCase();
    }

    return oferta.tipo_descuento === 'porcentaje' ? 'PRECIO ESPECIAL' : 'PRECIO ESPECIAL';
  }

  private getPriceForOferta(oferta: Oferta): string {
    return oferta.tipo_descuento === 'porcentaje'
      ? `${oferta.valor}%`
      : new Intl.NumberFormat('es-CR', {
          style: 'currency',
          currency: 'CRC',
          maximumFractionDigits: 0,
        }).format(oferta.valor);
  }

  private getIconForOferta(oferta: Oferta): string {
    const nombre = oferta.nombre.toLowerCase();

    if (nombre.includes('pizza')) return 'pizza-outline';
    if (nombre.includes('grill') || nombre.includes('costilla') || nombre.includes('carne')) return 'restaurant-outline';
    if (nombre.includes('pasta')) return 'wine-outline';

    return oferta.tipo_descuento === 'porcentaje' ? 'pricetag-outline' : 'restaurant-outline';
  }

  private mapCupon(cupon: Cupon, index: number): CouponCard {
    return {
      code: cupon.codigo,
      desc: this.getDescForCupon(cupon),
      expira: this.getExpiraForCupon(cupon),
      color: this.colores[index % this.colores.length],
      icon: this.getIconForCupon(cupon),
    };
  }

  private getDescForCupon(cupon: Cupon): string {
    const tipo = cupon.tipo === 'porcentaje' ? `${cupon.valor}%` : this.formatCurrency(cupon.valor);
    const minimo = cupon.monto_minimo && cupon.monto_minimo > 0 ? ` en compras mínimas de ${this.formatCurrency(cupon.monto_minimo)}` : '';
    return `${tipo} de descuento${minimo}`;
  }

  private getExpiraForCupon(cupon: Cupon): string {
    if (!cupon.fecha_fin) {
      return 'Sin fecha fin';
    }

    const fecha = new Date(cupon.fecha_fin);
    const hoy = new Date();
    if (fecha < hoy) {
      return `Vencido: ${fecha.toLocaleDateString('es-CR')}`;
    }

    return `Vence: ${fecha.toLocaleDateString('es-CR')}`;
  }

  private getIconForCupon(cupon: Cupon): string {
    if (cupon.tipo === 'porcentaje') return 'pricetag-outline';
    if ((cupon.monto_minimo ?? 0) > 0) return 'card-outline';
    return 'gift-outline';
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
