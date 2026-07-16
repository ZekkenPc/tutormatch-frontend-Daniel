import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

export const authGuard: CanActivateChildFn = async (childRoute, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.waitForAuthReady();

  if (isAuthenticated) {
    return true;
  }

  router.navigate(['/']);
  return false;
};

export const publicGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isAuthenticated = await authService.waitForAuthReady();

  if (isAuthenticated) {
    router.navigate(['/app/home']);
    return false;
  }
  return true;
};

// HU-06: fábrica de guard para rutas que solo debe ver un rol específico
// (ej. roleGuard('ROLE_ADMIN') para /app/admin). El backend igual valida
// con @PreAuthorize, esto es una segunda capa para que un usuario sin el
// rol no pueda ni entrar a la vista escribiendo la URL a mano.
export const roleGuard = (rolRequerido: string): CanActivateFn => {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const isAuthenticated = await authService.waitForAuthReady();

    if (isAuthenticated && authService.hasRole(rolRequerido)) {
      return true;
    }

    router.navigate(['/app/home']);
    return false;
  };
};
