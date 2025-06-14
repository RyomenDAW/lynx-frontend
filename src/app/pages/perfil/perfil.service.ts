import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PerfilUsuario } from './perfil.model';

const API_URL = '${environment.apiUrl}/usuarios/perfil/';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  constructor(private http: HttpClient) {}

  getPerfil(): Observable<PerfilUsuario> {
    const token = localStorage.getItem('access_token'); // 🔥 TU NOMBRE EXACTO
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<PerfilUsuario>(API_URL, { headers }); // ✅ CON HEADERS
  }

  cambiarAvatar(base64: string): Observable<any> {
    const token = localStorage.getItem('access_token'); // 🔥 TAMBIÉN AQUÍ
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.patch(API_URL, { avatar_base64: base64 }, { headers }); // ✅ CABEZERAS A MANO
  }
}
