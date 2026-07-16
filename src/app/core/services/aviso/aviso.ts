import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AvisoDto {
  id: string;
  titulo: string;
  mensaje: string;
  creadoEn: string;
}

export interface AvisoForm {
  titulo: string;
  mensaje: string;
}

@Injectable({
  providedIn: 'root',
})
export class AvisoService {
  private apiUrl = `${environment.apiGatewayUrl}/core/avisos`;

  constructor(private http: HttpClient) {}

  listar(): Observable<AvisoDto[]> {
    return this.http.get<AvisoDto[]>(this.apiUrl);
  }

  crear(aviso: AvisoForm) {
    return this.http.post<AvisoDto>(this.apiUrl, aviso);
  }

  actualizar(id: string, aviso: AvisoForm) {
    return this.http.put<AvisoDto>(`${this.apiUrl}/${id}`, aviso);
  }

  eliminar(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
