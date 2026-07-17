import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Layout } from './pages/layout/layout';
import { MiAgenda } from './pages/mi-agenda/mi-agenda';
import { Catalogo } from './pages/catalogo/catalogo';
import { Admin } from './pages/admin/admin';
import { AvisosBoard } from './pages/avisos-board/avisos-board';
import { SesionForo } from './pages/sesion-foro/sesion-foro';
import { TomarAsistencia } from './pages/tomar-asistencia/tomar-asistencia';
import { MiHistorialAsistencia } from './pages/mi-historial/mi-historial-asistencia';
import { authGuard } from './core/guards/auth-guard';
import { publicGuard } from './core/guards/auth-guard';
import { Register } from './pages/register/register';
import { Perfil } from './pages/perfil/perfil';

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
      // Redirección inteligente
      { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
      
      // EP-03/04: Agendas (Mis Tutorías activas)
      { path: 'mi-agenda', component: MiAgenda },
      
      // EP-04: Catálogo de tutorías
      { path: 'catalogo', component: Catalogo },
      
      // EP-05/07: Historial y Calificaciones
      { path: 'historial', loadComponent: () => import('./pages/historial/historial.component').then(m => m.HistorialComponent) },
      
      // EP-06: Avisos, Foro y Admin
      { path: 'admin', component: Admin },
      { path: 'avisos', component: AvisosBoard },
      { path: 'sesion/:id/foro', component: SesionForo },

      // Asistencia y Perfil
      { path: 'sesion/:id/asistencia', component: TomarAsistencia },
      { path: 'mi-historial-asistencia', component: MiHistorialAsistencia },
      { path: 'perfil', component: Perfil },
    ],
  },
  {
    // Redirección si se escribe una URL que no existe
    path: '**',
    redirectTo: '',
  },
];