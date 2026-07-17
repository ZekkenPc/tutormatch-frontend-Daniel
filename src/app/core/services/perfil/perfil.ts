import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SesionHistorialTutor {
  id: string;
  titulo: string;
  descripcion: string;
  lugar: string;
  fechaHora: string;
  cupoMaximo: number;
  inscritos: number;
  estado: string;
  ventanaAsistenciaAbierta: boolean;
}

export interface EstadisticasTutor {
  sesionesImpartidas: number;
  alumnosAtendidos: number;
}

export interface EstadisticasAlumno {
  tutoriasRecibidas: number;
}

@Injectable({
  providedIn: 'root',
})
export class PerfilService {
  private baseUrl = `${environment.apiGatewayUrl}/core/perfil`;

  constructor(private http: HttpClient) {}

  getHistorialTutor(): Observable<SesionHistorialTutor[]> {
    return this.http.get<SesionHistorialTutor[]>(`${this.baseUrl}/historial-tutor`);
  }

  getEstadisticasTutor(): Observable<EstadisticasTutor> {
    return this.http.get<EstadisticasTutor>(`${this.baseUrl}/estadisticas-tutor`);
  }

  getEstadisticasAlumno(): Observable<EstadisticasAlumno> {
    return this.http.get<EstadisticasAlumno>(`${this.baseUrl}/estadisticas-alumno`);
  }
}