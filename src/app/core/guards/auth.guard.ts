import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Protege rutas privadas: sin sesion redirige a /login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estaAutenticado ? true : router.parseUrl('/login');
};

/** Rutas solo para invitados (login/register): si ya hay sesion va al home. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estaAutenticado ? router.parseUrl('/tabs/home') : true;
};
