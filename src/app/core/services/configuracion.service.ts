import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Ajustes generales del panel admin (por instancia). */
export interface AjustesConfig {
  negocio_nombre: string;
  negocio_telefono: string;
  negocio_direccion: string;
  negocio_sitio_web: string;
  horario_apertura: string;
  horario_cierre: string;
  iva_porcentaje: number;
  notif_nuevos_pedidos: boolean;
  notif_resenas_nuevas: boolean;
  notif_stock_bajo: boolean;
}

/** Configuración general del panel (GET/PUT /admin/configuracion). */
@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

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
