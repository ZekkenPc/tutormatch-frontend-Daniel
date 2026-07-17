import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsistenciaService, HistorialAsistencia } from '../../core/services/asistencia/asistencia';
import { ToastService } from '../../core/services/toast/toast';
import { Toast } from '../../shared/components/toast/toast';

@Component({
  selector: 'app-mi-historial-asistencia',
  standalone: true,
  imports: [CommonModule, Toast],
  templateUrl: './mi-historial-asistencia.html',
  styleUrl: './mi-historial-asistencia.css',
})
export class MiHistorialAsistencia implements OnInit {
  historial: HistorialAsistencia[] = [];
  cargando = false;

  constructor(
    private asistenciaService: AsistenciaService,
    public toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.cargando = true;
    this.asistenciaService.getMiHistorial().subscribe({
      next: (data) => {
        this.historial = data;
        this.cargando = false;
      },
      error: (err) => {
        this.toastService.mostrar(err.error || 'No se pudo cargar tu historial de asistencia.', 'error');
        this.cargando = false;
      },
    });
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'PRESENTE': return 'Asististe';
      case 'AUSENTE': return 'Faltaste';
      case 'PENDIENTE': return 'Aún sin marcar';
      case 'NO_MARCADA': return 'El tutor no marcó asistencia';
      default: return estado;
    }
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