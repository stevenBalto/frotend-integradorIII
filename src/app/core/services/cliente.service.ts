import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection } from '../models/producto.model';
import { Cliente, PedidoResumen } from '../models/cliente.model';

/** Analítica de compra de clientes (panel admin, solo lectura). */
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);

  private readonly base = environment.apiBaseUrl;

  /** GET /admin/clientes — listado con estadisticas agregadas de compra. */
  listarConEstadisticas(porPagina: number = 24, pagina: number = 1): Observable<Cliente[]> {
    const params: Record<string, string> = {
      por_pagina: String(porPagina),
      pagina: String(pagina),
    };
    const httpParams = new URLSearchParams(params as any).toString();

    return this.http
      .get<ApiCollection<Cliente>>(`${this.base}/admin/clientes?${httpParams}`)
      .pipe(map((res) => res.data));
  }

  /** GET /admin/clientes/{id}/pedidos — historial de pedidos de un cliente. */
  listarPedidos(id: number): Observable<PedidoResumen[]> {
    return this.http
      .get<ApiCollection<PedidoResumen>>(`${this.base}/admin/clientes/${id}/pedidos`)
      .pipe(map((res) => res.data));
  }
}
