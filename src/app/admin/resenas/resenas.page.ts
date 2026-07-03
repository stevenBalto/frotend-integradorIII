import { Component } from '@angular/core';

interface Review {
  id: number; client: string; rating: number; text: string;
  date: string; replied: boolean;
}
interface FilterOpt { id: string; label: string; }

/** Reseñas y calificaciones (maquetado estático). */
@Component({
  selector: 'app-admin-resenas',
  templateUrl: './resenas.page.html',
  styleUrls: ['./resenas.page.scss'],
  standalone: false,
})
export class AdminResenasPage {
  activeFilter = 'todas';
  readonly stars = [1, 2, 3, 4, 5];

  readonly filters: FilterOpt[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'pendientes', label: 'Sin responder' },
    { id: 'respondidas', label: 'Respondidas' },
  ];

  readonly reviews: Review[] = [
    { id: 1, client: 'Carlos M.',  rating: 5, text: 'Excelente servicio y comida deliciosa. La pizza pepperoni es increíble.', date: 'hace 2 horas', replied: false },
    { id: 2, client: 'Laura P.',   rating: 4, text: 'Muy buena atención. El tiempo de espera fue un poco largo.',            date: 'hace 5 horas', replied: true },
    { id: 3, client: 'Ricardo V.', rating: 5, text: 'La mejor comida del lugar. Definitivamente vuelvo.',                    date: 'hace 1 día',   replied: false },
    { id: 4, client: 'Ana G.',     rating: 3, text: 'La comida estuvo bien pero las costillas llegaron frías.',              date: 'hace 2 días',  replied: true },
    { id: 5, client: 'David R.',   rating: 5, text: 'Increíble! La pasta carbonara es lo mejor que he probado.',             date: 'hace 3 días',  replied: false },
  ];
}
