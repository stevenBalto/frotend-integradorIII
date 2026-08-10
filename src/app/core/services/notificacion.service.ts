import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, Subscription, timer, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResource } from '../models/producto.model';
import {
  Notificacion,
  NotificacionesRespuesta,
} from '../models/notificacion.model';

/**
 * Notificaciones del panel admin.
 *
 * "Tiempo real" resuelto por POLLING: cada INTERVALO_MS se consulta el backend
 * y se emiten (a) el contador de no leidas -> badge del sidebar y (b) las
 * notificaciones NUEVAS desde el ultimo sondeo -> toasts globales.
 *
 * TRANSPORTE INTERCAMBIABLE: la UI (badge/toast/lista) solo consume los
 * observables `noLeidas$`, `notificaciones$` y `nuevas$`. Si algun dia se sube a
 * producexion con WebSockets (Laravel Reverb/Echo) o SSE, se reemplaza SOLO el
 * metodo `iniciarPolling()` por la suscripcion al socket alimentando los MISMOS
 * subjects — sin tocar el sidebar ni la pantalla.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private http = inject(HttpClient);

  private readonly base = environment.apiBaseUrl;

  /** Cada cuanto se sondea (ms). 15s: imperceptible para avisar de un pedido. */
  private readonly INTERVALO_MS = 15000;

  private readonly _noLeidas$ = new BehaviorSubject<number>(0);
  private readonly _notificaciones$ = new BehaviorSubject<Notificacion[]>([]);
  private readonly _nuevas$ = new Subject<Notificacion[]>();

  /** Contador de no leidas (para el badge). */
  readonly noLeidas$ = this._noLeidas$.asObservable();
  /** Lista completa mas reciente (para la pantalla de notificaciones). */
  readonly notificaciones$ = this._notificaciones$.asObservable();
  /** Notificaciones recien llegadas desde el ultimo sondeo (para toasts). */
  readonly nuevas$ = this._nuevas$.asObservable();

  private pollingSub?: Subscription;
  /** IDs ya vistos: para no volver a "toastear" lo mismo en cada sondeo. */
  private idsVistos = new Set<number>();
  /** True hasta el primer sondeo: evita un aluvion de toasts al abrir el panel. */
  private primerSondeo = true;

  // ── Transporte (hoy: polling) ─────────────────────────────────────────────

  /** Arranca el sondeo. Idempotente: si ya corre, no duplica. */
  iniciarPolling(): void {
    if (this.pollingSub) {
      return;
    }
    this.primerSondeo = true;
    this.idsVistos.clear();

    this.pollingSub = timer(0, this.INTERVALO_MS)
      .pipe(
        switchMap(() =>
          this.http
            .get<NotificacionesRespuesta>(`${this.base}/admin/notificaciones`)
            .pipe(catchError(() => of<NotificacionesRespuesta | null>(null))),
        ),
      )
      .subscribe((res) => {
        if (res) {
          this.procesarSondeo(res);
        }
      });
  }

  /** Detiene el sondeo (al salir del panel admin / logout). */
  detenerPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;
  }

  private procesarSondeo(res: NotificacionesRespuesta): void {
    const lista = res.data ?? [];
    this._notificaciones$.next(lista);
    this._noLeidas$.next(res.meta?.no_leidas ?? 0);

    // Detectar las nuevas (no vistas todavia y no leidas) para el toast.
    const nuevas = lista.filter((n) => !n.leida && !this.idsVistos.has(n.id));
    lista.forEach((n) => this.idsVistos.add(n.id));

    // En el primer sondeo NO toasteamos el historial ya existente.
    if (!this.primerSondeo && nuevas.length > 0) {
      this._nuevas$.next(nuevas);
    }
    this.primerSondeo = false;
  }

  /** Fuerza un refresco inmediato (ej. tras marcar leidas). */
  refrescar(): Observable<Notificacion[]> {
    return this.http
      .get<NotificacionesRespuesta>(`${this.base}/admin/notificaciones`)
      .pipe(
        map((res) => {
          this._notificaciones$.next(res.data ?? []);
          this._noLeidas$.next(res.meta?.no_leidas ?? 0);
          (res.data ?? []).forEach((n) => this.idsVistos.add(n.id));
          return res.data ?? [];
        }),
      );
  }

  // ── Acciones ──────────────────────────────────────────────────────────────

  marcarLeida(id: number): Observable<Notificacion> {
    return this.http
      .post<ApiResource<Notificacion>>(`${this.base}/admin/notificaciones/${id}/leer`, {})
      .pipe(map((res) => res.data));
  }

  marcarTodasLeidas(): Observable<number> {
    return this.http
      .post<{ cambiadas: number }>(`${this.base}/admin/notificaciones/leer-todas`, {})
      .pipe(map((res) => res.cambiadas));
  }

  /** Elimina una notificación y actualiza la lista + contador en memoria. */
  eliminar(id: number): Observable<void> {
    return this.http
      .delete<{ eliminada: boolean }>(`${this.base}/admin/notificaciones/${id}`)
      .pipe(
        map(() => {
          const lista = this._notificaciones$.value.filter((n) => n.id !== id);
          this._notificaciones$.next(lista);
          this._noLeidas$.next(lista.filter((n) => !n.leida).length);
          this.idsVistos.delete(id);
        }),
      );
  }

  /** Borra TODAS las notificaciones y limpia la lista + contador en memoria. */
  eliminarTodas(): Observable<number> {
    return this.http
      .delete<{ eliminadas: number }>(`${this.base}/admin/notificaciones`)
      .pipe(
        map((res) => {
          this._notificaciones$.next([]);
          this._noLeidas$.next(0);
          this.idsVistos.clear();
          return res.eliminadas;
        }),
      );
  }
}
