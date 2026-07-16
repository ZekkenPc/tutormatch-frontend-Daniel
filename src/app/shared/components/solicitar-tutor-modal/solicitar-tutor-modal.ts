import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const MIN_CARACTERES = 20;

@Component({
  selector: 'app-solicitar-tutor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitar-tutor-modal.html',
  styleUrl: './solicitar-tutor-modal.css',
})
export class SolicitarTutorModal {
  // El padre (Layout) controla la visibilidad y el estado de carga
  @Input() visible = false;
  @Input() enviando = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() enviar = new EventEmitter<string>();

  justificacion = '';
  readonly minCaracteres = MIN_CARACTERES;

  get esValido(): boolean {
    return this.justificacion.trim().length >= MIN_CARACTERES;
  }

  onCerrar(): void {
    if (this.enviando) return; // evitar cerrar mientras se envía
    this.justificacion = '';
    this.cerrar.emit();
  }

  onEnviar(): void {
    if (!this.esValido || this.enviando) return;
    this.enviar.emit(this.justificacion.trim());
  }
}
