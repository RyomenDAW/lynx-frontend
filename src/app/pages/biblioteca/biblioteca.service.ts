import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JuegoBiblioteca } from './biblioteca.model';

const API_URL = 'http://127.0.0.1:8000/api';

@Injectable({
  providedIn: 'root'
})
export class BibliotecaService {
  private apiUrl = API_URL + '/biblioteca/';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getBiblioteca(): Observable<JuegoBiblioteca[]> {
    return this.http.get<JuegoBiblioteca[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  toggleFavorito(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}${id}/favorito/`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  añadirTiempo(id: number, minutos: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}${id}/`, { tiempo_jugado: minutos }, {
      headers: this.getAuthHeaders()
    });
  }

    eliminarJuego(id: number, headers: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`, { headers });
    }


}
