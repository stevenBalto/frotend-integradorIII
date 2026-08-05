import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Subject, takeUntil, timer, switchMap, filter } from 'rxjs';
import { ResenaService } from '../core/services/resena.service';
import { AuthService } from '../core/services/auth.service';
import {
  PendienteResena,
  EnviarResenaPayload,
} from '../core/models/resena.model';

interface ProductoForm {
  producto_id: number;
  nombre: string;
  ya_resenado: boolean;
  calificacion: number;
  comentario: string;
}

/**
 * Re-prompt de reseña estilo Uber: al entrar a la app, si el cliente tiene un
 * pedido entregado sin reseñar (y no descartado), le pide calificar la
 * experiencia (general) y los productos. Vive en el shell de tabs, así aparece
 * en cualquier pantalla del cliente.
 *
 * - Cerrar por el backdrop = "ahora no" (no re-aparece hasta el próximo ingreso).
 * - Botón "No enviar reseña" = descarta ese pedido (deja de insistir).
 * - "Enviar" = registra las reseñas.
 * Solo para clientes registrados; se sondea en vivo para aparecer al pagarse el pedido.
 */
@Component({
  selector: 'app-resena-prompt',
  templateUrl: './resena-prompt.component.html',
  styleUrls: ['./resena-prompt.component.scss'],
  standalone: false,
})
export class ResenaPromptComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly POLL_MS = 25000;
  private descartadosSesion = new Set<number>();

  readonly estrellas = [1, 2, 3, 4, 5];

  pendientes: PendienteResena[] = [];
  indice = 0;
  isOpen = false;
  enviando = false;

  // Formulario del pedido actual
  generalCalificacion = 0;
  generalComentario = '';
  productos: ProductoForm[] = [];

  constructor(
    private resenaService: ResenaService,
    private toastCtrl: ToastController,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    // Las reseñas se piden SOLO a clientes registrados; los invitados nunca reciben
    // el prompt. Polling suave: si un pedido pasa a Pagado mientras la app está
    // abierta, el prompt aparece sin necesidad de refrescar (item 27, "tiempo real").
    timer(0, this.POLL_MS)
      .pipe(
        filter(() => this.auth.estaAutenticado),
        switchMap(() => this.resenaService.pendientes()),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (lista) => {
          this.pendientes = lista ?? [];
          this.abrirSiHayNuevo();
        },
        error: () => { /* sin sesión o error: no molestamos */ },
      });
  }

  /** Abre el prompt para el primer pedido pendiente no descartado en esta sesión. */
  private abrirSiHayNuevo(): void {
    if (this.isOpen || this.enviando) {
      return;
    }
    const i = this.pendientes.findIndex((p) => !this.descartadosSesion.has(p.pedido_id));
    if (i >= 0) {
      this.abrir(i);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get actual(): PendienteResena | null {
    return this.pendientes[this.indice] ?? null;
  }

  private abrir(i: number): void {
    this.indice = i;
    const p = this.pendientes[i];
    if (!p) {
      this.isOpen = false;
      return;
    }
    this.generalCalificacion = 0;
    this.generalComentario = '';
    this.productos = p.productos.map((pr) => ({
      producto_id: pr.producto_id,
      nombre: pr.nombre,
      ya_resenado: pr.ya_resenado,
      calificacion: 0,
      comentario: '',
    }));
    this.isOpen = true;
  }

  setGeneral(star: number): void {
    this.generalCalificacion = star;
  }

  setProducto(prod: ProductoForm, star: number): void {
    prod.calificacion = star;
  }

  /** Hay algo para enviar: general calificado o al menos un producto calificado. */
  get puedeEnviar(): boolean {
    return this.generalCalificacion > 0 || this.productos.some((p) => p.calificacion > 0);
  }

  enviar(): void {
    if (!this.actual || !this.puedeEnviar || this.enviando) {
      return;
    }
    this.enviando = true;

    const payload: EnviarResenaPayload = {};
    if (this.generalCalificacion > 0) {
      payload.general = {
        calificacion: this.generalCalificacion,
        comentario: this.generalComentario.trim() || null,
      };
    }
    const prods = this.productos
      .filter((p) => !p.ya_resenado && p.calificacion > 0)
      .map((p) => ({
        producto_id: p.producto_id,
        calificacion: p.calificacion,
        comentario: p.comentario.trim() || null,
      }));
    if (prods.length > 0) {
      payload.productos = prods;
    }

    this.resenaService.enviar(this.actual.pedido_id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.enviando = false;
          void this.toast('¡Gracias por tu reseña!');
          this.siguiente();
        },
        error: () => {
          this.enviando = false;
          void this.toast('No se pudo enviar la reseña.', true);
        },
      });
  }

  /** "No enviar reseña": descarta este pedido (deja de insistir). */
  descartar(): void {
    if (!this.actual || this.enviando) {
      return;
    }
    const id = this.actual.pedido_id;
    this.resenaService.descartar(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => this.siguiente(), error: () => this.siguiente() });
  }

  /** Cierre por backdrop: "ahora no". No re-aparece este pedido hasta el próximo ingreso. */
  ahoraNo(): void {
    if (this.actual) {
      this.descartadosSesion.add(this.actual.pedido_id);
    }
    this.isOpen = false;
  }

  private siguiente(): void {
    const next = this.pendientes.findIndex((p, idx) => idx > this.indice && !this.descartadosSesion.has(p.pedido_id));
    if (next >= 0) {
      this.abrir(next);
    } else {
      this.isOpen = false;
    }
  }

  private async toast(msg: string, error = false): Promise<void> {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2200,
      position: 'top',
      color: error ? 'danger' : 'success',
    });
    await t.present();
  }
}
