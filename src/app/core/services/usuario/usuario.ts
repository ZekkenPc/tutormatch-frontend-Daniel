import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RegistroDto {
  nombre: string;
  email: string;
  password: string;
}

// IMPORTANTE: usamos un "string literal type" y NO un `enum` de TypeScript.
// Los enums numéricos de TS se serializan como 0/1/2 al mandarlos por HTTP,
// lo que no calza con la columna `estado_solicitud` (String/varchar) del backend.
// Este tipo solo valida en tiempo de compilación; en runtime sigue siendo
// un string plano igual al que espera el backend y la BD (en minúsculas).
export type EstadoSolicitud = 'pendiente' | 'aceptado' | 'rechazado';

// Perfil resumido del usuario autenticado (usado para saber si ya tiene
// una solicitud de tutor en curso, entre otras cosas)
export interface PerfilUsuario {
  id: string;
  nombre: string;
  email: string;
  estadoSolicitud: EstadoSolicitud | null;
  roles: string[];
}

// Traduce el valor "de cable" (el que manda/recibe el backend) a un texto
// amigable para mostrar en pantalla. El valor que viaja a la API NUNCA
// cambia; esto es puramente visual.
export function estadoSolicitudLabel(estado: EstadoSolicitud | null): string {
  switch (estado) {
    case 'pendiente':
      return 'Pendiente';
    case 'aceptado':
      return 'Aceptado';
    case 'rechazado':
      return 'Rechazado';
    default:
      return '';
  }
}

// HU-06: fila de la tabla de solicitudes pendientes que ve el Administrador
export interface SolicitudPendiente {
  id: string;
  nombre: string;
  email: string;
  justificacion: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  // API Gateway
  private apiUrl = `${environment.apiGatewayUrl}/usuarios`;

  // Inyectamos el HttpClient
  constructor(private http: HttpClient) {}

  // Método para registrar un nuevo usuario
  public registrar(datos: RegistroDto): Observable<string> {
    return this.http.post(`${this.apiUrl}/registro`, datos, { responseType: 'text' });
  }

  // HU-05: obtiene el perfil del usuario autenticado (rol y estado_solicitud actuales)
  public obtenerPerfil(): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.apiUrl}/me`);
  }

  // HU-05: envía la justificación para solicitar el rol de Tutor
  public solicitarTutor(justificacion: string): Observable<string> {
    return this.http.patch(
      `${this.apiUrl}/solicitud-tutor`,
      { justificacion },
      { responseType: 'text' },
    );
  }

  // HU-06: el Administrador obtiene todas las solicitudes de tutor pendientes de revisión
  public obtenerSolicitudesPendientes(): Observable<SolicitudPendiente[]> {
    return this.http.get<SolicitudPendiente[]>(`${this.apiUrl}/solicitudes-pendientes`);
  }

  // HU-07: el Administrador aprueba la solicitud de un usuario (pasa a ser TUTOR)
  public aprobarSolicitud(usuarioId: string): Observable<string> {
    return this.http.patch(`${this.apiUrl}/${usuarioId}/aprobar`, {}, { responseType: 'text' });
  }

  // HU-07: el Administrador rechaza la solicitud de un usuario (se mantiene ALUMNO)
  public rechazarSolicitud(usuarioId: string): Observable<string> {
    return this.http.patch(`${this.apiUrl}/${usuarioId}/rechazar`, {}, { responseType: 'text' });
  }
}
