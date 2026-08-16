import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  RegistrationError,
  Token,
} from '@capacitor/push-notifications';
import { environment } from '../../../environments/environment';

/** Clave del push token en sessionStorage (mismo mecanismo que TokenStorageService). */
const PUSH_TOKEN_KEY = 'push_token';

/**
 * Plataforma que espera el backend. Hoy solo se compila Android (`npx cap add android`);
 * si algun dia se agrega iOS hay que derivarla de `Capacitor.getPlatform()` y ampliar
 * la validacion del endpoint.
 */
const PLATAFORMA = 'android' as const;

/** Ruta del cliente donde vive el detalle de un pedido (se expande dentro de la lista). */
const RUTA_MIS_PEDIDOS = '/mis-pedidos';

/**
 * Notificaciones push (FCM) de la app CLIENTE.
 *
 * Solo funciona en la app nativa instalada: en el navegador (`ionic serve`) todos
 * los metodos salen sin hacer nada, porque el plugin no existe ahi.
 *
 * Ciclo de vida: `inicializar()` al entrar un cliente con sesion (login) y
 * `desregistrar()` al cerrar sesion, para dejar de mandarle pushes a un telefono
 * donde ya nadie esta logueado.
 *
 * Ningun error rompe la app: todo se loggea y se sigue. Un push que falla no puede
 * impedir que alguien entre o salga de su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly base = environment.apiBaseUrl;

  /** Ultimo token entregado por FCM. Se necesita para poder darlo de baja en el logout. */
  private tokenActual: string | null = null;

  /** Los listeners se enganchan una sola vez por sesion (addListener duplicaria los handlers). */
  private listenersListos = false;

  /**
   * Pide permiso, registra el dispositivo en FCM y manda el token al backend.
   * Idempotente: llamarlo dos veces no duplica listeners.
   */
  async inicializar(): Promise<void> {
    // Los push solo existen en la app nativa instalada; en el navegador no hay nada que hacer.
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Los listeners van ANTES de register(): el evento 'registration' puede llegar
      // enseguida y si todavia no hay handler se pierde el token.
      if (!this.listenersListos) {
        await this.registrarListeners();
        this.listenersListos = true;
      }

      const permiso = await PushNotifications.requestPermissions();
      if (permiso.receive !== 'granted') {
        console.warn('[Push] Permiso de notificaciones no concedido:', permiso.receive);
        return;
      }

      await PushNotifications.register();
    } catch (error) {
      console.error('[Push] No se pudo inicializar el servicio de notificaciones:', error);
    }
  }

  /**
   * Da de baja este dispositivo en el backend. Se llama en el logout ANTES de limpiar
   * la sesion: el endpoint es privado y necesita el Bearer todavia vivo.
   */
  async desregistrar(): Promise<void> {
    const token = this.tokenActual ?? sessionStorage.getItem(PUSH_TOKEN_KEY);

    // Se olvida localmente pase lo que pase con el backend, para no reusar un token
    // que ya no corresponde a la sesion que se esta cerrando.
    this.tokenActual = null;
    sessionStorage.removeItem(PUSH_TOKEN_KEY);

    if (!Capacitor.isNativePlatform() || !token) {
      return;
    }

    try {
      await firstValueFrom(this.http.delete(`${this.base}/push/token`, { body: { token } }));
    } catch (error) {
      console.error('[Push] No se pudo dar de baja el token en el backend:', error);
    }

    try {
      await PushNotifications.removeAllListeners();
      this.listenersListos = false;
    } catch (error) {
      console.error('[Push] No se pudieron soltar los listeners:', error);
    }
  }

  // ── Listeners del plugin ────────────────────────────────────────────────────

  private async registrarListeners(): Promise<void> {
    // FCM entrego el token del dispositivo -> se guarda y se manda al backend.
    await PushNotifications.addListener('registration', (token: Token) => {
      this.tokenActual = token.value;
      sessionStorage.setItem(PUSH_TOKEN_KEY, token.value);
      void this.enviarTokenAlBackend(token.value);
    });

    // No se pudo registrar (sin Google Play Services, sin red, config de FCM mal).
    await PushNotifications.addListener('registrationError', (error: RegistrationError) => {
      console.error('[Push] Error registrando el dispositivo en FCM:', error.error);
    });

    // Llego un push con la app abierta. Por ahora solo se loggea: Android no muestra
    // la notificacion del sistema en primer plano y todavia no hay UI propia para esto.
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notificacion: PushNotificationSchema) => {
        console.log('[Push] Notificacion recibida en primer plano:', notificacion);
      },
    );

    // El usuario toco la notificacion -> si trae un pedido, se abre ese pedido.
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (accion: ActionPerformed) => {
        const pedidoId = this.leerPedidoId(accion.notification?.data);
        if (pedidoId === null) {
          void this.router.navigateByUrl(RUTA_MIS_PEDIDOS);
          return;
        }
        void this.router.navigate([RUTA_MIS_PEDIDOS], { queryParams: { pedido: pedidoId } });
      },
    );
  }

  // ── Auxiliares ──────────────────────────────────────────────────────────────

  private async enviarTokenAlBackend(token: string): Promise<void> {
    try {
      // El Bearer lo pone AuthInterceptor, igual que en cualquier otro servicio.
      await firstValueFrom(
        this.http.post(`${this.base}/push/token`, { token, plataforma: PLATAFORMA }),
      );
    } catch (error) {
      console.error('[Push] No se pudo guardar el token en el backend:', error);
    }
  }

  /**
   * Saca el id de pedido del payload. FCM manda el `data` como strings, y segun quien
   * arme el push la clave puede venir en snake_case o camelCase.
   */
  private leerPedidoId(data: unknown): number | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const payload = data as Record<string, unknown>;
    const crudo = payload['pedido_id'] ?? payload['pedidoId'] ?? payload['pedido'];
    if (crudo === undefined || crudo === null || crudo === '') {
      return null;
    }

    const id = Number(crudo);
    return Number.isInteger(id) && id > 0 ? id : null;
  }
}
