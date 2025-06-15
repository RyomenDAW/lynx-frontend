import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { RouterModule } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms'; //buscador
import { forkJoin } from 'rxjs';

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
  cargando: boolean = true;

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
    this.cargando = true;
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    forkJoin({
      videojuegos: this.http.get<any[]>(`${environment.apiUrl}/videojuegos/`, { headers }),
      biblioteca: this.http.get<any[]>(`${environment.apiUrl}/biblioteca/`, { headers })
    }).subscribe({
      next: ({ videojuegos, biblioteca }) => {
        const comprados = biblioteca.map(b => b.juego.id);
        this.videojuegos = videojuegos.map(juego => ({
          ...juego,
          comprado: comprados.includes(juego.id)
        }));
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = '❌ Error al cargar los datos';
        this.cargando = false;
      }
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
      this.cdRef.detectChanges();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    //  MODAL DE CONFIRMACIÓN LYNX
    const dialog = document.createElement('dialog');
    dialog.style.padding = '20px';
    dialog.style.border = 'none';
    dialog.style.borderRadius = '10px';
    dialog.style.background = '#111';
    dialog.style.color = '#fff';
    dialog.style.fontFamily = 'Orbitron, sans-serif';
    dialog.style.boxShadow = '0 0 20px #00f0ff';
    dialog.innerHTML = `
    <h3 style="margin-bottom: 15px;">¿Comprar <span style="color:#00f0ff">${juego.titulo}</span> por <span style="color:#00f0ff">${juego.precio}€</span>?</h3>
    <div style="display: flex; justify-content: center; gap: 10px;">
      <button id="confirmar" style="padding: 8px 16px; background-color: #00f0ff; border: none; color: black; font-weight: bold; border-radius: 5px; font-family: Orbitron;">Confirmar</button>
      <button id="cancelar" style="padding: 8px 16px; background-color: gray; border: none; color: white; border-radius: 5px; font-family: Orbitron;">Cancelar</button>
    </div>
  `;

    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector('#confirmar')?.addEventListener('click', () => {
      dialog.close();
      dialog.remove();

      const body = { juego_id: juego.id };

      this.http.post(`${environment.apiUrl}/biblioteca/comprar/`, body, { headers }).subscribe({
        next: () => {
          juego.comprado = true;
          this.authService.fetchUserProfile();
          this.mostrarMensaje('success', '✅ Juego comprado correctamente.');
          this.cdRef.detectChanges();
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
          this.cdRef.detectChanges();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    dialog.querySelector('#cancelar')?.addEventListener('click', () => {
      dialog.close();
      dialog.remove();
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



  //======================================================================
  // USO DE forkJoin PARA OPTIMIZAR PETICIONES EN PARALELO:
  //----------------------------------------------------------------------
  // forkJoin permite lanzar múltiples peticiones HTTP al mismo tiempo 
  // y esperar a que todas finalicen. Aquí se usa para pedir los videojuegos
  // y la biblioteca en paralelo, reduciendo el tiempo total de carga.
  //
  // En vez de esperar a que /videojuegos termine para luego hacer /biblioteca,
  // ambas se lanzan a la vez. Cuando ambas terminan, se continúa.
  //
  // Esto mejora el rendimiento notablemente frente a peticiones encadenadas,
  // sobre todo en entornos lentos como t2.micro o redes con latencia.
  //
  // Al suscribirse a forkJoin({ a, b }), se recibe un objeto con ambas respuestas,
  // que se puede desestructurar fácilmente en { videojuegos, biblioteca }.
  //======================================================================

  eliminarJuego(id: number) {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    // MODAL DE CONFIRMACIÓN PERO PARA ELIMINAR
    const dialog = document.createElement('dialog');
    dialog.style.padding = '20px';
    dialog.style.border = 'none';
    dialog.style.borderRadius = '10px';
    dialog.style.background = '#111';
    dialog.style.color = '#fff';
    dialog.style.fontFamily = 'Orbitron, sans-serif';
    dialog.style.boxShadow = '0 0 20px #ff0040';
    dialog.innerHTML = `
    <h3 style="margin-bottom: 15px;">¿Eliminar este videojuego?</h3>
    <div style="display: flex; justify-content: center; gap: 10px;">
      <button id="confirmar" style="padding: 8px 16px; background-color: #ff0040; border: none; color: white; font-weight: bold; border-radius: 5px; font-family: Orbitron;">Eliminar</button>
      <button id="cancelar" style="padding: 8px 16px; background-color: gray; border: none; color: white; border-radius: 5px; font-family: Orbitron;">Cancelar</button>
    </div>
  `;

    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector('#confirmar')?.addEventListener('click', () => {
      dialog.close();
      dialog.remove();

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
    });

    dialog.querySelector('#cancelar')?.addEventListener('click', () => {
      dialog.close();
      dialog.remove();
    });
  }


  videojuegosFiltrados(): any[] {
    const filtro = this.busqueda.toLowerCase();
    return this.videojuegos.filter(j => j.titulo.toLowerCase().includes(filtro));
  }

}
