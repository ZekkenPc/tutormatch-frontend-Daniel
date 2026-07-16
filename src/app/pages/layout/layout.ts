import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth';
import { NotificacionService, Notificacion } from '../../core/services/notificacion/notificacion';
import {
  UsuarioService,
  PerfilUsuario,
  estadoSolicitudLabel,
} from '../../core/services/usuario/usuario';
import { ToastService } from '../../core/services/toast/toast';
import { SolicitarTutorModal } from '../../shared/components/solicitar-tutor-modal/solicitar-tutor-modal';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, SolicitarTutorModal],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit, OnDestroy {
  mostrarNotificaciones = false;

  // HU-05: menú desplegable de perfil y modal de "Quiero ser Tutor"
  mostrarPerfilMenu = false;
  mostrarModalTutor = false;
  enviandoSolicitud = false;
  perfil: PerfilUsuario | null = null;

  // Variables reactivas para el HTML
  notificaciones$: Observable<Notificacion[]>;
  sinLeer$: Observable<number>;

  constructor(
    public authService: AuthService,
    private notificacionService: NotificacionService,
    private usuarioService: UsuarioService,
    private toastService: ToastService,
  ) {
    this.notificaciones$ = this.notificacionService.notificaciones$;
    // Calculamos cuántas notificaciones no han sido leídas
    this.sinLeer$ = this.notificaciones$.pipe(
      map((notificaciones) => notificaciones.filter((n) => !n.leida).length),
    );
  }

  ngOnInit() {
    // Arrancamos el motor de polling de notificaciones cuando el usuario entra a la app
    this.notificacionService.iniciarPolling();
    this.cargarPerfil();
  }

  ngOnDestroy() {
    // Apagamos el motor poolling para evitar fugas de memoria si cierra sesión
    this.notificacionService.detenerPolling();
  }

  toggleNotificaciones() {
    this.mostrarNotificaciones = !this.mostrarNotificaciones;
    if (!this.mostrarNotificaciones) {
      this.notificacionService.limpiarLeidasLocal();
    }
  }

  marcarVista(id: string, event: Event) {
    event.stopPropagation();
    this.notificacionService.marcarComoLeida(id).subscribe();
  }

  onLogout(): void {
    this.notificacionService.detenerPolling();
    this.authService.logout();
  }

  // ============= HU-05: Solicitud de rol Tutor =============

  private cargarPerfil(): void {
    // No debe bloquear la navegación si falla: solo afecta la visibilidad
    // de la opción "Quiero ser Tutor" en el menú de perfil.
    this.usuarioService.obtenerPerfil().subscribe({
      next: (perfil) => {
        this.perfil = perfil;
        this.sincronizarRolesSiCambiaron(perfil);
      },
      error: () => (this.perfil = null),
    });
  }

  // HU-08: el JWT que tenemos guardado pudo haberse emitido antes de que un
  // Admin aprobara/rechazara la solicitud (ej. sigue diciendo ROLE_ALUMNO
  // aunque el backend ya lo tenga como ROLE_TUTOR). Si detectamos un rol en
  // /me que el token actual no tiene, pedimos un refresh silencioso; al
  // terminar, el NavBar se vuelve a evaluar solo (authService.hasRole lee el
  // token en el momento, no queda cacheado) y muestra las opciones nuevas
  // sin que el usuario tenga que cerrar sesión.
  private async sincronizarRolesSiCambiaron(perfil: PerfilUsuario): Promise<void> {
    const hayRolNuevo = perfil.roles.some((rol) => !this.authService.hasRole(rol));
    if (hayRolNuevo) {
      const seRefresco = await this.authService.refrescarToken();
      if (seRefresco && this.authService.hasRole('ROLE_TUTOR')) {
        this.toastService.mostrar(
          '¡Ahora eres Tutor! Ya tienes acceso a tus nuevas opciones.',
          'success',
        );
      }
    }
  }

  get puedeSolicitarTutor(): boolean {
    return this.authService.hasRole('ROLE_ALUMNO') && this.perfil?.estadoSolicitud !== 'pendiente';
  }

  get solicitudPendiente(): boolean {
    return this.authService.hasRole('ROLE_ALUMNO') && this.perfil?.estadoSolicitud === 'pendiente';
  }

  get solicitudRechazada(): boolean {
    return this.authService.hasRole('ROLE_ALUMNO') && this.perfil?.estadoSolicitud === 'rechazado';
  }

  // Etiqueta lista para pintar en el HTML: "Pendiente" | "Aceptado" | "Rechazado" | ""
  get estadoSolicitudTexto(): string {
    return estadoSolicitudLabel(this.perfil?.estadoSolicitud ?? null);
  }

  togglePerfilMenu(): void {
    this.mostrarPerfilMenu = !this.mostrarPerfilMenu;
  }

  abrirModalTutor(): void {
    this.mostrarPerfilMenu = false;
    this.mostrarModalTutor = true;
  }

  cerrarModalTutor(): void {
    this.mostrarModalTutor = false;
  }

  enviarSolicitudTutor(justificacion: string): void {
    this.enviandoSolicitud = true;
    this.usuarioService.solicitarTutor(justificacion).subscribe({
      next: () => {
        this.enviandoSolicitud = false;
        this.mostrarModalTutor = false;
        if (this.perfil) {
          // El literal 'pendiente' se valida en compilación contra EstadoSolicitud;
          // sigue siendo el mismo string plano (minúsculas) que espera el backend/BD.
          this.perfil = { ...this.perfil, estadoSolicitud: 'pendiente' };
        }
        this.toastService.mostrar(
          'Solicitud enviada. Un administrador la revisará pronto.',
          'success',
        );
      },
      error: (err) => {
        this.enviandoSolicitud = false;
        this.toastService.mostrar(err.error || 'No se pudo enviar la solicitud', 'error');
      },
    });
  }
}
