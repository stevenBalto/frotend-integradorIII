import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SuperAdminAuthService } from '../services/superadmin-auth.service';

/** Protege el panel de superadmin: sin sesion de superadmin redirige al login unico. */
export const superAdminAuthGuard: CanActivateFn = () => {
  const auth = inject(SuperAdminAuthService);
  const router = inject(Router);
  return auth.estaAutenticado ? true : router.parseUrl('/login');
};
