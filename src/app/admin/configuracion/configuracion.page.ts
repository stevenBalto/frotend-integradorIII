import { Component, OnInit } from '@angular/core';
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
  ajustes: AjustesConfig = {
    negocio_nombre: '',
    negocio_telefono: '',
    negocio_direccion: '',
    negocio_sitio_web: '',
    horario_apertura: '',
    horario_cierre: '',
    iva_porcentaje: 13,
    notif_nuevos_pedidos: true,
    notif_resenas_nuevas: true,
    notif_stock_bajo: true,
  };
  cargandoAjustes = false;
  guardandoAjustes = false;
  ajustesError: string | null = null;
  ajustesGuardado = false;

  constructor(private configuracionService: ConfiguracionService) {}

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

  toggleNotif(clave: 'notif_nuevos_pedidos' | 'notif_resenas_nuevas' | 'notif_stock_bajo'): void {
    this.ajustes[clave] = !this.ajustes[clave];
  }
}
