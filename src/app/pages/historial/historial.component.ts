import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistorialService } from '../../core/services/historial/historial.service';
import { EvaluacionesService } from '../../core/services/evaluaciones/evaluaciones.service';
import { AuthService } from '../../core/services/auth/auth';
import { ToastService } from '../../core/services/toast/toast';
import { SesionResponseDto } from '../../core/models/sesion.model';
import { EvaluacionRequestDto } from '../../core/models/evaluacion.model';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css'],
})
export class HistorialComponent implements OnInit {
  sesiones: SesionResponseDto[] = [];
  cargando = false;

  // Estado del formulario de calificación
  sesionIdCalificando: string | null = null;
  tutorIdCalificando: string | null = null;
  calificacion: number = 0;
  comentario: string = '';
  enviandoEvaluacion = false;
  estrellas: number[] = [1, 2, 3, 4, 5];

  constructor(
    private historialService: HistorialService,
    private evaluacionesService: EvaluacionesService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  get esAlumno(): boolean {
    return this.authService.hasRole('ROLE_ALUMNO');
  }

  cargarHistorial(): void {
    this.cargando = true;
    this.historialService.obtenerHistorial().subscribe({
      next: (data) => {
        this.sesiones = data;
        this.cargando = false;
      },
      error: () => {
        this.toastService.mostrar('Error al cargar el historial.', 'error');
        this.cargando = false;
      },
    });
  }

  abrirFormularioCalificar(sesionId: string, tutorId: string): void {
    this.sesionIdCalificando = sesionId;
    this.tutorIdCalificando = tutorId;
    this.calificacion = 0; // Valor por defecto
    this.comentario = '';
  }

  setCalificacion(valor: number): void {
    if (!this.enviandoEvaluacion) {
      this.calificacion = valor;
    }
  }

  cancelarCalificacion(): void {
    this.sesionIdCalificando = null;
    this.tutorIdCalificando = null;
  }

  enviarCalificacion(): void {
    if (!this.sesionIdCalificando || !this.tutorIdCalificando) return;

    if (this.calificacion < 1 || this.calificacion > 5) {
      this.toastService.mostrar('La calificación debe estar entre 1 y 5.', 'error');
      return;
    }

    const evaluacion: EvaluacionRequestDto = {
      sesionId: this.sesionIdCalificando,
      tutorId: this.tutorIdCalificando,
      calificacion: this.calificacion,
      comentario: this.comentario.trim()
    };

    this.enviandoEvaluacion = true;
    this.evaluacionesService.calificarSesion(evaluacion).subscribe({
      next: () => {
        this.toastService.mostrar('Calificación enviada exitosamente.', 'success');
        this.enviandoEvaluacion = false;
        
        // Actualizar el estado de la sesión localmente
        const sesionActualizada = this.sesiones.find(s => s.id === this.sesionIdCalificando);
        if (sesionActualizada) {
          sesionActualizada.fueEvaluada = true;
        }
        
        this.sesionIdCalificando = null;
      },
      error: () => {
        this.toastService.mostrar('Error al enviar la calificación.', 'error');
        this.enviandoEvaluacion = false;
      }
    });
  }
  
  formatearFecha(fechaIso: string): string {
    return new Date(fechaIso).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
