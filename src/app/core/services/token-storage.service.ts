import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Usuario } from '../models/usuario.model';

/**
 * Persistencia del token y el usuario con @ionic/storage-angular.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private store: Storage | null = null;

  constructor(private ionicStorage: Storage) {}

  async init(): Promise<void> {
    if (!this.store) {
      this.store = await this.ionicStorage.create();
    }
  }

  async getToken(): Promise<string | null> {
    return (await this.store?.get('auth_token')) ?? null;
  }

  async setToken(token: string): Promise<void> {
    await this.store?.set('auth_token', token);
  }

  async getUsuario(): Promise<Usuario | null> {
    return (await this.store?.get('auth_user')) ?? null;
  }

  async setUsuario(usuario: Usuario): Promise<void> {
    await this.store?.set('auth_user', usuario);
  }

  async clear(): Promise<void> {
    await this.store?.remove('auth_token');
    await this.store?.remove('auth_user');
  }
}
