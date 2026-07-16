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
  const isAuthenticated = await authService.waitForAuthReady();

  if (isAuthenticated) {
    authService.redirigirSegunRol();
    return false;
  }

  return true;
};