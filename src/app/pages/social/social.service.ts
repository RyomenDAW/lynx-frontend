import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, Amistad } from './social.model';

const API_URL = 'http://127.0.0.1:8000/api/social/';

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  buscarUsuarios(nombre: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${API_URL}buscar/?q=${nombre}`, this.getHeaders());
  }

  enviarSolicitud(user_id: number): Observable<any> {
    return this.http.post(`${API_URL}solicitar/`, { receptor_id: user_id }, this.getHeaders());
  }

  listarAmigos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${API_URL}amigos/`, this.getHeaders());
  }

  listarSolicitudes(): Observable<Amistad[]> {
    return this.http.get<Amistad[]>(`${API_URL}solicitudes/`, this.getHeaders());
  }

  aceptarSolicitud(id: number): Observable<any> {
    return this.http.post(`${API_URL}${id}/aceptar/`, {}, this.getHeaders());
  }

  rechazarSolicitud(id: number): Observable<any> {
    return this.http.post(`${API_URL}${id}/rechazar/`, {}, this.getHeaders());
  }

  eliminarAmigo(id: number): Observable<any> {
    return this.http.delete(`${API_URL}${id}/`, this.getHeaders());
  }

  obtenerPerfilUsuario(id: number) {
    return this.http.get<Usuario>(`${API_URL}${id}/profile/`, this.getHeaders());
  }

  obtenerChat(amigoId: number) {
    return this.http.get<any[]>(`${API_URL}${amigoId}/chat/`, this.getHeaders());
  }

  enviarMensaje(body: { receptor_id: number, contenido: string }) {
    return this.http.post(`${API_URL}enviar_mensaje/`, body, this.getHeaders());
  }


}
