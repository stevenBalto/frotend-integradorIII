import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, ApiResource } from '../models/producto.model';
import {
  Insumo,
  InsumoMovimiento,
  InsumoPayload,
  TomaFisicaPayload,
  TomaFisicaResultado,
} from '../models/insumo.model';

/** Consumo del inventario de insumos/ingredientes (panel admin). */
@Injectable({ providedIn: 'root' })
export class InsumoService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /** GET /admin/insumos — listado completo. */
  listarTodos(): Observable<Insumo[]> {
    return this.http
      .get<ApiCollection<Insumo>>(`${this.base}/admin/insumos`)
      .pipe(map((res) => res.data));
  }

  /** GET /admin/insumos/{id} — detalle de un insumo. */
  buscarPorId(id: number): Observable<Insumo> {
    return this.http
      .get<ApiResource<Insumo>>(`${this.base}/admin/insumos/${id}`)
      .pipe(map((res) => res.data));
  }

  /** POST /admin/insumos — crear insumo (incluye cantidad inicial). */
  crear(payload: InsumoPayload): Observable<Insumo> {
    return this.http
      .post<ApiResource<Insumo>>(`${this.base}/admin/insumos`, payload)
      .pipe(map((res) => res.data));
  }

  /** PUT /admin/insumos/{id} — actualizar insumo (SIN cantidad_actual). */
  actualizar(id: number, payload: InsumoPayload): Observable<Insumo> {
    return this.http
      .put<ApiResource<Insumo>>(`${this.base}/admin/insumos/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  /** DELETE /admin/insumos/{id} — eliminar insumo. */
  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/insumos/${id}`);
  }

  /** POST /admin/insumos/{id}/toma-fisica — registrar conteo fisico + auditoria. */
  registrarTomaFisica(id: number, payload: TomaFisicaPayload): Observable<TomaFisicaResultado> {
    return this.http
      .post<ApiResource<TomaFisicaResultado>>(`${this.base}/admin/insumos/${id}/toma-fisica`, payload)
      .pipe(map((res) => res.data));
  }

  /** GET /admin/insumos/{id}/movimientos — historial de movimientos. */
  listarMovimientos(id: number): Observable<InsumoMovimiento[]> {
    return this.http
      .get<ApiCollection<InsumoMovimiento>>(`${this.base}/admin/insumos/${id}/movimientos`)
      .pipe(map((res) => res.data));
  }
}
