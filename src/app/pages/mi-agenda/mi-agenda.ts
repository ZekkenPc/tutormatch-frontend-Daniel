import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SesionService, SesionResponse, SesionRequest, SesionUpdate } from '../../core/services/sesion/sesion';
import { ToastService } from '../../core/services/toast/toast';
import { Toast } from '../../shared/components/toast/toast';

@Component({
  selector: 'app-mi-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, Toast],
  templateUrl: './mi-agenda.html',
  styleUrl: './mi-agenda.css',
})
export class MiAgenda implements OnInit {

  // Lista de sesiones activas futuras del tutor
  sesiones: SesionResponse[] = [];

  // Estado de carga general
  cargando = false;

  // -----------------------------------------------------------------------
  // Estado del formulario (crear / editar)
  // -----------------------------------------------------------------------
  mostrarFormulario = false;
  modoEdicion = false;
  sesionEditandoId: string | null = null;

  /** Indica si la sesión que se edita ya tiene inscritos → bloquear fecha */
  fechaBloqueada = false;

  formulario: SesionRequest = this.formularioVacio();

  // -----------------------------------------------------------------------
  // Constructor e inicialización
  // -----------------------------------------------------------------------

  constructor(
    private sesionService: SesionService,
    public toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.cargarAgenda();
  }

  // -----------------------------------------------------------------------
  // HU-10: Cargar la agenda
  // -----------------------------------------------------------------------

  cargarAgenda(): void {
    this.cargando = true;
    this.sesionService.getAgenda().subscribe({
      next: (data) => {
        this.sesiones = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.toastService.mostrar('No se pudo cargar tu agenda. Intenta de nuevo.', 'error');
        this.cargando = false;
      },
    });
  }

  // -----------------------------------------------------------------------
  // HU-09: Abrir formulario para nueva sesión
  // -----------------------------------------------------------------------

  abrirFormularioNuevo(): void {
    this.modoEdicion = false;
    this.sesionEditandoId = null;
    this.fechaBloqueada = false;
    this.formulario = this.formularioVacio();
    this.mostrarFormulario = true;
  }

  // -----------------------------------------------------------------------
  // HU-11: Abrir formulario para editar sesión existente
  // -----------------------------------------------------------------------

  abrirFormularioEditar(sesion: SesionResponse): void {
    this.modoEdicion = true;
    this.sesionEditandoId = sesion.id;
    // Si ya hay inscritos, la fecha queda deshabilitada
    this.fechaBloqueada = sesion.inscritos > 0;

    // Convertir fecha ISO a formato compatible con datetime-local input
    const fechaLocal = sesion.fechaHora.substring(0, 16); // "2026-08-15T10:30"

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

  // -----------------------------------------------------------------------
  // HU-09 / HU-11: Guardar sesión (crear o actualizar)
  // -----------------------------------------------------------------------

  guardarSesion(): void {
    // Validación frontend básica
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

    // Validar fecha futura (mínimo 1 hora) en el frontend como primera línea
    const fechaSeleccionada = new Date(this.formulario.fechaHora);
    const limiteMinimo = new Date(Date.now() + 60 * 60 * 1000);
    if (!this.fechaBloqueada && fechaSeleccionada <= limiteMinimo) {
      this.toastService.mostrar('La fecha debe ser al menos 1 hora en el futuro.', 'error');
      return;
    }

    this.cargando = true;

    if (this.modoEdicion && this.sesionEditandoId) {
      // HU-11: Editar
      const update: SesionUpdate = {
        titulo: this.formulario.titulo,
        descripcion: this.formulario.descripcion,
        lugar: this.formulario.lugar,
        cupoMaximo: this.formulario.cupoMaximo,
      };
      // Solo enviar fecha si NO está bloqueada
      if (!this.fechaBloqueada) {
        update.fechaHora = this.formulario.fechaHora + ':00'; // agregar segundos
      }

      this.sesionService.actualizar(this.sesionEditandoId, update).subscribe({
        next: () => {
          this.toastService.mostrar('¡Sesión actualizada correctamente!', 'success');
          this.cerrarFormulario();
          this.cargarAgenda();
        },
        error: (err) => {
          const msg = err.error || 'Error al actualizar la sesión.';
          this.toastService.mostrar(msg, 'error');
          this.cargando = false;
        },
      });

    } else {
      // HU-09: Crear
      const request: SesionRequest = {
        ...this.formulario,
        fechaHora: this.formulario.fechaHora + ':00', // agregar segundos para ISO-8601
      };

      this.sesionService.crear(request).subscribe({
        next: () => {
          this.toastService.mostrar('¡Sesión publicada exitosamente!', 'success');
          this.cerrarFormulario();
          this.cargarAgenda();
        },
        error: (err) => {
          const msg = err.error || 'Error al publicar la sesión.';
          this.toastService.mostrar(msg, 'error');
          this.cargando = false;
        },
      });
    }
  }

  // -----------------------------------------------------------------------
  // HU-12: Cancelar sesión con confirmación via ToastService
  // -----------------------------------------------------------------------

  confirmarCancelacion(sesion: SesionResponse): void {
    this.toastService.preguntar(
      `¿Estás seguro de cancelar "${sesion.titulo}"? Esta acción notificará a los alumnos inscritos.`,
      () => this.ejecutarCancelacion(sesion.id),
    );
  }

  private ejecutarCancelacion(sesionId: string): void {
    this.sesionService.cancelar(sesionId).subscribe({
      next: () => {
        this.toastService.mostrar('La sesión fue cancelada.', 'info');
        this.cargarAgenda();
      },
      error: (err) => {
        const msg = err.error || 'Error al cancelar la sesión.';
        this.toastService.mostrar(msg, 'error');
      },
    });
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private formularioVacio(): SesionRequest {
    return {
      titulo: '',
      descripcion: '',
      lugar: '',
      fechaHora: '',
      cupoMaximo: 1,
    };
  }

  /** Formatea la fecha ISO para mostrarla legible en las tarjetas */
  formatearFecha(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
