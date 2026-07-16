import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvisoService, AvisoDto } from '../../core/services/aviso/aviso';
import { ToastService } from '../../core/services/toast/toast';

@Component({
  selector: 'app-avisos-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avisos-board.html',
  styleUrl: './avisos-board.css',
})
export class AvisosBoard {
  avisos: AvisoDto[] = [];

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
      error: () => this.toastService.mostrar('No se pudieron cargar los avisos.', 'error'),
    });
  }
}
