import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface NewOrder { id: string; client: string; time: string; total: string; mode: string; }
interface AdminOrder {
  id: string; date: string; client: string; mode: string;
  qty: number; total: string; status: 'process' | 'completed' | 'cancelled';
}

/** Dashboard admin: KPIs + gráfico de área + pedidos nuevos + últimos pedidos. */
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class AdminDashboardPage {
  readonly areaData = [28, 35, 52, 44, 60, 78, 92.5, 84, 70, 76, 64, 58];

  readonly newOrders: NewOrder[] = [
    { id: '#1045', client: 'Laura M.',    time: 'hace 1 min', total: '₡9.450',  mode: 'aqui' },
    { id: '#1044', client: 'Andrés R.',   time: 'hace 3 min', total: '₡14.200', mode: 'llevar' },
    { id: '#1043', client: 'Carolina J.', time: 'hace 5 min', total: '₡7.800',  mode: 'aqui' },
  ];

  readonly orders: AdminOrder[] = [
    { id: '#1042', date: '23/06 · 12:41', client: 'Mechones B.',  mode: 'aqui',   qty: 2, total: '₡17.854', status: 'process' },
    { id: '#1041', date: '23/06 · 12:38', client: 'Bryan V.',     mode: 'llevar', qty: 2, total: '₡6.900',  status: 'completed' },
    { id: '#1040', date: '23/06 · 12:30', client: 'Steven B.',    mode: 'aqui',   qty: 3, total: '₡11.300', status: 'completed' },
    { id: '#1039', date: '23/06 · 12:25', client: 'Christian P.', mode: 'llevar', qty: 1, total: '₡9.450',  status: 'cancelled' },
  ];

  constructor(private router: Router) {}

  irAPedidos(): void {
    void this.router.navigate(['/admin/pedidos']);
  }
}
