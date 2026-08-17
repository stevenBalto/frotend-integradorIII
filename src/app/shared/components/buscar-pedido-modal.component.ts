import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { PedidoService } from '../../core/services/pedido.service';
import { Pedido, PedidoPublico } from '../../core/models/pedido.model';
import { PedidoEstado, PEDIDO_ESTADO_LABEL } from '../constants/pedido-estado';
import { MODALIDAD_LABEL } from '../constants/modalidad';
import { CrcCurrencyPipe } from '../pipes/crc-currency.pipe';

/**
 * Modal "Buscar mi pedido" (por codigo), compartido por Home, Carrito y Mi
 * cuenta. Antes cada pantalla tenia su propia copia pegada del estado +
 * logica + template -- con el tiempo se fueron desalineando (Mi cuenta se
 * quedo sin boton de copiar codigo y sin la rama de invitado, Home sin el
 * fallback de portapapeles para http sin TLS) y cada bug habia que
 * corregirlo por separado en cada copia. Un solo componente = un solo lugar
 * para arreglar.
 *
 * Uso: `<app-buscar-pedido-modal #buscarPedido></app-buscar-pedido-modal>`
 * y desde el boton que lo dispara, `(click)="buscarPedido.abrir()"`.
 */
@Component({
  selector: 'app-buscar-pedido-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, CrcCurrencyPipe],
  template: `
    <div class="buscar-modal" *ngIf="abierto">
      <div class="buscar-modal__backdrop" (click)="cerrar()"></div>
      <div class="buscar-modal__panel">
        <div class="buscar-modal__header">
          <h3 class="buscar-modal__title">Buscar mi pedido</h3>
          <button type="button" class="buscar-modal__close" (click)="cerrar()">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>

        <div class="buscar-modal__body">
          <p class="buscar-modal__desc">Ingresá el código de tu pedido para ver su detalle.</p>

          <div class="buscar-modal__inputrow">
            <div class="buscar-modal__inputwrap">
              <input type="text" class="buscar-modal__input"
                placeholder="Ej. ABCD-1234"
                [(ngModel)]="codigoBusqueda"
                (keyup.enter)="buscarMiPedido()" />
              <button type="button" class="buscar-modal__paste" (click)="pegarCodigo()" aria-label="Pegar código">
                <ion-icon name="clipboard-outline"></ion-icon><span>Pegar</span>
              </button>
            </div>
            <button type="button" class="buscar-modal__go"
              *ngIf="codigoBusqueda.trim()"
              [disabled]="buscandoPedido"
              (click)="buscarMiPedido()" aria-label="Buscar pedido">
              <ion-icon name="arrow-forward-circle"></ion-icon>
            </button>
          </div>

          <p *ngIf="buscarError" class="buscar-modal__error">{{ buscarError }}</p>

          <!-- Resultado completo (usuario logueado) -->
          <div class="buscar-resultado" *ngIf="pedidoBuscado">
            <div class="buscar-resultado__head">
              <div class="buscar-resultado__codigo-row">
                <span class="buscar-resultado__codigo">{{ pedidoBuscado.codigo }}</span>
                <button type="button" class="buscar-resultado__copy" (click)="copiarCodigo(pedidoBuscado.codigo)" aria-label="Copiar código">
                  <ion-icon [name]="codigoCopiado ? 'checkmark-outline' : 'copy-outline'"></ion-icon>
                </button>
              </div>
              <span class="buscar-resultado__estado" [ngClass]="getEstadoClass(pedidoBuscado.estado)">
                {{ getEstadoLabel(pedidoBuscado.estado) }}
              </span>
            </div>

            <div class="buscar-resultado__meta">
              <div class="buscar-resultado__meta-row">
                <ion-icon name="person-outline"></ion-icon>
                <span>{{ pedidoBuscado.nombre_cliente || nombreClientePlaceholder }}</span>
              </div>
              <div class="buscar-resultado__meta-row">
                <ion-icon name="time-outline"></ion-icon>
                <span>{{ formatFecha(pedidoBuscado.created_at) }}</span>
              </div>
              <div class="buscar-resultado__meta-row">
                <ion-icon name="storefront-outline"></ion-icon>
                <span>{{ pedidoBuscado.sucursal.nombre }} · {{ MODALIDAD_LABEL[pedidoBuscado.modalidad] }}</span>
              </div>
              <div class="buscar-resultado__meta-row" *ngIf="pedidoBuscado.notas">
                <ion-icon name="chatbubble-outline"></ion-icon>
                <span>"{{ pedidoBuscado.notas }}"</span>
              </div>
            </div>

            <div class="buscar-resultado__items">
              <div class="buscar-resultado__item" *ngFor="let item of pedidoBuscado.items">
                <div class="buscar-resultado__item-main">
                  <span class="buscar-resultado__item-name">
                    {{ item.cantidad }}x {{ item.producto_nombre }}<span *ngIf="item.tamano_nombre"> ({{ item.tamano_nombre }})</span>
                  </span>
                  <span class="buscar-resultado__item-price">{{ item.subtotal | crcCurrency }}</span>
                </div>
                <div class="buscar-resultado__item-extras" *ngIf="item.extras && item.extras.length > 0">
                  <span *ngFor="let e of item.extras; let last = last">+ {{ e.nombre }}{{ last ? '' : ', ' }}</span>
                </div>
              </div>
            </div>

            <div class="buscar-resultado__total">
              <span>Total</span>
              <span>{{ pedidoBuscado.total | crcCurrency }}</span>
            </div>
          </div>

          <!-- Resultado publico (invitado): estado + sucursal + fecha -->
          <div class="buscar-resultado" *ngIf="pedidoBuscadoPublico">
            <div class="buscar-resultado__head">
              <div class="buscar-resultado__codigo-row">
                <span class="buscar-resultado__codigo">{{ pedidoBuscadoPublico.codigo }}</span>
                <button type="button" class="buscar-resultado__copy" (click)="copiarCodigo(pedidoBuscadoPublico.codigo)" aria-label="Copiar código">
                  <ion-icon [name]="codigoCopiado ? 'checkmark-outline' : 'copy-outline'"></ion-icon>
                </button>
              </div>
              <span class="buscar-resultado__estado" [ngClass]="getEstadoClass(pedidoBuscadoPublico.estado)">
                {{ getEstadoLabel(pedidoBuscadoPublico.estado) }}
              </span>
            </div>
            <div class="buscar-resultado__meta">
              <div class="buscar-resultado__meta-row">
                <ion-icon name="time-outline"></ion-icon>
                <span>{{ formatFecha(pedidoBuscadoPublico.creado_en) }}</span>
              </div>
              <div class="buscar-resultado__meta-row">
                <ion-icon name="storefront-outline"></ion-icon>
                <span>{{ pedidoBuscadoPublico.sucursal }} · {{ MODALIDAD_LABEL[pedidoBuscadoPublico.modalidad] }}</span>
              </div>
            </div>
            <p class="buscar-resultado__nota">
              Pediste como invitado. Guardá tu código para seguir el estado de tu pedido.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BuscarPedidoModalComponent {
  private auth = inject(AuthService);
  private pedidoService = inject(PedidoService);
  private toast = inject(ToastController);

  readonly MODALIDAD_LABEL = MODALIDAD_LABEL;

  abierto = false;
  codigoBusqueda = '';
  buscandoPedido = false;
  buscarError: string | null = null;
  pedidoBuscado: Pedido | null = null;
  pedidoBuscadoPublico: PedidoPublico | null = null;

  get esInvitado(): boolean {
    return !this.auth.estaAutenticado;
  }

  get nombreClientePlaceholder(): string {
    return this.auth.usuario?.nombre ?? 'Vos';
  }

  abrir(): void {
    this.abierto = true;
    this.codigoBusqueda = '';
    this.buscarError = null;
    this.pedidoBuscado = null;
    this.pedidoBuscadoPublico = null;
    document.body.classList.add('buscar-modal-open');
  }

  cerrar(): void {
    this.abierto = false;
    document.body.classList.remove('buscar-modal-open');
  }

  /** Pega el codigo desde el portapapeles al input (un toque, sin escribir). */
  async pegarCodigo(): Promise<void> {
    try {
      const texto = (await navigator.clipboard.readText()).trim();
      if (!texto) {
        const t = await this.toast.create({ message: 'El portapapeles está vacío', duration: 1500, position: 'bottom', color: 'medium' });
        await t.present();
        return;
      }
      this.codigoBusqueda = texto;
    } catch {
      const t = await this.toast.create({ message: 'No pudimos leer el portapapeles', duration: 1800, position: 'bottom', color: 'medium' });
      await t.present();
    }
  }

  buscarMiPedido(): void {
    const codigo = this.codigoBusqueda.trim();
    if (!codigo) {
      return;
    }

    this.buscandoPedido = true;
    this.buscarError = null;
    this.pedidoBuscado = null;
    this.pedidoBuscadoPublico = null;

    // Invitado (sin sesion) no puede usar el endpoint autenticado (401): usa la
    // busqueda publica por codigo, que devuelve estado/sucursal/fecha del pedido.
    if (this.esInvitado) {
      this.pedidoService.buscarPorCodigo(codigo).subscribe({
        next: (pedido) => {
          this.pedidoBuscadoPublico = pedido;
          this.buscandoPedido = false;
        },
        error: (err) => {
          this.buscarError = err?.error?.message || 'No encontramos un pedido con ese código.';
          this.buscandoPedido = false;
        },
      });
      return;
    }

    this.pedidoService.buscarPropioPorCodigo(codigo).subscribe({
      next: (pedido) => {
        this.pedidoBuscado = pedido;
        this.buscandoPedido = false;
      },
      error: (err) => {
        this.buscarError = err?.error?.message || 'No encontramos un pedido con ese código a tu nombre.';
        this.buscandoPedido = false;
      },
    });
  }

  getEstadoLabel(estado: PedidoEstado): string {
    return PEDIDO_ESTADO_LABEL[estado] || estado;
  }

  getEstadoClass(estado: PedidoEstado): string {
    const clases: Record<PedidoEstado, string> = {
      pendiente: 'estado--pendiente',
      en_proceso: 'estado--proceso',
      listo: 'estado--listo',
      entregado: 'estado--entregado',
      cancelado: 'estado--cancelado',
    };
    return clases[estado] || '';
  }

  formatFecha(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Feedback visual del boton copiar (icono cambia a check un instante). */
  codigoCopiado = false;

  /**
   * Copia al portapapeles con fallback. navigator.clipboard SOLO existe en
   * contexto seguro (https/localhost); en el telefono por LAN (http://IP) no
   * esta, asi que caemos a textarea + execCommand('copy').
   */
  private escribirPortapapeles(texto: string): boolean {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).catch(() => this.copiarLegacy(texto));
      return true;
    }
    return this.copiarLegacy(texto);
  }

  private copiarLegacy(texto: string): boolean {
    try {
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, texto.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  async copiarCodigo(codigo: string): Promise<void> {
    const ok = this.escribirPortapapeles(codigo);
    if (ok) {
      this.codigoCopiado = true;
      setTimeout(() => { this.codigoCopiado = false; }, 1600);
    }
    const t = await this.toast.create({
      message: ok ? 'Código copiado' : 'No se pudo copiar',
      duration: 1300,
      position: 'bottom',
      color: ok ? 'success' : 'medium',
    });
    await t.present();
  }
}
