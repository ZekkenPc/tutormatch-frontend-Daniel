import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvisoService, AvisoDto, AvisoForm } from '../../core/services/aviso/aviso';
import { ToastService } from '../../core/services/toast/toast';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  avisos: AvisoDto[] = [];
  formulario: AvisoForm = { titulo: '', mensaje: '' };
  editandoId: string | null = null;
  cargando = false;

  constructor(
    private avisoService: AvisoService,
    private toastService: ToastService,
  ) {}

  ngOnInit() {
    this.cargarAvisos();
  }

  cargarAvisos() {
    this.avisoService.listar().subscribe({
      next: (avisos) => this.avisos = avisos,
      error: () => this.toastService.mostrar('No se pudieron cargar los avisos', 'error'),
    });
  }

  guardarAviso() {
    if (!this.formulario.titulo.trim() || !this.formulario.mensaje.trim()) {
      this.toastService.mostrar('El título y el mensaje son obligatorios.', 'error');
      return;
    }

    this.cargando = true;
    const peticion = this.editandoId
      ? this.avisoService.actualizar(this.editandoId, this.formulario)
      : this.avisoService.crear(this.formulario);

    peticion.subscribe({
      next: () => {
        this.cargando = false;
        this.toastService.mostrar('Aviso guardado correctamente', 'success');
        this.formulario = { titulo: '', mensaje: '' };
        this.editandoId = null;
        this.cargarAvisos();
      },
      error: (err) => {
        this.cargando = false;
        this.toastService.mostrar(err.error || 'Error al guardar el aviso', 'error');
      },
    });
  }

  editarAviso(aviso: AvisoDto) {
    this.editandoId = aviso.id;
    this.formulario = { titulo: aviso.titulo, mensaje: aviso.mensaje };
  }

  eliminarAviso(id: string) {
    this.toastService.preguntar('¿Eliminar este aviso permanentemente?', () => {
      this.avisoService.eliminar(id).subscribe({
        next: () => {
          this.toastService.mostrar('Aviso eliminado', 'success');
          this.cargarAvisos();
        },
        error: () => this.toastService.mostrar('No se pudo eliminar el aviso', 'error'),
      });
    });
  }
}
