import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  SesionService,
  SesionResponse,
  SesionRequest,
  SesionUpdate,
} from '../../core/services/sesion/sesion';
import { InscripcionService, AgendaAlumno } from '../../core/services/inscripcion/inscripcion';
import { ToastService } from '../../core/services/toast/toast';
import { AuthService } from '../../core/services/auth/auth';
import { finalize } from 'rxjs';
import { Toast } from '../../shared/components/toast/toast';
import { PerfilService, SesionHistorialTutor } from '../../core/services/perfil/perfil';
import { GestorRecursosComponent } from '../../shared/components/gestor-recursos/gestor-recursos.component';

@Component({
  selector: 'app-mi-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, Toast, GestorRecursosComponent],
  templateUrl: './mi-agenda.html',
  styleUrl: './mi-agenda.css',
})
export class MiAgenda implements OnInit {
  // -----------------------------------------------------------------------
  // Sección TUTOR (HU-10, 11, 12) — sesiones a impartir
  // -----------------------------------------------------------------------
  sesionesComoTutor: SesionResponse[] = [];
  cargandoTutor = false;

  vistaTutor: 'proximas' | 'historial' = 'proximas';
  sesionesHistorialTutor: SesionHistorialTutor[] = [];
  cargandoHistorial = false;

  // -----------------------------------------------------------------------
  // Sección ALUMNO (HU-15, 16) — sesiones a asistir
  // -----------------------------------------------------------------------
  sesionesComoAlumno: AgendaAlumno[] = [];
  cargandoAlumno = false;

  // -----------------------------------------------------------------------
  // Estado del formulario (crear / editar sesiones como tutor)
  // -----------------------------------------------------------------------
  mostrarFormulario = false;
  modoEdicion = false;
  sesionEditandoId: string | null = null;
  fechaBloqueada = false;
  formulario: SesionRequest = this.formularioVacio();

  // -----------------------------------------------------------------------
  // Estado del modal de Recursos
  // -----------------------------------------------------------------------
  mostrarRecursos = false;
  sesionRecursosId: string | null = null;

  // -----------------------------------------------------------------------
  // Estado de carga de cancelaciones
  // -----------------------------------------------------------------------
  cancelingId: string | null = null;

  constructor(
    private sesionService: SesionService,
    private inscripcionService: InscripcionService,
    private perfilService: PerfilService, 
    private router: Router,
    public toastService: ToastService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    if (this.authService.hasRole('ROLE_TUTOR')) {
      this.cargarAgendaTutor();
    }
    if (this.authService.hasRole('ROLE_ALUMNO')) {
      this.cargarAgendaAlumno();
    }
  }

  // =========================================================================
  // SECCIÓN TUTOR — HU-10: Cargar sesiones a impartir
  // =========================================================================

  cargarAgendaTutor(): void {
    this.cargandoTutor = true;
    this.sesionService.getAgenda().subscribe({
      next: (data) => {
        this.sesionesComoTutor = data;
        this.cargandoTutor = false;
      },
      error: () => {
        this.toastService.mostrar('No se pudo cargar tu agenda como tutor.', 'error');
        this.cargandoTutor = false;
      },
    });
  }

  cambiarVistaTutor(vista: 'proximas' | 'historial'): void {
  this.vistaTutor = vista;
  if (vista === 'historial' && this.sesionesHistorialTutor.length === 0) {
    this.cargarHistorialTutor();
  }
}

cargarHistorialTutor(): void {
  this.cargandoHistorial = true;
  this.perfilService.getHistorialTutor().subscribe({
    next: (data) => {
      this.sesionesHistorialTutor = data;
      this.cargandoHistorial = false;
    },
    error: () => {
      this.toastService.mostrar('No se pudo cargar tu historial de tutorías.', 'error');
      this.cargandoHistorial = false;
    },
  });
}

  // =========================================================================
  // SECCIÓN ALUMNO — HU-15: Cargar sesiones a asistir
  // =========================================================================

  cargarAgendaAlumno(): void {
    this.cargandoAlumno = true;
    this.inscripcionService.getAgendaAlumno().subscribe({
      next: (data) => {
        this.sesionesComoAlumno = data;
        this.cargandoAlumno = false;
      },
      error: () => {
        this.toastService.mostrar('No se pudo cargar tu agenda como alumno.', 'error');
        this.cargandoAlumno = false;
      },
    });
  }

  // =========================================================================
  // SECCIÓN TUTOR — HU-09: Abrir formulario nueva sesión
  // =========================================================================

  abrirFormularioNuevo(): void {
    this.modoEdicion = false;
    this.sesionEditandoId = null;
    this.fechaBloqueada = false;
    this.formulario = this.formularioVacio();
    this.mostrarFormulario = true;
  }

  // =========================================================================
  // SECCIÓN TUTOR — HU-11: Abrir formulario editar sesión
  // =========================================================================

  abrirFormularioEditar(sesion: SesionResponse): void {
    this.modoEdicion = true;
    this.sesionEditandoId = sesion.id;
    this.fechaBloqueada = sesion.inscritos > 0;
    const fechaLocal = sesion.fechaHora.substring(0, 16);
    this.formulario = {
      titulo: sesion.titulo,
      descripcion: sesion.descripcion,
      lugar: sesion.lugar ?? '',
      fechaHora: fechaLocal,
      cupoMaximo: sesion.cupoMaximo,
    };
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  // =========================================================================
  // SECCIÓN RECURSOS — Épica 7
  // =========================================================================

  abrirRecursos(sesionId: string): void {
    this.sesionRecursosId = sesionId;
    this.mostrarRecursos = true;
  }

  cerrarRecursos(): void {
    this.mostrarRecursos = false;
    this.sesionRecursosId = null;
  }

  // =========================================================================
  // HU-09 / HU-11: Guardar sesión (crear o actualizar)
  // =========================================================================

  guardarSesion(): void {
    if (!this.formulario.titulo?.trim()) {
      this.toastService.mostrar('El título es obligatorio.', 'error');
      return;
    }
    if (!this.formulario.fechaHora) {
      this.toastService.mostrar('La fecha y hora son obligatorias.', 'error');
      return;
    }
    if (!this.formulario.cupoMaximo || this.formulario.cupoMaximo < 1) {
      this.toastService.mostrar('El cupo máximo debe ser al menos 1.', 'error');
      return;
    }
    const fechaSeleccionada = new Date(this.formulario.fechaHora);
    const limiteMinimo = new Date(Date.now() + 60 * 60 * 1000);
    if (!this.fechaBloqueada && fechaSeleccionada <= limiteMinimo) {
      this.toastService.mostrar('La fecha debe ser al menos 1 hora en el futuro.', 'error');
      return;
    }

    this.cargandoTutor = true;

    if (this.modoEdicion && this.sesionEditandoId) {
      const update: SesionUpdate = {
        titulo: this.formulario.titulo,
        descripcion: this.formulario.descripcion,
        lugar: this.formulario.lugar,
        cupoMaximo: this.formulario.cupoMaximo,
      };
      if (!this.fechaBloqueada) update.fechaHora = this.formulario.fechaHora + ':00';

      this.sesionService.actualizar(this.sesionEditandoId, update).subscribe({
        next: () => {
          this.toastService.mostrar('¡Sesión actualizada!', 'success');
          this.cerrarFormulario();
          this.cargarAgendaTutor();
        },
        error: (err) => {
          this.toastService.mostrar(err.error || 'Error al actualizar.', 'error');
          this.cargandoTutor = false;
        },
      });
    } else {
      const request: SesionRequest = {
        ...this.formulario,
        fechaHora: this.formulario.fechaHora + ':00',
      };
      this.sesionService.crear(request).subscribe({
        next: () => {
          this.toastService.mostrar('¡Sesión publicada!', 'success');
          this.cerrarFormulario();
          this.cargarAgendaTutor();
        },
        error: (err) => {
          this.toastService.mostrar(err.error || 'Error al publicar.', 'error');
          this.cargandoTutor = false;
        },
      });
    }
  }

  // =========================================================================
  // SECCIÓN TUTOR — HU-12: Cancelar sesión propia
  // =========================================================================

  confirmarCancelacionSesion(sesion: SesionResponse): void {
    this.toastService.preguntar(
      `¿Cancelar "${sesion.titulo}"? Esto notificará a los alumnos inscritos.`,
      () => {
        this.cancelingId = sesion.id;
        this.sesionService.cancelar(sesion.id).pipe(
          finalize(() => (this.cancelingId = null))
        ).subscribe({
            next: () => {
              this.toastService.mostrar('Sesión cancelada.', 'info');
              this.cargarAgendaTutor();
            },
            error: (err) => {
              this.toastService.mostrar(err.error || 'Error al cancelar.', 'error');
            },
          });
      },
    );
  }

  // =========================================================================
  // SECCIÓN ALUMNO — HU-16: Cancelar inscripción
  // =========================================================================

  confirmarCancelacionInscripcion(sesion: AgendaAlumno): void {
    this.toastService.preguntar(
      `¿Estás seguro de cancelar tu asistencia a "${sesion.titulo}"? Tu lugar quedará disponible para otros.`,
      () => {
        this.cancelingId = sesion.inscripcionId;
        this.inscripcionService.cancelarInscripcion(sesion.inscripcionId).pipe(
          finalize(() => (this.cancelingId = null))
        ).subscribe({
            next: () => {
              this.toastService.mostrar('Inscripción cancelada. Tu lugar ha sido liberado.', 'info');
              this.cargarAgendaAlumno();
            },
            error: (err) => {
              this.toastService.mostrar(err.error || 'Error al cancelar.', 'error');
            },
          });
      },
    );
  }

  irAlForo(sesionId: string): void {
    this.router.navigate(['/app/sesion', sesionId, 'foro']);
  }

  irAAsistencia(sesionId: string): void {
    this.router.navigate(['/app/sesion', sesionId, 'asistencia']);
  }

  irAMiHistorialAsistencia(): void {
    this.router.navigate(['/app/mi-historial-asistencia']);
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  private formularioVacio(): SesionRequest {
    return { titulo: '', descripcion: '', lugar: '', fechaHora: '', cupoMaximo: 1 };
  }

  formatearFecha(fechaIso: string): string {
    return new Date(fechaIso).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
