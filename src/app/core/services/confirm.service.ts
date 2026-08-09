import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject,
} from '@angular/core';
import { ConfirmDialogComponent, ConfirmTono } from '../../shared/components/confirm-dialog.component';

export interface ConfirmOpciones {
  titulo: string;
  mensaje?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  tono?: ConfirmTono;
  icono?: string;
}

/**
 * Reemplazo de `window.confirm()` / `window.alert()` con un dialogo propio,
 * centrado en pantalla y con los colores de la marca.
 *
 * Ademas del tema visual, resuelve un bug concreto: **Chrome sale del fullscreen
 * al abrir un dialogo nativo de JS**. En Pedidos, el modo extendido escucha
 * `fullscreenchange` para cerrarse, asi que cada `window.confirm()` lo expulsaba
 * del modo. Un dialogo dentro del documento no toca el fullscreen.
 *
 * Se monta a mano (`createComponent`) en vez de ponerlo en cada template para
 * que las paginas lo usen como una funcion normal, sin tocar su HTML:
 *
 *   if (!(await this.confirm.preguntar({ titulo: '¿Eliminar?' }))) { return; }
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);

  /** Dialogo abierto, si hay. Evita apilar dos por doble click. */
  private abierto?: ComponentRef<ConfirmDialogComponent>;

  /** Pregunta si/no. Resuelve `true` solo si el usuario confirmo. */
  preguntar(opciones: ConfirmOpciones): Promise<boolean> {
    return this.montar({ ...opciones, soloAceptar: false });
  }

  /** Aviso de un solo boton (reemplaza `window.alert`). Resuelve al aceptar. */
  avisar(opciones: ConfirmOpciones): Promise<boolean> {
    return this.montar({
      icono: 'information-circle-outline',
      textoConfirmar: 'Entendido',
      ...opciones,
      soloAceptar: true,
    });
  }

  private montar(opciones: ConfirmOpciones & { soloAceptar: boolean }): Promise<boolean> {
    // Si ya hay uno abierto, no apilamos: gana el que estaba.
    if (this.abierto) {
      return Promise.resolve(false);
    }

    const host = document.createElement('div');
    document.body.appendChild(host);

    const ref = createComponent(ConfirmDialogComponent, {
      environmentInjector: this.envInjector,
      hostElement: host,
    });
    this.abierto = ref;

    ref.setInput('titulo', opciones.titulo);
    ref.setInput('mensaje', opciones.mensaje ?? '');
    ref.setInput('soloAceptar', opciones.soloAceptar);
    ref.setInput('tono', opciones.tono ?? 'normal');
    if (opciones.textoConfirmar) {
      ref.setInput('textoConfirmar', opciones.textoConfirmar);
    }
    if (opciones.textoCancelar) {
      ref.setInput('textoCancelar', opciones.textoCancelar);
    }
    if (opciones.icono) {
      ref.setInput('icono', opciones.icono);
    }

    this.appRef.attachView(ref.hostView);

    return new Promise<boolean>((resolve) => {
      const sub = ref.instance.resolver.subscribe((valor: boolean) => {
        sub.unsubscribe();
        // Se espera a que corra la animacion de salida antes de desmontar.
        setTimeout(() => this.desmontar(ref), 140);
        resolve(valor);
      });
    });
  }

  private desmontar(ref: ComponentRef<ConfirmDialogComponent>): void {
    const host = ref.location.nativeElement as HTMLElement;
    this.appRef.detachView(ref.hostView);
    ref.destroy();
    host.remove();
    if (this.abierto === ref) {
      this.abierto = undefined;
    }
  }
}
