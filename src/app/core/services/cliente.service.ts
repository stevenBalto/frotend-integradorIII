import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection } from '../models/producto.model';
import { Cliente, PedidoResumen } from '../models/cliente.model';

/** Analítica de compra de clientes (panel admin, solo lectura). */
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /** GET /admin/clientes — listado con estadisticas agregadas de compra. */
  listarConEstadisticas(): Observable<Cliente[]> {
    return this.http
      .get<ApiCollection<Cliente>>(`${this.base}/admin/clientes`)
      .pipe(map((res) => res.data));
  }

  /** GET /admin/clientes/{id}/pedidos — historial de pedidos de un cliente. */
  listarPedidos(id: number): Observable<PedidoResumen[]> {
    return this.http
      .get<ApiCollection<PedidoResumen>>(`${this.base}/admin/clientes/${id}/pedidos`)
      .pipe(map((res) => res.data));
  }
}
