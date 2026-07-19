import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResource } from '../models/producto.model';
import { HomeConfig } from '../models/home-config.model';

/** Consumo de ajustes de curacion del Home (oferta destacada). */
@Injectable({ providedIn: 'root' })
export class HomeConfigService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /** GET /home-config — publico, lo consume el Home del cliente. */
  obtener(): Observable<HomeConfig> {
    return this.http
      .get<ApiResource<HomeConfig>>(`${this.base}/home-config`)
      .pipe(map((res) => res.data));
  }

  /** PUT /admin/home-config */
  actualizar(ofertaHeroId: number | null): Observable<HomeConfig> {
    return this.http
      .put<ApiResource<HomeConfig>>(`${this.base}/admin/home-config`, { oferta_hero_id: ofertaHeroId })
      .pipe(map((res) => res.data));
  }
}
