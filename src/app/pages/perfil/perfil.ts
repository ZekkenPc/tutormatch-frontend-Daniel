import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth/auth';
import { PerfilService, EstadisticasTutor, EstadisticasAlumno } from '../../core/services/perfil/perfil';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  pestanaActiva: 'perfil' | 'trayectoria' = 'perfil';

  estadisticasTutor: EstadisticasTutor | null = null;
  estadisticasAlumno: EstadisticasAlumno | null = null;
  cargando = false;

  constructor(
    public authService: AuthService,
    private perfilService: PerfilService,
  ) {}

  irATrayectoria(): void {
    this.pestanaActiva = 'trayectoria';
    if (!this.estadisticasTutor && this.authService.hasRole('ROLE_TUTOR')) {
      this.cargarEstadisticasTutor();
    }
    if (!this.estadisticasAlumno && this.authService.hasRole('ROLE_ALUMNO')) {
      this.cargarEstadisticasAlumno();
    }
  }

  irAPerfil(): void {
    this.pestanaActiva = 'perfil';
  }

  private cargarEstadisticasTutor(): void {
    this.cargando = true;
    this.perfilService.getEstadisticasTutor().subscribe({
      next: (data) => { this.estadisticasTutor = data; this.cargando = false; },
      error: () => { this.cargando = false; },
    });
  }

  private cargarEstadisticasAlumno(): void {
    this.cargando = true;
    this.perfilService.getEstadisticasAlumno().subscribe({
      next: (data) => { this.estadisticasAlumno = data; this.cargando = false; },
      error: () => { this.cargando = false; },
    });
  }
}