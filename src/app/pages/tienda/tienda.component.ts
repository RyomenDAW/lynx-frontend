import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { RouterModule } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms'; //buscador
@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tienda.component.html',
  styleUrls: ['./tienda.component.scss']
})
export class TiendaComponent implements OnInit {
  videojuegos: any[] = [];
  userInfo: any = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  busqueda: string = ''; //buscador

  constructor(private http: HttpClient, private authService: AuthService, private cdRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.userInfo = user;
    });

    this.cargarVideojuegos();
  }

  tienePermiso(): boolean {
    return this.userInfo && (this.userInfo.rol === 'ADMIN' || this.userInfo.rol === 'DIST');
  }

  cargarVideojuegos() {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any[]>(`${environment.apiUrl}/videojuegos/`, { headers }).subscribe(videojuegos => {
      this.http.get<any[]>(`${environment.apiUrl}/biblioteca/`, { headers }).subscribe(biblioteca => {
        const comprados = biblioteca.map(b => b.juego.id);

        this.videojuegos = videojuegos.map(juego => ({
          ...juego,
          comprado: comprados.includes(juego.id)
        }));
      });
    });
  }

  mostrarMensaje(tipo: 'success' | 'error', mensaje: string) {
    if (tipo === 'success') {
      this.successMessage = mensaje;
      setTimeout(() => this.successMessage = null, 3000);
    } else {
      this.errorMessage = mensaje;
      setTimeout(() => this.errorMessage = null, 3000);
    }
  }

comprarVideojuego(juego: any) {
  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  if (juego.comprado) {
    this.mostrarMensaje('success', '✅ Ya tienes este juego en tu biblioteca.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const precio = parseFloat(juego.precio);
  const saldo = parseFloat(this.userInfo.saldo_virtual);

  if (saldo < precio) {
    this.mostrarMensaje('error', '❌ No tienes saldo suficiente para comprar este juego.');
    this.cdRef.detectChanges(); // ⬅️ FORZAMOS QUE SE PINTE
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const body = { juego_id: juego.id };

  this.http.post(`${environment.apiUrl}/biblioteca/comprar/`, body, { headers }).subscribe({
    next: () => {
      juego.comprado = true;
      this.authService.fetchUserProfile();
      this.mostrarMensaje('success', '✅ Juego comprado correctamente.');
      this.cdRef.detectChanges(); // cdref 
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    error: (err) => {
      console.error(err);

      let msg = '❌ Error al comprar el juego.';
      if (err.error && typeof err.error === 'object') {
        msg = err.error.error || msg;
      } else if (typeof err.error === 'string') {
        msg = err.error;
      }

      this.mostrarMensaje('error', msg);
      this.cdRef.detectChanges(); // detectamos cambios?

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

//======================================================================
// FLUJO DE COMPRA Y USO DE ChangeDetectorRef:
//----------------------------------------------------------------------
// Angular actualiza la vista (DOM) de forma asincrónica tras los cambios.
// Esto significa que si lanzamos un `window.scrollTo()` justo después
// de mostrar un mensaje (como un error), puede que aún NO se haya renderizado.
//
// Al usar `this.cdRef.detectChanges()` FORZAMOS a Angular a refrescar el DOM
// inmediatamente, asegurando que el mensaje ya esté visible en pantalla
// antes de hacer el scroll.
//
// De este modo, `window.scrollTo({ top: 0 })` funcionará SIEMPRE, incluso
// cuando el flujo pasa por errores (bloque .error del subscribe) o validaciones
// locales (como saldo insuficiente).
//======================================================================


  eliminarJuego(id: number) {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    if (confirm('¿Estás seguro de que quieres eliminar este videojuego?')) {
      this.http.delete(`${environment.apiUrl}/videojuegos/${id}/`, { headers })
        .subscribe({
          next: () => {
            this.mostrarMensaje('success', '✅ Videojuego eliminado correctamente.');
            this.cargarVideojuegos();
          },
          error: err => {
            console.error(err);
            this.mostrarMensaje('error', '❌ Error al eliminar el videojuego.');
          }
        });
    }
  }

  videojuegosFiltrados(): any[] {
    const filtro = this.busqueda.toLowerCase();
    return this.videojuegos.filter(j => j.titulo.toLowerCase().includes(filtro));
  }

}
