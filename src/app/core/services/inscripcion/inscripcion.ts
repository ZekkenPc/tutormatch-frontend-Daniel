import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// -----------------------------------------------------------------------
// Interfaces (DTOs) — coinciden con el backend
// -----------------------------------------------------------------------

/** Sesión en el catálogo público — SIN campo lugar (seguridad HU-13) */
export interface CatalogoSesion {
  id: string;
  tutorNombre: string;
  titulo: string;
  descripcion: string;
  fechaHora: string;
  cupoMaximo: number;
  cupoDisponible: number;
  inscritos: number;
  /** null = mostrar "Nuevo" en el frontend hasta que EP-05 implemente calificaciones */
  calificacion: number | null;
}

/** Sesión en la agenda del alumno — CON campo lugar revelado (HU-15) */
export interface AgendaAlumno {
  inscripcionId: string;
  sesionId: string;
  tutorNombre: string;
  titulo: string;
  descripcion: string;
  lugar: string;     // REVELADO solo a inscritos
  fechaHora: string;
  cupoMaximo: number;
  cupoDisponible: number;
  inscritos: number;
  fechaInscripcion: string;
}

// -----------------------------------------------------------------------
// Filtros del catálogo (opcionales)
// -----------------------------------------------------------------------
export interface FiltrosCatalogo {
  materia?: string;
  tutor?: string;
  fecha?: string;  // formato yyyy-MM-dd
}

// -----------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------

@Injectable({
  providedIn: 'root',
})
export class InscripcionService {
  private baseUrl = `${environment.apiGatewayUrl}/core`;

  constructor(private http: HttpClient) {}

  /**
   * HU-13: Obtiene el catálogo público con filtros opcionales.
   * No requiere autenticación.
   */
  getCatalogo(filtros: FiltrosCatalogo = {}): Observable<CatalogoSesion[]> {
    const params: any = {};
    if (filtros.materia) params['materia'] = filtros.materia;
    if (filtros.tutor)   params['tutor']   = filtros.tutor;
    if (filtros.fecha)   params['fecha']   = filtros.fecha;

    return this.http.get<CatalogoSesion[]>(`${this.baseUrl}/sesiones-tutorias/catalogo`, { params });
  }

  /**
   * HU-14: Inscribirse a una sesión.
   * El interceptor agrega el JWT automáticamente.
   */
  inscribirse(sesionId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/inscripciones`, { sesionId });
  }

  /**
   * HU-15: Obtiene la agenda del alumno autenticado.
   * El interceptor agrega el JWT. El backend revela el campo "lugar".
   */
  getAgendaAlumno(): Observable<AgendaAlumno[]> {
    return this.http.get<AgendaAlumno[]>(`${this.baseUrl}/inscripciones/mi-agenda`);
  }

  /**
   * HU-16: Cancela la inscripción del alumno.
   * @param inscripcionId ID de la inscripción (no de la sesión)
   */
  cancelarInscripcion(inscripcionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/inscripciones/${inscripcionId}`);
  }

  /** Verifica si el alumno autenticado está inscrito a una sesión específica. */
  estaInscrito(sesionId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/inscripciones/sesiones/${sesionId}/estado`);
  }
}
