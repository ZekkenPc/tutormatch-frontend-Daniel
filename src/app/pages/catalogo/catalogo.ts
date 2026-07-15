import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { InscripcionService, CatalogoSesion, FiltrosCatalogo } from '../../core/services/inscripcion/inscripcion';
import { ToastService } from '../../core/services/toast/toast';
import { AuthService } from '../../core/services/auth/auth';
import { Toast } from '../../shared/components/toast/toast';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, Toast],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo implements OnInit, OnDestroy {

  sesiones: CatalogoSesion[] = [];
  cargando = false;
  inscribiendoId: string | null = null;   // ID de sesión en proceso de inscripción

  // -----------------------------------------------------------------------
  // Filtros reactivos — cambian sin recargar página
  // -----------------------------------------------------------------------
  filtros: FiltrosCatalogo = { materia: '', tutor: '', fecha: '' };

  private filtrosSubject = new Subject<FiltrosCatalogo>();
  private destroy$ = new Subject<void>();

  constructor(
    private inscripcionService: InscripcionService,
    public toastService: ToastService,
    public authService: AuthService,
  ) {}

  sesionesInscritas: Set<string> = new Set<string>();

  ngOnInit(): void {
    // Si el usuario tiene sesión iniciada, cargar su agenda para saber a qué sesiones ya está inscrito
    if (this.authService.isLoggedIn) {
      this.cargarAgendaPrevias();
    }

    // Al iniciar, cargamos el catálogo completo
    this.cargarCatalogo(this.filtros);

    // Suscribimos a cambios de filtros con debounce de 400ms (reactivo sin recargar página)
    this.filtrosSubject.pipe(
      debounceTime(400),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntil(this.destroy$),
    ).subscribe(filtros => this.cargarCatalogo(filtros));
  }

  private cargarAgendaPrevias(): void {
    this.inscripcionService.getAgendaAlumno().subscribe({
      next: (agenda) => {
        this.sesionesInscritas = new Set(agenda.map(a => a.sesionId));
      },
      error: (err) => console.error('No se pudo cargar agenda previa', err)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------------------------------------------------------
  // HU-13: Cargar catálogo con filtros
  // -----------------------------------------------------------------------

  onFiltroChange(): void {
    // Limpiar strings vacíos para que el backend los trate como "sin filtro"
    const filtrosLimpios: FiltrosCatalogo = {
      materia: this.filtros.materia?.trim() || undefined,
      tutor:   this.filtros.tutor?.trim()   || undefined,
      fecha:   this.filtros.fecha           || undefined,
    };
    this.filtrosSubject.next(filtrosLimpios);
  }

  limpiarFiltros(): void {
    this.filtros = { materia: '', tutor: '', fecha: '' };
    this.cargarCatalogo({});
  }

  private cargarCatalogo(filtros: FiltrosCatalogo): void {
    this.cargando = true;
    this.inscripcionService.getCatalogo(filtros).subscribe({
      next: (data) => {
        this.sesiones = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.toastService.mostrar('No se pudo cargar el catálogo. Intenta de nuevo.', 'error');
        this.cargando = false;
      },
    });
  }

  // -----------------------------------------------------------------------
  // HU-14: Inscribirse a una sesión
  // -----------------------------------------------------------------------

  inscribirse(sesion: CatalogoSesion): void {
    if (!this.authService.isLoggedIn) {
      this.toastService.mostrar('Debes iniciar sesión para inscribirte.', 'info');
      return;
    }

    this.toastService.preguntar(
      `¿Confirmas tu inscripción en "${sesion.titulo}" con ${sesion.tutorNombre}?`,
      () => this.ejecutarInscripcion(sesion),
    );
  }

  private ejecutarInscripcion(sesion: CatalogoSesion): void {
    this.inscribiendoId = sesion.id;
    this.inscripcionService.inscribirse(sesion.id).subscribe({
      next: () => {
        this.toastService.mostrar('¡Inscripción exitosa! Ya puedes verla en tu Agenda.', 'success');
        this.inscribiendoId = null;
        // Recargar catálogo para actualizar el cupo (o quitar tarjeta si llegó a 0)
        this.cargarCatalogo({ ...this.filtros });
      },
      error: (err) => {
        let msg = 'Error al inscribirte. Intenta de nuevo.';
        if (err.error) {
          msg = typeof err.error === 'string' ? err.error : (err.error.message || JSON.stringify(err.error));
        }
        this.toastService.mostrar(msg, 'error');
        this.inscribiendoId = null;
      },
    });
  }

  // -----------------------------------------------------------------------
  // Helpers de UI
  // -----------------------------------------------------------------------

  /** Retorna estrellas llenas / vacías / medias para la calificación */
  getEstrellas(calificacion: number | null): { llenas: number; media: boolean; vacias: number } {
    if (calificacion === null) return { llenas: 0, media: false, vacias: 0 };
    const llenas = Math.floor(calificacion);
    const media  = calificacion % 1 >= 0.5;
    const vacias = 5 - llenas - (media ? 1 : 0);
    return { llenas, media, vacias };
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

  hayFiltrosActivos(): boolean {
    return !!(this.filtros.materia?.trim() || this.filtros.tutor?.trim() || this.filtros.fecha);
  }
}
