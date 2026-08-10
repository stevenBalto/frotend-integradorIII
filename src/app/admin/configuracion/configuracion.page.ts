import { Component, OnInit, inject } from '@angular/core';
import { ConfiguracionService, AjustesConfig } from '../../core/services/configuracion.service';

/**
 * Configuración general del panel, real y por instancia (GET/PUT
 * /admin/configuracion). El toggle "Nuevos pedidos" controla de verdad la
 * notificación de pedido nuevo.
 *
 * Nota: las sucursales NO se gestionan aquí. Cada instancia = una cuenta/sucursal
 * y se crean desde el panel de Superadministración (módulo Instancias).
 */
@Component({
  selector: 'app-admin-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: false,
})
export class AdminConfiguracionPage implements OnInit {
  private configuracionService = inject(ConfiguracionService);

  ajustes: AjustesConfig = {
    negocio_nombre: '',
    negocio_telefono: '',
    negocio_direccion: '',
    negocio_sitio_web: '',
    negocio_maps_url: '',
    pedidos_activos: true,
    modalidad_comer_aqui: true,
    modalidad_para_llevar: true,
    pedido_monto_minimo: 0,
    horario_activo: true,
    horario_apertura: '11:00',
    horario_cierre: '22:00',
    cerrado_temporalmente: false,
    roosters_activo: true,
    roosters_porcentaje: 5,
    resenas_moderacion: false,
    resenas_umbral_destacado: 4,
    notif_nuevos_pedidos: true,
    notif_resenas_nuevas: true,
    notif_stock_bajo: true,
    notif_producto_nuevo: true,
    notif_cliente_nuevo: true,
    notif_usuario_nuevo: true,
  };
  cargandoAjustes = false;
  guardandoAjustes = false;
  ajustesError: string | null = null;
  ajustesGuardado = false;

  ngOnInit(): void {
    this.cargarAjustes();
  }

  cargarAjustes(): void {
    this.cargandoAjustes = true;
    this.ajustesError = null;
    this.configuracionService.obtener().subscribe({
      next: (a) => {
        this.ajustes = a;
        this.cargandoAjustes = false;
      },
      error: () => {
        this.ajustesError = 'No se pudo cargar la configuración.';
        this.cargandoAjustes = false;
      },
    });
  }

  guardarAjustes(): void {
    this.guardandoAjustes = true;
    this.ajustesError = null;
    this.ajustesGuardado = false;
    this.configuracionService.guardar(this.ajustes).subscribe({
      next: (a) => {
        this.ajustes = a;
        this.guardandoAjustes = false;
        this.ajustesGuardado = true;
        setTimeout(() => (this.ajustesGuardado = false), 2500);
      },
      error: () => {
        this.ajustesError = 'No se pudieron guardar los cambios.';
        this.guardandoAjustes = false;
      },
    });
  }

  /** Claves booleanas de los ajustes (las que se muestran como interruptor). */
  private static readonly BOOLEANAS = [
    'pedidos_activos', 'modalidad_comer_aqui', 'modalidad_para_llevar',
    'horario_activo', 'cerrado_temporalmente', 'roosters_activo', 'resenas_moderacion',
    'notif_nuevos_pedidos', 'notif_resenas_nuevas', 'notif_stock_bajo',
    'notif_producto_nuevo', 'notif_cliente_nuevo', 'notif_usuario_nuevo',
  ] as const;

  /** Alterna cualquier ajuste booleano (operación, horario, roosters, notificaciones). */
  toggle(clave: (typeof AdminConfiguracionPage.BOOLEANAS)[number]): void {
    this.ajustes[clave] = !this.ajustes[clave];
  }

  /**
   * Estado actual del negocio según los ajustes (lo mismo que valida el backend
   * al recibir un pedido), para que el admin vea el efecto real de lo que activa.
   */
  get estadoNegocio(): { abierto: boolean; texto: string } {
    if (!this.ajustes.pedidos_activos) {
      return { abierto: false, texto: 'No se están recibiendo pedidos' };
    }
    if (this.ajustes.cerrado_temporalmente) {
      return { abierto: false, texto: 'Cerrado temporalmente' };
    }
    if (this.ajustes.horario_activo && this.ajustes.horario_apertura && this.ajustes.horario_cierre) {
      const ahora = new Date();
      const hhmm = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
      const { horario_apertura: ap, horario_cierre: ci } = this.ajustes;
      const dentro = ap <= ci ? (hhmm >= ap && hhmm <= ci) : (hhmm >= ap || hhmm <= ci);
      if (!dentro) {
        return { abierto: false, texto: `Fuera de horario (${ap} a ${ci})` };
      }
    }
    return { abierto: true, texto: 'Abierto · recibiendo pedidos' };
  }
}
