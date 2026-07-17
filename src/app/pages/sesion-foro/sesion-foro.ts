import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PreguntaService, PreguntaDto, PreguntaForm } from '../../core/services/pregunta/pregunta';
import { AuthService } from '../../core/services/auth/auth';
import { InscripcionService } from '../../core/services/inscripcion/inscripcion';
import { ToastService } from '../../core/services/toast/toast';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-sesion-foro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sesion-foro.html',
  styleUrl: './sesion-foro.css',
})
export class SesionForo {
  private route = inject(ActivatedRoute);
  public sesionId = '';
  public preguntas: PreguntaDto[] = [];
  public nuevaPregunta: PreguntaForm = { pregunta: '' };
  public respuestaActiva: Record<string, string> = {};
  public cargando = false;
  public cargandoInscripcion = false;
  public puedePublicarPregunta = false;
  public eliminandoPreguntaId: string | null = null;
  public cargandoPreguntas = false;

  constructor(
    private preguntaService: PreguntaService,
    private inscripcionService: InscripcionService,
    public authService: AuthService,
    private toastService: ToastService,
  ) {}

  ngOnInit() {
    this.sesionId = this.route.snapshot.paramMap.get('id') || '';
    this.verificarInscripcion();
    this.cargarPreguntas();
  }

  verificarInscripcion() {
    if (!this.sesionId) {
      this.puedePublicarPregunta = false;
      return;
    }

    this.cargandoInscripcion = true;
    this.inscripcionService.estaInscrito(this.sesionId).subscribe({
      next: (inscrito) => {
        this.puedePublicarPregunta = inscrito;
        this.cargandoInscripcion = false;
      },
      error: () => {
        this.puedePublicarPregunta = false;
        this.cargandoInscripcion = false;
      },
    });
  }

  cargarPreguntas() {
    this.cargandoPreguntas = true;
    this.preguntaService.listar(this.sesionId).subscribe({
      next: (preguntas) => {
        this.cargandoPreguntas = false;
        this.preguntas = preguntas;
      },
      error: () => this.toastService.mostrar('No se pudieron cargar las preguntas.', 'error'),
    });
  }

  enviarPregunta() {
    if (!this.puedePublicarPregunta) {
      this.toastService.mostrar(
        'Solo puedes publicar preguntas si ya estás inscrito en esta tutoría.',
        'error',
      );
      return;
    }

    if (!this.nuevaPregunta.pregunta.trim()) {
      this.toastService.mostrar('La pregunta no puede estar vacía.', 'error');
      return;
    }

    this.cargando = true;
    this.preguntaService.crear(this.sesionId, this.nuevaPregunta).subscribe({
      next: (pregunta) => {
        this.cargando = false;
        this.toastService.mostrar('Pregunta enviada.', 'success');
        this.preguntas.push(pregunta);
        this.nuevaPregunta = { pregunta: '' };
      },
      error: (err) => {
        this.cargando = false;
        this.toastService.mostrar(err.error || 'Error al enviar la pregunta.', 'error');
      },
    });
  }

  responderPregunta(pregunta: PreguntaDto) {
    const texto = this.respuestaActiva[pregunta.id]?.trim();
    if (!texto) {
      this.toastService.mostrar('La respuesta no puede estar vacía.', 'error');
      return;
    }

    this.cargando = true;
    this.preguntaService.responder(this.sesionId, pregunta.id, { respuesta: texto }).subscribe({
      next: (actualizada) => {
        this.cargando = false;
        this.toastService.mostrar('Respuesta guardada.', 'success');
        pregunta.respuesta = actualizada.respuesta;
        pregunta.respondidoEn = actualizada.respondidoEn;
        this.respuestaActiva[pregunta.id] = '';
      },
      error: (err) => {
        this.cargando = false;
        this.toastService.mostrar(err.error || 'Error al guardar la respuesta.', 'error');
      },
    });
  }

  eliminarPregunta(pregunta: PreguntaDto) {
    this.toastService.preguntar('¿Eliminar tu pregunta?', () => {
      this.eliminandoPreguntaId = pregunta.id;
      this.preguntaService
        .eliminar(this.sesionId, pregunta.id)
        .pipe(finalize(() => (this.eliminandoPreguntaId = null)))
        .subscribe({
          next: () => {
            this.toastService.mostrar('Pregunta eliminada.', 'success');
            this.preguntas = this.preguntas.filter((p) => p.id !== pregunta.id);
          },
          error: (err) => {
            const mensaje = err.error?.message || 'No se pudo eliminar la pregunta.';
            this.toastService.mostrar(mensaje, 'error');
          },
        });
    });
  }
}
