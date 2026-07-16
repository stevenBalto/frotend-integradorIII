import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Producto, ProductoTamano, ExtraDisponible } from '../models/producto.model';
import { CarritoStorageService } from './carrito-storage.service';

/** Una linea del carrito (producto + configuracion). */
export interface LineaCarrito {
  producto: Producto;
  tamano: ProductoTamano | null;
  extras: ExtraDisponible[];
  cantidad: number;
  notas?: string;
}

/** Datos adicionales del carrito (sucursal, modalidad). */
export interface DatosCarrito {
  sucursalId: number | null;
  modalidad: 'para_llevar' | 'comer_aqui';
}

/**
 * Servicio de carrito de compras.
 * Mantiene el estado en memoria (BehaviorSubject) y lo persiste en storage.
 * Patron similar a AuthService: init() se llama en APP_INITIALIZER.
 */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly lineasSubject = new BehaviorSubject<LineaCarrito[]>([]);
  private readonly datosSubject = new BehaviorSubject<DatosCarrito>({
    sucursalId: null,
    modalidad: 'comer_aqui',
  });

  /** Observable de las lineas del carrito. */
  readonly lineas$ = this.lineasSubject.asObservable();

  /** Observable de los datos adicionales. */
  readonly datos$ = this.datosSubject.asObservable();

  /** Observable del total calculado. */
  readonly total$: Observable<number> = this.lineas$.pipe(
    map((lineas) =>
      lineas.reduce((acc, l) => acc + this.calcularPrecioLinea(l) * l.cantidad, 0)
    )
  );

  /** Observable de la cantidad total de items. */
  readonly cantidadItems$: Observable<number> = this.lineas$.pipe(
    map((lineas) => lineas.reduce((acc, l) => acc + l.cantidad, 0))
  );

  constructor(private storage: CarritoStorageService) {}

  /** APP_INITIALIZER: carga carrito persistido a memoria. */
  async init(): Promise<void> {
    await this.storage.init();
    const lineas = await this.storage.getLineas();
    const datos = await this.storage.getDatos();
    this.lineasSubject.next(lineas);
    if (datos) {
      this.datosSubject.next(datos);
    }
  }

  /** Retorna las lineas actuales (sincrono). */
  get lineas(): LineaCarrito[] {
    return this.lineasSubject.value;
  }

  /** Retorna los datos actuales (sincrono). */
  get datos(): DatosCarrito {
    return this.datosSubject.value;
  }

  /** Retorna el total actual (sincrono). */
  get total(): number {
    return this.lineas.reduce((acc, l) => acc + this.calcularPrecioLinea(l) * l.cantidad, 0);
  }

  /** Calcula el precio unitario de una linea (tamano + extras). */
  calcularPrecioLinea(linea: LineaCarrito): number {
    const precioBase = linea.tamano?.precio ?? linea.producto.precio_base;
    const precioExtras = linea.extras.reduce((acc, e) => acc + e.precio, 0);
    return precioBase + precioExtras;
  }

  /** Agrega una linea al carrito. */
  agregar(linea: LineaCarrito): void {
    const lineas = [...this.lineas, linea];
    this.lineasSubject.next(lineas);
    void this.storage.setLineas(lineas);
  }

  /** Quita una linea por indice. */
  quitar(index: number): void {
    const lineas = this.lineas.filter((_, i) => i !== index);
    this.lineasSubject.next(lineas);
    void this.storage.setLineas(lineas);
  }

  /** Actualiza la cantidad de una linea. */
  actualizarCantidad(index: number, cantidad: number): void {
    if (cantidad < 1) {
      this.quitar(index);
      return;
    }
    const lineas = this.lineas.map((l, i) => (i === index ? { ...l, cantidad } : l));
    this.lineasSubject.next(lineas);
    void this.storage.setLineas(lineas);
  }

  /** Establece la sucursal seleccionada. */
  setSucursal(sucursalId: number | null): void {
    const datos = { ...this.datos, sucursalId };
    this.datosSubject.next(datos);
    void this.storage.setDatos(datos);
  }

  /** Establece la modalidad seleccionada. */
  setModalidad(modalidad: 'para_llevar' | 'comer_aqui'): void {
    const datos = { ...this.datos, modalidad };
    this.datosSubject.next(datos);
    void this.storage.setDatos(datos);
  }

  /** Vacia el carrito completamente. */
  vaciar(): void {
    this.lineasSubject.next([]);
    this.datosSubject.next({ sucursalId: null, modalidad: 'comer_aqui' });
    void this.storage.clear();
  }

  /** Verifica si el carrito esta vacio. */
  get estaVacio(): boolean {
    return this.lineas.length === 0;
  }
}
