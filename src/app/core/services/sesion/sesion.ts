import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// -----------------------------------------------------------------------
// Interfaces (DTOs) — deben coincidir exactamente con el backend
// -----------------------------------------------------------------------

/** Respuesta del backend con los datos completos de una sesión */
export interface SesionResponse {
  id: string;
  tutorId: string;
  titulo: string;
  descripcion: string;
  lugar: string;
  fechaHora: string;      // ISO-8601: "2026-08-15T10:30:00"
  cupoMaximo: number;
  cupoDisponible: number;
  inscritos: number;      // calculado en backend (inscripciones CONFIRMADAS)
  estado: string;         // "ACTIVA" | "CANCELADA"
  creadoEn: string;
}

/** Body para CREAR una nueva sesión (POST) */
export interface SesionRequest {
  titulo: string;
  descripcion: string;
  lugar: string;
  fechaHora: string;      // ISO-8601 sin zona horaria: "2026-08-15T10:30:00"
  cupoMaximo: number;
}

/** Body para EDITAR una sesión existente (PUT) */
export interface SesionUpdate {
  titulo?: string;
  descripcion?: string;
  lugar?: string;
  fechaHora?: string;     // Solo si no hay inscritos (el backend valida)
  cupoMaximo?: number;
}

// -----------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------

@Injectable({
  providedIn: 'root',
})
export class SesionService {
  private apiUrl = `${environment.apiGatewayUrl}/core/sesiones-tutorias`;

  constructor(private http: HttpClient) {}

  /**
   * HU-10: Obtiene las sesiones ACTIVAS futuras del tutor autenticado,
   * ordenadas cronológicamente por el backend.
   */
  getAgenda(): Observable<SesionResponse[]> {
    return this.http.get<SesionResponse[]>(`${this.apiUrl}/mi-agenda`);
  }

  /**
   * HU-09: Publica una nueva sesión de tutoría.
   * El interceptor agrega el JWT automáticamente.
   */
  crear(datos: SesionRequest): Observable<SesionResponse> {
    return this.http.post<SesionResponse>(this.apiUrl, datos);
  }

  /**
   * HU-11: Edita una sesión existente del tutor.
   * Si la sesión tiene inscritos, el backend rechazará cambios de fecha.
   */
  actualizar(id: string, datos: SesionUpdate): Observable<SesionResponse> {
    return this.http.put<SesionResponse>(`${this.apiUrl}/${id}`, datos);
  }

  /**
   * HU-12: Cancela lógicamente una sesión (estado → CANCELADA).
   * Retorna 204 No Content en éxito.
   */
  cancelar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
