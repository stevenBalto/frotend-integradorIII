import { Component } from '@angular/core';

interface AdminProduct {
  id: number; name: string; cat: string; price: string;
  featured: boolean; available: boolean;
}

/** Gestión de menú / catálogo (maquetado estático). */
@Component({
  selector: 'app-admin-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false,
})
export class AdminMenuPage {
  activeCat = 'Todos';
  readonly categories = ['Todos', 'Pizza', 'Grill', 'Pasta', 'Bebidas'];

  readonly products: AdminProduct[] = [
    { id: 1, name: 'Pizza Pepperoni', cat: 'Pizza', price: '₡4.900', featured: true,  available: true },
    { id: 2, name: 'Pizza 4 Quesos',  cat: 'Pizza', price: '₡5.500', featured: false, available: true },
    { id: 3, name: 'Costillas BBQ',   cat: 'Grill', price: '₡8.500', featured: true,  available: false },
    { id: 4, name: 'Pasta Alfredo',   cat: 'Pasta', price: '₡5.650', featured: false, available: true },
    { id: 5, name: 'Filete Parrilla', cat: 'Grill', price: '₡9.200', featured: true,  available: true },
  ];
}
