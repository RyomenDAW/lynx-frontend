import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = 'http://127.0.0.1:8000/api/token/';
  private profileUrl = 'http://127.0.0.1:8000/api/usuarios/me/';
  private userSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, private router: Router) {
    const token = this.getToken();
    if (token) {
      this.fetchUserProfile();
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { username, password }).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access);

        // Esperamos un pelín para asegurar que el token esté guardado antes del fetch
        setTimeout(() => {
          this.fetchUserProfile();
        }, 50);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  fetchUserProfile() {
    const token = this.getToken();
    if (!token) return;

    const headers = {
      Authorization: `Bearer ${token}`
    };

    this.http.get<any>(this.profileUrl, { headers }).subscribe(profile => {
      console.log('✅ Perfil recibido:', profile);
      this.userSubject.next(profile);
    }, err => {
      console.error('❌ Error al obtener perfil manualmente:', err);
    });
  }

  getPerfil(): Observable<any> {
  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  return this.http.get<any>('http://127.0.0.1:8000/api/usuarios/me/', { headers });
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  get user$() {
    return this.userSubject.asObservable();
  }
}
