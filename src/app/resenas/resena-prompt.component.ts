import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { ResenaService } from '../core/services/resena.service';
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
 * - Cerrar por el backdrop = "ahora no" (vuelve a pedir la próxima vez).
 * - Botón "No volver a pedir" = descarta ese pedido (deja de insistir).
 * - "Enviar" = registra las reseñas.
 */
@Component({
  selector: 'app-resena-prompt',
  templateUrl: './resena-prompt.component.html',
  styleUrls: ['./resena-prompt.component.scss'],
  standalone: false,
})
export class ResenaPromptComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

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
  ) {}

  ngOnInit(): void {
    this.resenaService.pendientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lista) => {
          this.pendientes = lista ?? [];
          if (this.pendientes.length > 0) {
            this.abrir(0);
          }
        },
        error: () => { /* sin sesión o error: no molestamos */ },
      });
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

  /** "No volver a pedir": descarta este pedido (deja de insistir). */
  descartar(): void {
    if (!this.actual || this.enviando) {
      return;
    }
    const id = this.actual.pedido_id;
    this.resenaService.descartar(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => this.siguiente(), error: () => this.siguiente() });
  }

  /** Cierre por backdrop: "ahora no", se volverá a pedir la próxima vez. */
  ahoraNo(): void {
    this.isOpen = false;
  }

  private siguiente(): void {
    const next = this.indice + 1;
    if (next < this.pendientes.length) {
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
