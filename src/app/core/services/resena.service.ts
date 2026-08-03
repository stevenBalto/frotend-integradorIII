import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, ApiResource } from '../models/producto.model';
import {
  ResenaAdmin,
  ResenaStatProducto,
  ProductoResenas,
  PendienteResena,
  EnviarResenaPayload,
} from '../models/resena.model';

/** Filtros del listado admin de reseñas. */
export interface FiltrosResenaAdmin {
  producto_id?: number;
  calificacion?: number;
  estado?: 'publicada' | 'oculta';
  desde?: string;
  hasta?: string;
  q?: string;
}

/** Consumo de reseñas (admin, cliente y público). */
@Injectable({ providedIn: 'root' })
export class ResenaService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // ── Admin ──

  listarAdmin(filtros?: FiltrosResenaAdmin, porPagina: number = 24, pagina: number = 1): Observable<ResenaAdmin[]> {
    let params = new HttpParams()
      .set('por_pagina', String(porPagina))
      .set('pagina', String(pagina));
    if (filtros) {
      Object.entries(filtros).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          params = params.set(k, String(v));
        }
      });
    }
    return this.http
      .get<ApiCollection<ResenaAdmin>>(`${this.base}/admin/resenas`, { params })
      .pipe(map((res) => res.data));
  }

  stats(): Observable<ResenaStatProducto[]> {
    return this.http
      .get<{ data: ResenaStatProducto[] }>(`${this.base}/admin/resenas/stats`)
      .pipe(map((res) => res.data));
  }

  ocultar(id: number): Observable<ResenaAdmin> {
    return this.http
      .post<ApiResource<ResenaAdmin>>(`${this.base}/admin/resenas/${id}/ocultar`, {})
      .pipe(map((res) => res.data));
  }

  mostrar(id: number): Observable<ResenaAdmin> {
    return this.http
      .post<ApiResource<ResenaAdmin>>(`${this.base}/admin/resenas/${id}/mostrar`, {})
      .pipe(map((res) => res.data));
  }

  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/resenas/${id}`);
  }

  // ── Cliente ──

  /** Pedidos entregados sin reseñar (re-prompt tipo Uber). */
  pendientes(): Observable<PendienteResena[]> {
    return this.http
      .get<{ data: PendienteResena[] }>(`${this.base}/resenas/pendientes`)
      .pipe(map((res) => res.data));
  }

  enviar(pedidoId: number, payload: EnviarResenaPayload): Observable<{ creadas: number }> {
    return this.http.post<{ creadas: number }>(
      `${this.base}/resenas/pedidos/${pedidoId}`,
      payload,
    );
  }

  descartar(pedidoId: number): Observable<unknown> {
    return this.http.post(`${this.base}/resenas/pedidos/${pedidoId}/descartar`, {});
  }

  // ── Público (ficha de producto) ──

  productoResenas(productoId: number): Observable<ProductoResenas> {
    return this.http.get<ProductoResenas>(`${this.base}/productos/${productoId}/resenas`);
  }
}
