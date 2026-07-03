import { Component } from '@angular/core';

interface Notif {
  id: number; text: string; time: string; read: boolean;
  icon: string; iconBg: string; iconColor: string;
}

/** Notificaciones del panel (maquetado estático). */
@Component({
  selector: 'app-admin-notificaciones',
  templateUrl: './notificaciones.page.html',
  styleUrls: ['./notificaciones.page.scss'],
  standalone: false,
})
export class AdminNotificacionesPage {
  readonly notifs: Notif[] = [
    { id: 1, text: 'Nuevo pedido #1043 recibido — Comer aquí',          time: 'hace 2 min',  read: false, icon: 'clipboard-outline',    iconBg: '#6B728014', iconColor: '#374151' },
    { id: 2, text: "Producto 'Costillas BBQ' marcado como agotado",       time: 'hace 15 min', read: false, icon: 'alert-circle-outline', iconBg: '#DC26261a', iconColor: '#DC2626' },
    { id: 3, text: 'Cupón ROOSTER20 a punto de vencer (hoy a las 23:59)', time: 'hace 1 h',    read: false, icon: 'pricetag-outline',     iconBg: '#F59E0B1f', iconColor: '#F59E0B' },
    { id: 4, text: 'Nueva reseña de 5 estrellas — Carlos M.',             time: 'hace 2 h',    read: true,  icon: 'star-outline',         iconBg: '#16A34A1a', iconColor: '#16A34A' },
    { id: 5, text: 'Pedido #1041 marcado como completado',                time: 'hace 3 h',    read: true,  icon: 'clipboard-outline',    iconBg: '#6B728014', iconColor: '#374151' },
    { id: 6, text: 'Nueva reseña de 3 estrellas pendiente de respuesta',  time: 'ayer',        read: true,  icon: 'star-outline',         iconBg: '#16A34A1a', iconColor: '#16A34A' },
  ];
}
