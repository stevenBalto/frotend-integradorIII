import { Component } from '@angular/core';

interface Combo {
  id: number; name: string; price: string; products: string;
  discount: string; expires: string; active: boolean; urgent: boolean;
}
interface Coupon {
  id: number; code: string; type: string; value: string; min: string;
  expires: string; active: boolean;
  usesLabel: string; showBar: boolean; barPct: number; barFull: boolean;
}

/** Ofertas (combos) y cupones (códigos). Tab switch presentacional. */
@Component({
  selector: 'app-admin-ofertas',
  templateUrl: './ofertas.page.html',
  styleUrls: ['./ofertas.page.scss'],
  standalone: false,
})
export class AdminOfertasPage {
  tab: 'ofertas' | 'cupones' = 'ofertas';

  readonly combos: Combo[] = [
    { id: 1, name: 'Combo Pizza Personal + Bebida', price: '₡4.950', products: '2 productos', discount: 'Precio fijo',  expires: 'Sin fecha fin',   active: true,  urgent: false },
    { id: 2, name: '2x1 Pizzas Medianas',           price: '₡6.900', products: '1 producto',  discount: '% descuento', expires: 'Vence en 3 días', active: true,  urgent: true },
    { id: 3, name: 'Combo Costillas Verano',        price: '₡7.900', products: '2 productos', discount: 'Precio fijo',  expires: 'Venció 10/06',    active: false, urgent: false },
  ];

  readonly coupons: Coupon[] = [
    { id: 1, code: 'ROOSTER20',    type: 'Porcentaje', value: '20%',    min: '₡10.000',    expires: 'Hasta 30/06', active: true,  usesLabel: '142 / 200', showBar: true,  barPct: 71,  barFull: false },
    { id: 2, code: 'PRIMERPEDIDO', type: 'Monto fijo', value: '₡2.000', min: 'Sin mínimo', expires: 'Hasta 15/07', active: true,  usesLabel: '38 / ∞',   showBar: false, barPct: 0,   barFull: false },
    { id: 3, code: 'PIZZAMARTES',  type: 'Porcentaje', value: '50%',    min: '₡5.000',     expires: 'Hasta 31/05', active: false, usesLabel: '100 / 100', showBar: true,  barPct: 100, barFull: true },
  ];
}
