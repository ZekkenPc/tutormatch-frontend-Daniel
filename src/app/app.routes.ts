import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Layout } from './pages/layout/layout';
import { Home } from './pages/home/home';
import { authGuard } from './core/guards/auth-guard';
import { publicGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/auth-guard';
import { Register } from './pages/register/register';
import { Admin } from './pages/admin/admin';

export const routes: Routes = [
  {
    // Ruta pública
    path: '',
    canActivate: [publicGuard],
    component: Landing,
  },
  {
    // Ruta pública para registro
    path: 'registro',
    canActivate: [publicGuard],
    component: Register,
  },
  {
    // Rutas privadas
    path: 'app',
    component: Layout,
    canActivateChild: [authGuard],
    children: [
      { path: 'home', component: Home },
      // HU-06: Panel de Administración, solo visible para rol ADMIN
      { path: 'admin', component: Admin, canActivate: [roleGuard('ROLE_ADMIN')] },
      // Aquí agregaremos luego las rutas de tus compañeros (catalogo, agenda, etc.)
    ],
  },
  {
    // Redirección si se escribe una URL que no existe
    path: '**',
    redirectTo: '',
  },
];
