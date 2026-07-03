import { Component } from '@angular/core';

interface ConfigField { label: string; value: string; icon?: string; }
interface NotifToggle { label: string; sub: string; on: boolean; }
interface Branch { name: string; address: string; active: boolean; }

/** Configuración general del panel (maquetado estático). */
@Component({
  selector: 'app-admin-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: false,
})
export class AdminConfiguracionPage {
  readonly generalFields: ConfigField[] = [
    { label: 'Nombre del restaurante', value: 'Rooster',             icon: 'storefront-outline' },
    { label: 'Teléfono de contacto',   value: '8888-8888',           icon: 'call-outline' },
    { label: 'Dirección',              value: 'Liberia, Guanacaste', icon: 'globe-outline' },
    { label: 'Sitio web',              value: 'rooster.cr',          icon: 'globe-outline' },
  ];

  readonly notifToggles: NotifToggle[] = [
    { label: 'Nuevos pedidos', sub: 'Recibir alerta al llegar un pedido',   on: true },
    { label: 'Reseñas nuevas', sub: 'Recibir alerta cuando hay reseñas',    on: true },
    { label: 'Stock bajo',     sub: 'Alertar cuando un producto se agota',  on: true },
  ];

  readonly branches: Branch[] = [
    { name: 'Sucursal Liberia', address: 'Liberia, Guanacaste', active: true },
    { name: 'Sucursal Nicoya',  address: 'Nicoya, Guanacaste',  active: false },
  ];
}
