import { Component } from '@angular/core';

interface AdminOrder {
  id: string; date: string; client: string; mode: string;
  qty: number; total: string; status: 'process' | 'completed' | 'cancelled';
}
interface FilterOpt { id: string; label: string; }
interface Bar { day: string; val: number; }
interface Legend { label: string; n: number; c: string; bg: string; }

/** Gestión de pedidos: stats, gráficos, tabla y modal de detalle (toggle visual). */
@Component({
  selector: 'app-admin-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: false,
})
export class AdminPedidosPage {
  /** Solo visual: cambia el resaltado, todavía no filtra las filas. */
  activeFilter = 'todos';
  modalOpen = false;

  readonly filters: FilterOpt[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'process', label: 'En proceso' },
    { id: 'completed', label: 'Completados' },
    { id: 'cancelled', label: 'Cancelados' },
  ];

  readonly weekly: Bar[] = [
    { day: 'L', val: 18 }, { day: 'M', val: 24 }, { day: 'M', val: 21 },
    { day: 'J', val: 32 }, { day: 'V', val: 27 }, { day: 'S', val: 42 }, { day: 'D', val: 47 },
  ];

  readonly legend: Legend[] = [
    { label: 'Comer aquí',  n: 26, c: '#E13642', bg: 'rgba(225,54,66,0.05)' },
    { label: 'Para llevar', n: 21, c: '#374151', bg: '#E5E7EB' },
  ];

  readonly orders: AdminOrder[] = [
    { id: '#1042', date: '23/06 · 12:41', client: 'Mechones B.',  mode: 'aqui',   qty: 2, total: '₡17.854', status: 'process' },
    { id: '#1041', date: '23/06 · 12:38', client: 'Bryan V.',     mode: 'llevar', qty: 2, total: '₡6.900',  status: 'completed' },
    { id: '#1040', date: '23/06 · 12:30', client: 'Steven B.',    mode: 'aqui',   qty: 3, total: '₡11.300', status: 'completed' },
    { id: '#1039', date: '23/06 · 12:25', client: 'Christian P.', mode: 'llevar', qty: 1, total: '₡9.450',  status: 'cancelled' },
  ];

  openModal(): void { this.modalOpen = true; }
  closeModal(): void { this.modalOpen = false; }
}
