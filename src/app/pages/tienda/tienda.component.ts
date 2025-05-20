import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tienda.component.html',
  styleUrls: ['./tienda.component.scss']
})
export class TiendaComponent implements OnInit {
  videojuegos: any[] = [];
  userInfo: any = null;

  constructor(private http: HttpClient, private authService: AuthService) {}

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

    this.http.get<any[]>('http://127.0.0.1:8000/api/videojuegos/', { headers }).subscribe(videojuegos => {
      this.http.get<any[]>('http://127.0.0.1:8000/api/biblioteca/', { headers }).subscribe(biblioteca => {
        const comprados = biblioteca.map(b => b.juego.id);

        // Marcar juegos comprados
        this.videojuegos = videojuegos.map(juego => ({
          ...juego,
          comprado: comprados.includes(juego.id)
        }));
      });
    });
  }

  comprarVideojuego(juego: any) {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    if (juego.comprado) {
      alert('✅ Ya tienes este juego en tu biblioteca.');
      return;
    }

    const precio = parseFloat(juego.precio);
    const saldo = parseFloat(this.userInfo.saldo_virtual);

    if (saldo < precio) {
      alert('❌ No tienes saldo suficiente para comprar este juego.');
      return;
    }

    const body = { juego_id: juego.id };

    this.http.post('http://127.0.0.1:8000/api/biblioteca/comprar/', body, { headers }).subscribe({
      next: () => {
        alert('✅ Juego comprado correctamente.');
        juego.comprado = true;
        this.authService.getPerfil().subscribe(perfilActualizado => {
          this.userInfo = perfilActualizado;
        });

      },
      error: (err) => {
        console.error(err);
        const msg = err?.error?.error || '❌ Error al comprar el juego.';
        alert(msg);
      }
    });
  }

  eliminarJuego(id: number) {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    if (confirm('¿Estás seguro de que quieres eliminar este videojuego?')) {
      this.http.delete(`http://127.0.0.1:8000/api/videojuegos/${id}/`, { headers })
        .subscribe({
          next: () => {
            alert('✅ Videojuego eliminado correctamente.');
            this.cargarVideojuegos();
          },
          error: err => {
            console.error(err);
            alert('❌ Error al eliminar el videojuego.');
          }
        });
    }
  }
}
