import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, ApiResource, Categoria } from '../models/producto.model';

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

  /** POST /admin/categorias — crear nueva categoria. El backend calcula orden/activa. */
  crear(datos: { nombre: string }): Observable<Categoria> {
    return this.http
      .post<ApiResource<Categoria>>(`${this.base}/admin/categorias`, { nombre: datos.nombre })
      .pipe(map((res) => res.data));
  }
}
