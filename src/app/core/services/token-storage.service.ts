import { Injectable } from '@angular/core';
import { Usuario } from '../models/usuario.model';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Persistencia del token y el usuario en sessionStorage: aislado por pestaña/ventana
 * (a diferencia de IndexedDB/localStorage, que comparte sesion entre todas las pestanas
 * del mismo origen y hacia que loguearse en una pestana pisara la sesion de otra).
 * Sobrevive a un reload de la misma pestana; una pestana nueva arranca sin sesion.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  async init(): Promise<void> {
    // No requiere inicializacion asincrona; se mantiene por compatibilidad con AuthService.
  }

  async getToken(): Promise<string | null> {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  async setToken(token: string): Promise<void> {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  async getUsuario(): Promise<Usuario | null> {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as Usuario) : null;
  }

  async setUsuario(usuario: Usuario): Promise<void> {
    sessionStorage.setItem(USER_KEY, JSON.stringify(usuario));
  }

  async clear(): Promise<void> {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}
