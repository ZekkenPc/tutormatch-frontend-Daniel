import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PreguntaDto {
  id: string;
  sesionId: string;
  alumnoId: string;
  alumnoNombre: string;
  pregunta: string;
  respuesta?: string;
  creadoEn: string;
  respondidoEn?: string;
}

export interface PreguntaForm {
  pregunta: string;
}

export interface RespuestaForm {
  respuesta: string;
}

@Injectable({
  providedIn: 'root',
})
export class PreguntaService {
  private apiUrl = `${environment.apiGatewayUrl}/core/sesiones-tutorias`;

  constructor(private http: HttpClient) {}

  listar(sesionId: string): Observable<PreguntaDto[]> {
    return this.http.get<PreguntaDto[]>(`${this.apiUrl}/${sesionId}/preguntas`);
  }

  crear(sesionId: string, form: PreguntaForm): Observable<PreguntaDto> {
    return this.http.post<PreguntaDto>(`${this.apiUrl}/${sesionId}/preguntas`, form);
  }

  responder(sesionId: string, preguntaId: string, form: RespuestaForm): Observable<PreguntaDto> {
    return this.http.post<PreguntaDto>(`${this.apiUrl}/${sesionId}/preguntas/${preguntaId}/respuesta`, form);
  }

  eliminar(sesionId: string, preguntaId: string) {
    return this.http.delete<void>(`${this.apiUrl}/${sesionId}/preguntas/${preguntaId}`);
  }
}
