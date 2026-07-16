import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService, SolicitudPendiente } from '../../core/services/usuario/usuario';
import { ToastService } from '../../core/services/toast/toast';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  // HU-06: tabla de solicitudes pendientes para el Administrador
  solicitudes: SolicitudPendiente[] = [];
  cargando = true;
  error = false;

  // HU-07: ids de solicitudes que están procesando un Aprobar/Rechazar
  // (para deshabilitar esos botones mientras responde el backend)
  procesando = new Set<string>();

  constructor(
    private usuarioService: UsuarioService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    this.error = false;
    this.usuarioService.obtenerSolicitudesPendientes().subscribe({
      next: (solicitudes) => {
        this.solicitudes = solicitudes;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.error = true;
        this.toastService.mostrar('No se pudieron cargar las solicitudes pendientes', 'error');
      },
    });
  }

  // HU-07: aprobar convierte al usuario en TUTOR
  aprobar(solicitud: SolicitudPendiente): void {
    this.toastService.preguntar(
      `¿Aprobar la solicitud de ${solicitud.nombre} y convertirlo en Tutor?`,
      () => {
        this.procesando.add(solicitud.id);
        this.usuarioService.aprobarSolicitud(solicitud.id).subscribe({
          next: () => {
            this.quitarDeLaTabla(solicitud.id);
            this.toastService.mostrar(`Solicitud de ${solicitud.nombre} aprobada`, 'success');
          },
          error: () => {
            this.procesando.delete(solicitud.id);
            this.toastService.mostrar('No se pudo aprobar la solicitud', 'error');
          },
        });
      },
    );
  }

  // HU-07: rechazar mantiene al usuario como ALUMNO
  rechazar(solicitud: SolicitudPendiente): void {
    this.toastService.preguntar(`¿Rechazar la solicitud de ${solicitud.nombre}?`, () => {
      this.procesando.add(solicitud.id);
      this.usuarioService.rechazarSolicitud(solicitud.id).subscribe({
        next: () => {
          this.quitarDeLaTabla(solicitud.id);
          this.toastService.mostrar(`Solicitud de ${solicitud.nombre} rechazada`, 'info');
        },
        error: () => {
          this.procesando.delete(solicitud.id);
          this.toastService.mostrar('No se pudo rechazar la solicitud', 'error');
        },
      });
    });
  }

  // Quita la fila de la tabla al instante, sin recargar la página completa
  private quitarDeLaTabla(usuarioId: string): void {
    this.solicitudes = this.solicitudes.filter((s) => s.id !== usuarioId);
    this.procesando.delete(usuarioId);
  }
}
