import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AsistenciaService, AlumnoAsistencia } from '../../core/services/asistencia/asistencia';
import { ToastService } from '../../core/services/toast/toast';
import { Toast } from '../../shared/components/toast/toast';

@Component({
  selector: 'app-tomar-asistencia',
  standalone: true,
  imports: [CommonModule, Toast],
  templateUrl: './tomar-asistencia.html',
  styleUrl: './tomar-asistencia.css',
})
export class TomarAsistencia implements OnInit {
  sesionId!: string;
  alumnos: AlumnoAsistencia[] = [];
  cargando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private asistenciaService: AsistenciaService,
    public toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.sesionId = this.route.snapshot.paramMap.get('id')!;
    this.cargarLista();
  }

  cargarLista(): void {
    this.cargando = true;
    this.asistenciaService.listarAsistenciaDeSesion(this.sesionId).subscribe({
      next: (data) => {
        this.alumnos = data;
        this.cargando = false;
      },
      error: (err) => {
        this.toastService.mostrar(err.error || 'No se pudo cargar la lista de asistencia.', 'error');
        this.cargando = false;
      },
    });
  }

  marcar(alumno: AlumnoAsistencia, estado: 'PRESENTE' | 'AUSENTE'): void {
    if (!alumno.puedeMarcar) return;
    this.asistenciaService.marcarAsistencia(this.sesionId, alumno.alumnoId, estado).subscribe({
      next: () => {
        alumno.estado = estado;
        this.toastService.mostrar(`Asistencia de ${alumno.nombreCompleto} marcada.`, 'success');
      },
      error: (err) => {
        this.toastService.mostrar(err.error || 'No se pudo marcar la asistencia.', 'error');
      },
    });
  }

  volver(): void {
    this.router.navigate(['/app/mi-agenda']);
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'PRESENTE': return 'Presente';
      case 'AUSENTE': return 'Ausente';
      case 'PENDIENTE': return 'Sin marcar';
      case 'NO_MARCADA': return 'No se marcó';
      default: return estado;
    }
  }
}