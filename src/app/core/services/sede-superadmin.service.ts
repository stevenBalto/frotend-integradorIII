import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiCollection, ApiResource } from '../models/producto.model';
import {
  CrearSucursalPayload,
  CredencialesSede,
  Sucursal,
  SucursalCreada,
  SucursalPayload,
} from '../models/sucursal.model';

/**
 * Sedes gestionadas desde el panel de SUPERADMIN (/superadmin/sedes).
 *
 * Va aparte de SucursalService porque usa la sesión aislada de superadmin: el
 * interceptor elige el token según la ruta, y estas rutas llevan el prefijo
 * /superadmin/. Las sedes que crea comparten menú, precios y clientes con el
 * resto del negocio; solo se separan sus pedidos.
 */
@Injectable({ providedIn: 'root' })
export class SedeSuperadminService {
  private http = inject(HttpClient);

  private readonly base = environment.apiBaseUrl;

  /** GET /superadmin/sedes */
  listar(): Observable<Sucursal[]> {
    return this.http
      .get<ApiCollection<Sucursal>>(`${this.base}/superadmin/sedes`)
      .pipe(map((res) => res.data));
  }

  /**
   * POST /superadmin/sedes — crea la sede y su administrador.
   * Las credenciales vienen UNA sola vez: en la BD solo queda el hash.
   */
  crear(payload: CrearSucursalPayload): Observable<SucursalCreada> {
    return this.http
      .post<ApiResource<Sucursal> & { credenciales: CredencialesSede }>(
        `${this.base}/superadmin/sedes`,
        payload,
      )
      .pipe(map((res) => ({ sucursal: res.data, credenciales: res.credenciales })));
  }

  /** PUT /superadmin/sedes/{id} */
  actualizar(id: number, payload: SucursalPayload): Observable<Sucursal> {
    return this.http
      .put<ApiResource<Sucursal>>(`${this.base}/superadmin/sedes/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  /**
   * POST /superadmin/sedes/{id}/estado — cierra o reabre la sede.
   *
   * Cerrar no borra nada: sale del selector del cliente y deja de recibir
   * pedidos, pero conserva su historial y sus administradores siguen entrando
   * en modo solo lectura. Reabrirla lo devuelve todo a la normalidad.
   */
  cambiarEstado(id: number, activa: boolean): Observable<Sucursal> {
    return this.http
      .post<ApiResource<Sucursal>>(`${this.base}/superadmin/sedes/${id}/estado`, { activa })
      .pipe(map((res) => res.data));
  }
}
