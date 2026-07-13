import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, Categoria } from '../models/producto.model';

/** Consumo de categorias del catalogo (para filtros y formularios). */
@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  listarActivas(): Observable<Categoria[]> {
    return this.http
      .get<ApiCollection<Categoria>>(`${this.base}/categorias`)
      .pipe(map((res) => res.data));
  }

  /** Categorías del panel admin: AISLADAS a la instancia del admin autenticado. */
  listarAdmin(): Observable<Categoria[]> {
    return this.http
      .get<ApiCollection<Categoria>>(`${this.base}/admin/categorias`)
      .pipe(map((res) => res.data));
  }
}
