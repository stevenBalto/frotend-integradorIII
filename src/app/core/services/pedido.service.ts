import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, ApiResource } from '../models/producto.model';
import {
  Pedido,
  PedidoAdmin,
  PedidoPublico,
  CrearPedidoPayload,
  CambiarEstadoPayload,
  FiltrosPedidoAdmin,
} from '../models/pedido.model';
import { PedidoEstado } from '../../shared/constants/pedido-estado';

/** Consumo de pedidos (cliente y admin). */
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // ── Cliente ──

  /** POST /pedidos — crear pedido (cliente autenticado). */
  crear(payload: CrearPedidoPayload): Observable<Pedido> {
    return this.http
      .post<ApiResource<Pedido>>(`${this.base}/pedidos`, payload)
      .pipe(map((res) => res.data));
  }

  /** GET /pedidos/mios — historial de pedidos del cliente. */
  misPedidos(): Observable<Pedido[]> {
    return this.http
      .get<ApiCollection<Pedido>>(`${this.base}/pedidos/mios`)
      .pipe(map((res) => res.data));
  }

  /** GET /pedidos/mios/{id} — detalle de un pedido del cliente. */
  misPedidosShow(id: number): Observable<Pedido> {
    return this.http
      .get<ApiResource<Pedido>>(`${this.base}/pedidos/mios/${id}`)
      .pipe(map((res) => res.data));
  }

  /** GET /pedidos/buscar?codigo=XXXX-XXXX — buscar pedido publico (sin auth). */
  buscarPorCodigo(codigo: string): Observable<PedidoPublico> {
    const params = new HttpParams().set('codigo', codigo);
    return this.http
      .get<ApiResource<PedidoPublico>>(`${this.base}/pedidos/buscar`, { params })
      .pipe(map((res) => res.data));
  }

  /**
   * GET /pedidos/mios/buscar?codigo=XXXX-XXXX — buscar un pedido PROPIO por codigo
   * (autenticado). Devuelve el pedido completo (items, notas, sucursal, total)
   * solo si el codigo pertenece al usuario logueado; 404 si no.
   */
  buscarPropioPorCodigo(codigo: string): Observable<Pedido> {
    const params = new HttpParams().set('codigo', codigo);
    return this.http
      .get<ApiResource<Pedido>>(`${this.base}/pedidos/mios/buscar`, { params })
      .pipe(map((res) => res.data));
  }

  // ── Admin ──

  /** GET /admin/pedidos — listado de pedidos (admin). */
  listarAdmin(filtros?: FiltrosPedidoAdmin): Observable<PedidoAdmin[]> {
    let params = new HttpParams();
    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros?.modalidad) {
      params = params.set('modalidad', filtros.modalidad);
    }
    if (filtros?.q) {
      params = params.set('q', filtros.q);
    }
    return this.http
      .get<ApiCollection<PedidoAdmin>>(`${this.base}/admin/pedidos`, { params })
      .pipe(map((res) => res.data));
  }

  /** GET /admin/pedidos/{id} — detalle de pedido (admin). */
  showAdmin(id: number): Observable<PedidoAdmin> {
    return this.http
      .get<ApiResource<PedidoAdmin>>(`${this.base}/admin/pedidos/${id}`)
      .pipe(map((res) => res.data));
  }

  /** POST /admin/pedidos/{id}/estado — cambiar estado de pedido. */
  cambiarEstado(id: number, estado: string, comentario?: string): Observable<PedidoAdmin> {
    const body: CambiarEstadoPayload = { estado: estado as CambiarEstadoPayload['estado'], comentario };
    return this.http
      .post<ApiResource<PedidoAdmin>>(`${this.base}/admin/pedidos/${id}/estado`, body)
      .pipe(map((res) => res.data));
  }

  /**
   * POST /admin/pedidos/{id}/revertir — revertir el pedido a un estado por el que
   * YA paso (el backend valida contra el historial real y resetea `pagado` si
   * corresponde). Devuelve el pedido actualizado.
   */
  revertirEstado(id: number, estado: PedidoEstado): Observable<PedidoAdmin> {
    return this.http
      .post<ApiResource<PedidoAdmin>>(`${this.base}/admin/pedidos/${id}/revertir`, { estado })
      .pipe(map((res) => res.data));
  }

  /** POST /admin/pedidos/{id}/pagar — registrar pago de pedido. */
  registrarPago(id: number): Observable<PedidoAdmin> {
    return this.http
      .post<ApiResource<PedidoAdmin>>(`${this.base}/admin/pedidos/${id}/pagar`, {})
      .pipe(map((res) => res.data));
  }
}
