import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { LineaCarrito, DatosCarrito } from './carrito.service';

/**
 * Persistencia del carrito con @ionic/storage-angular.
 * Capa thin wrapper sobre storage, similar a TokenStorageService.
 */
@Injectable({ providedIn: 'root' })
export class CarritoStorageService {
  private store: Storage | null = null;

  constructor(private ionicStorage: Storage) {}

  async init(): Promise<void> {
    if (!this.store) {
      this.store = await this.ionicStorage.create();
    }
  }

  async getLineas(): Promise<LineaCarrito[]> {
    return (await this.store?.get('carrito_lineas')) ?? [];
  }

  async setLineas(lineas: LineaCarrito[]): Promise<void> {
    await this.store?.set('carrito_lineas', lineas);
  }

  async getDatos(): Promise<DatosCarrito | null> {
    return (await this.store?.get('carrito_datos')) ?? null;
  }

  async setDatos(datos: DatosCarrito): Promise<void> {
    await this.store?.set('carrito_datos', datos);
  }

  async clear(): Promise<void> {
    await this.store?.remove('carrito_lineas');
    await this.store?.remove('carrito_datos');
  }
}
