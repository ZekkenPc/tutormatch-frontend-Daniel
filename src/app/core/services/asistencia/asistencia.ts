import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AlumnoAsistencia {
  alumnoId: string;
  inscripcionId: string;
  nombreCompleto: string;
  correo: string;
  estado: 'PRESENTE' | 'AUSENTE' | 'PENDIENTE' | 'NO_MARCADA';
  puedeMarcar: boolean;
  marcadoEn: string | null;
}

export interface HistorialAsistencia {
  sesionId: string;
  tituloSesion: string;
  tutorNombre: string;
  fechaHora: string;
  estado: 'PRESENTE' | 'AUSENTE' | 'PENDIENTE' | 'NO_MARCADA';
}

@Injectable({
  providedIn: 'root',
})
export class AsistenciaService {
  private baseUrl = `${environment.apiGatewayUrl}/core`;

  constructor(private http: HttpClient) {}

  /** TUTOR: lista de alumnos inscritos + su estado de asistencia en una sesión. */
  listarAsistenciaDeSesion(sesionId: string): Observable<AlumnoAsistencia[]> {
    return this.http.get<AlumnoAsistencia[]>(`${this.baseUrl}/sesiones/${sesionId}/asistencia`);
  }

  /** TUTOR: marca la asistencia de un alumno (PRESENTE | AUSENTE). */
  marcarAsistencia(sesionId: string, alumnoId: string, estado: 'PRESENTE' | 'AUSENTE'): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/sesiones/${sesionId}/asistencia/${alumnoId}`, { estado });
  }

  /** ALUMNO: historial personal de asistencia en todas sus sesiones pasadas. */
  getMiHistorial(): Observable<HistorialAsistencia[]> {
    return this.http.get<HistorialAsistencia[]>(`${this.baseUrl}/asistencia/mi-historial`);
  }
}