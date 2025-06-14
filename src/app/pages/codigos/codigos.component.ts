import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';

interface Videojuego {
  id: number;
  titulo: string;
}

@Component({
  selector: 'app-codigos',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './codigos.component.html',
  styleUrls: ['./codigos.component.scss']
})
export class CodigosComponent implements OnInit {
  codigo: string = '';
  mensaje: string = '';
  error: string = '';
  esAdminODist: boolean = false;
  videojuegos: Videojuego[] = [];

  nuevoCodigo = {
    codigo_texto: '',
    saldo_extra: 0,
    videojuego: '' as number | '', // puede ser id numérico o vacío
    usos_totales: 1,
    fecha_expiracion: '',
    descripcion: '',
  };

  private API_CANJEAR = `${environment.apiUrl}/codigos/canjear/`;
  private API_CODIGOS = `${environment.apiUrl}/codigos/`;
  private API_VIDEOJUEGOS = `${environment.apiUrl}/videojuegos/`;

constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.esAdminODist = payload.rol === 'ADMIN' || payload.rol === 'DIST';
    }

    // Cargar videojuegos de la tienda
    this.http.get<Videojuego[]>(this.API_VIDEOJUEGOS).subscribe({
      next: juegos => this.videojuegos = juegos,
      error: err => {
        console.error('Error al cargar videojuegos:', err);
        this.videojuegos = [];
      }
    });
  }

  canjearCodigo(): void {
    this.mensaje = '';
    this.error = '';
    const token = localStorage.getItem('access_token');

    if (!this.codigo.trim()) {
      this.error = 'Introduce un código válido.';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.http.post<any>(this.API_CANJEAR, { codigo: this.codigo.trim() }, {
      headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` })
    }).subscribe({
      next: res => {
        this.mensaje = res.mensaje || '✅ Código canjeado correctamente';
        this.codigo = '';
        this.authService.fetchUserProfile();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => this.mensaje = '', 4000);

      },
      error: err => {
        this.error = err.error?.error || '❌ Error al canjear código.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => this.error = '', 4000);
      }
    });



    this.http.post<any>(this.API_CANJEAR, { codigo: this.codigo.trim() }, {
      headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` })
    }).subscribe({
      next: res => {
        this.mensaje = res.mensaje || 'Código canjeado correctamente';
        this.codigo = '';
      },
      error: err => {
        this.error = err.error?.error || 'Error al canjear código.';
      }
    });
  }

crearCodigo(): void {
  this.mensaje = '';
  this.error = '';
  const token = localStorage.getItem('access_token');

  const body = {
    codigo_texto: this.nuevoCodigo.codigo_texto.trim(),
    saldo_extra: this.nuevoCodigo.saldo_extra || 0,
    usos_totales: this.nuevoCodigo.usos_totales,
    descripcion: this.nuevoCodigo.descripcion?.trim() || '',
    fecha_expiracion: this.nuevoCodigo.fecha_expiracion,
    videojuego_id: this.nuevoCodigo.videojuego || null
  };

  if (!body.codigo_texto || !body.fecha_expiracion) {
    this.error = 'Todos los campos obligatorios deben completarse.';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  this.http.post(this.API_CODIGOS, body, {
    headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` })
  }).subscribe({
    next: () => {
      this.mensaje = '✅ Código creado correctamente';
      this.nuevoCodigo = {
        codigo_texto: '',
        saldo_extra: 0,
        videojuego: '',
        usos_totales: 1,
        fecha_expiracion: '',
        descripcion: ''
      };
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => this.mensaje = '', 4000);
    },
    error: err => {
      this.error = err.error?.error || '❌ Error al crear el código';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => this.error = '', 4000);
    }
  });
}

}
