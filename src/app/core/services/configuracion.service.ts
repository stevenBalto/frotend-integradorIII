import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Ajustes generales del panel admin (por instancia). */
export interface AjustesConfig {
  // Información del negocio (alimenta la pantalla Restaurantes del cliente)
  negocio_nombre: string;
  negocio_telefono: string;
  negocio_direccion: string;
  negocio_sitio_web: string;
  negocio_maps_url: string;

  // Operación: controlan de verdad si se puede pedir y cómo
  pedidos_activos: boolean;
  modalidad_comer_aqui: boolean;
  modalidad_para_llevar: boolean;
  pedido_monto_minimo: number;

  // Horario: si está activo, fuera de rango no se aceptan pedidos
  horario_activo: boolean;
  horario_apertura: string;
  horario_cierre: string;
  cerrado_temporalmente: boolean;

  // Programa de Roosters (puntos)
  roosters_activo: boolean;
  roosters_porcentaje: number;

  // Reseñas
  resenas_moderacion: boolean;
  resenas_umbral_destacado: number;

  // Notificaciones (un interruptor por evento del módulo)
  notif_nuevos_pedidos: boolean;
  notif_resenas_nuevas: boolean;
  notif_stock_bajo: boolean;
  notif_producto_nuevo: boolean;
  notif_cliente_nuevo: boolean;
  notif_usuario_nuevo: boolean;
}

/**
 * Restaurante que ve el cliente: una entrada por sucursal (instancia) activa,
 * armada con la "Información del negocio" que cada una configuró.
 */
export interface Restaurante {
  instancia_id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  sitio_web: string | null;
  maps_url: string | null;
}

/** Configuración general del panel (GET/PUT /admin/configuracion). */
@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private http = inject(HttpClient);

  private readonly base = environment.apiBaseUrl;

  /** GET /restaurantes — público. Lista dinámica para la app cliente. */
  listarRestaurantes(): Observable<Restaurante[]> {
    return this.http
      .get<{ data: Restaurante[] }>(`${this.base}/restaurantes`)
      .pipe(map((res) => res.data));
  }

  obtener(): Observable<AjustesConfig> {
    return this.http
      .get<{ data: AjustesConfig }>(`${this.base}/admin/configuracion`)
      .pipe(map((res) => res.data));
  }

  guardar(ajustes: AjustesConfig): Observable<AjustesConfig> {
    return this.http
      .put<{ data: AjustesConfig }>(`${this.base}/admin/configuracion`, ajustes)
      .pipe(map((res) => res.data));
  }
}
