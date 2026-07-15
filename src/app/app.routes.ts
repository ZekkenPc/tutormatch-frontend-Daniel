import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Layout } from './pages/layout/layout';
import { Home } from './pages/home/home';
import { MiAgenda } from './pages/mi-agenda/mi-agenda';
import { authGuard } from './core/guards/auth-guard';
import { publicGuard } from './core/guards/auth-guard';
import { Register } from './pages/register/register';

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
    // Rutas privadas (protegidas por authGuard, con Navbar del Layout)
    path: 'app',
    component: Layout,
    canActivateChild: [authGuard],
    children: [
      { path: 'home', component: Home },
      // EP-03: Mi Agenda del Tutor (HU-09, HU-10, HU-11, HU-12)
      { path: 'mi-agenda', component: MiAgenda },
      // Aquí agregaremos las rutas de los demás compañeros (catalogo, admin, etc.)
    ],
  },
  {
    // Redirección si se escribe una URL que no existe
    path: '**',
    redirectTo: '',
  },
];
