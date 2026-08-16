import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Oferta } from '../core/models/oferta.model';
import { Cupon } from '../core/models/cupon.model';
import { OfertaService } from '../core/services/oferta.service';
import { CuponService } from '../core/services/cupon.service';
import { AuthService } from '../core/services/auth.service';

type OfferTab = 'ofertas' | 'cupones';

interface OfferCard {
  id: number;
  name: string;
  badge: string;
  price: string;
  color: string;
  icon: string;
  sedesTexto: string;
}

interface CouponCard {
  id: number;
  code: string;
  desc: string;
  expira: string;
  color: string;
  icon: string;
  sedesTexto: string;
}

@Component({
  selector: 'app-ofertas',
  templateUrl: 'ofertas.page.html',
  styleUrls: ['ofertas.page.scss'],
  standalone: false,
})
export class OfertasPage implements OnInit {
  private readonly ofertaService = inject(OfertaService);
  private readonly cuponService = inject(CuponService);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Visitante que entro con "Iniciar sin registrarme": ve las promos, pero
      bloqueadas (no puede sacar el QR para canjearlas). Se lee como getter y no
      como propiedad para que refleje el estado actual si la sesion cambia
      mientras la pagina esta cacheada por el tab. */
  get esInvitado(): boolean {
    return !this.auth.estaAutenticado;
  }

  /** Tocar una promo bloqueada lleva al login: es la unica accion que le queda
      al invitado sobre esa card, y es justo lo que necesita para desbloquearla.
      Al volver, ionViewWillEnter recarga y las cards ya salen normales. */
  irALogin(): void {
    void this.router.navigateByUrl('/login');
  }

  tab: OfferTab = 'ofertas';

  ofertas: OfferCard[] = [];
  cargandoOfertas = false;
  errorOfertas: string | null = null;

  cupones: CouponCard[] = [];
  cargandoCupones = false;
  errorCupones: string | null = null;

  private readonly colores = ['#E13642', '#F58220', '#A8895E', '#F2B134'];

  /** Modal de código QR (oferta o cupón), a pantalla completa. */
  qrAbierto = false;
  qrValor = '';
  qrCodigoTexto = '';
  qrTitulo = '';
  qrSubtitulo = '';

  ngOnInit(): void {
    // Panel pedido desde el Home (?panel=ofertas|cupones) -> abre esa pestana.
    this.route.queryParamMap.subscribe((pm) => {
      const panel = pm.get('panel');
      if (panel === 'ofertas' || panel === 'cupones') {
        this.tab = panel;
      }
    });
  }

  /** La carga va ACA y no en ngOnInit: Ionic CACHEA las paginas de los tabs en
      vez de destruirlas, asi que ngOnInit corre una sola vez por sesion y la
      lista quedaba congelada. Concretamente: si un admin vence/extiende una
      oferta o cupon, el cliente no veia el cambio hasta hacer F5. El filtro por
      fecha lo hace el backend en cada consulta (OfertaRepository), asi que basta
      con volver a pedir los datos al entrar. ionViewWillEnter tambien se dispara
      en la primera entrada, por eso no hace falta dejarlo tambien en ngOnInit
      (haria dos requests). */
  ionViewWillEnter(): void {
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
      id: oferta.id,
      name: oferta.nombre.toUpperCase(),
      badge: this.getBadgeForOferta(oferta),
      price: this.getPriceForOferta(oferta),
      color,
      icon,
      sedesTexto: this.getSedesTexto(oferta.alcance_sedes, oferta.sucursales),
    };
  }

  /** "Disponible en todas las sedes" o "Disponible en: X, Y" — informativo, no
   *  filtra la lista (el cliente no tiene una sede "actual" hasta que arma el
   *  pedido). La sede sí se valida de verdad al canjear en el mostrador. */
  private getSedesTexto(alcanceSedes: 'todas' | 'especifica', sucursales?: { id: number; nombre: string }[]): string {
    if (alcanceSedes !== 'especifica' || !sucursales || sucursales.length === 0) {
      return 'Disponible en todas las sedes';
    }

    return `Disponible en: ${sucursales.map((s) => s.nombre).join(', ')}`;
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
      id: cupon.id,
      code: cupon.codigo,
      desc: this.getDescForCupon(cupon),
      expira: this.getExpiraForCupon(cupon),
      color: this.colores[index % this.colores.length],
      icon: this.getIconForCupon(cupon),
      sedesTexto: this.getSedesTexto(cupon.alcance_sedes, cupon.sucursales),
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

  /** Muestra el QR de una oferta: el staff lo escanea para confirmar su vigencia (informativo, sin canje automático). */
  verQrOferta(o: OfferCard): void {
    // El invitado no canjea: el bloqueo no puede ser solo visual (la card queda
    // con pointer-events, pero igual se puede llegar aca por teclado).
    if (this.esInvitado) {
      return;
    }

    this.qrCodigoTexto = this.codigoDeOferta(o.id);
    this.qrValor = this.qrCodigoTexto;
    this.qrTitulo = o.name;
    this.qrSubtitulo = 'Mostrá este código en el mostrador para validar la oferta.';
    this.qrAbierto = true;
  }

  /** Muestra el QR de un cupón: el staff lo escanea para canjearlo en un pedido real. */
  verQrCupon(c: CouponCard): void {
    if (this.esInvitado) {
      return;
    }

    this.qrCodigoTexto = this.codigoDeCupon(c.id);
    this.qrValor = this.qrCodigoTexto;
    this.qrTitulo = c.code;
    this.qrSubtitulo = 'Mostrá este código en el mostrador para canjear el cupón.';
    this.qrAbierto = true;
  }

  /** Código corto tipo "pedido" (letras + números) para mostrar bajo el QR, en vez del payload interno. */
  private codigoDeOferta(id: number): string {
    return `OF-${id.toString().padStart(4, '0')}`;
  }

  /** Idem para cupones: el nombre del cupón (ej. "PASTA", "CUPONROOSTER") ya no se muestra ni se codifica. */
  private codigoDeCupon(id: number): string {
    return `CU-${id.toString().padStart(4, '0')}`;
  }

  cerrarQr(): void {
    this.qrAbierto = false;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
