import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecursosService } from '../../../core/services/recursos/recursos.service';
import { RecursoRequestDto, RecursoResponseDto } from '../../../core/models/recurso.model';
import { ToastService } from '../../../core/services/toast/toast';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-gestor-recursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestor-recursos.component.html',
  styleUrl: './gestor-recursos.component.css',
})
export class GestorRecursosComponent implements OnInit {
  @Input() sesionId!: string;

  recursos: RecursoResponseDto[] = [];
  cargando = false;

  // Campos del formulario
  nuevoTitulo = '';
  nuevaUrl = '';
  enviando = false;

  eliminandoRecursoId: string | null = null;

  constructor(
    private recursosService: RecursosService,
    private toastService: ToastService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.cargarRecursos();
  }

  get esTutor(): boolean {
    return this.authService.hasRole('ROLE_TUTOR');
  }

  cargarRecursos(): void {
    this.cargando = true;
    this.recursosService.obtenerRecursos(this.sesionId).subscribe({
      next: (data) => {
        this.recursos = data;
        this.cargando = false;
      },
      error: () => {
        this.toastService.mostrar('Error al cargar los recursos.', 'error');
        this.cargando = false;
      },
    });
  }

  agregarRecurso(): void {
    if (!this.nuevoTitulo.trim() || !this.nuevaUrl.trim()) {
      this.toastService.mostrar('El título y la URL son obligatorios.', 'error');
      return;
    }

    const recurso: RecursoRequestDto = {
      titulo: this.nuevoTitulo.trim(),
      url: this.nuevaUrl.trim(),
    };

    this.enviando = true;
    this.recursosService.agregarRecurso(this.sesionId, recurso).subscribe({
      next: (nuevo) => {
        this.recursos.push(nuevo);
        this.nuevoTitulo = '';
        this.nuevaUrl = '';
        this.enviando = false;
        this.toastService.mostrar('Recurso agregado exitosamente.', 'success');
      },
      error: () => {
        this.enviando = false;
        this.toastService.mostrar('Error al agregar el recurso.', 'error');
      },
    });
  }

  eliminarRecurso(recursoId: string): void {
    this.toastService.preguntar('¿Estás seguro de eliminar este recurso?', () => {
      this.eliminandoRecursoId = recursoId;
      this.recursosService
        .eliminarRecurso(recursoId)
        .pipe(
          finalize(() => {
            this.eliminandoRecursoId = null;
          }),
        )
        .subscribe({
          next: () => {
            this.recursos = this.recursos.filter((r) => r.id !== recursoId);
            this.toastService.mostrar('Recurso eliminado.', 'success');
          },
          error: () => {
            this.recursos = this.recursos.filter((r) => r.id !== recursoId);
            this.toastService.mostrar('Error al eliminar el recurso.', 'error');
          },
        });
    });
  }
}
