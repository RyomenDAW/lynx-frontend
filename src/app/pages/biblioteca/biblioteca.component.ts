import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibliotecaService } from './biblioteca.service';
import { JuegoBiblioteca } from './biblioteca.model';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './biblioteca.component.html',
  styleUrls: ['./biblioteca.component.scss']
})
export class BibliotecaComponent implements OnInit, OnDestroy {
  biblioteca: any[] = [];
  bibliotecaFiltrada: any[] = [];

  filtroNombre: string = '';
  filtroFavoritos: boolean = false;

  successMessage: string | null = null;
  errorMessage: string | null = null;

  juegoEnCurso: any = null;                          // JUEGO ACTUAL EN USO
  inicioSesionActual: number | null = null;          // CUÁNDO EMPEZÓ
  usuarioJugando: string | null = null;              // ESTADO DE PERFIL GLOBAL
  cargando: boolean = true;

  constructor(private bibliotecaService: BibliotecaService) { }

  ngOnInit(): void {
    this.cargarBiblioteca();
  }

  ngOnDestroy(): void {
    // SI EL USUARIO SE VA Y ESTABA JUGANDO → SE GUARDA EL TIEMPO JUGADO
    this.finalizarSesionEnCurso();
  }

cargarBiblioteca() {
  this.cargando = true; // ACTIVAMOS EL ESQUELETO

  this.bibliotecaService.getBiblioteca().subscribe({
    next: (data) => {
      this.biblioteca = data.map(juego => ({
        ...juego,
        minutosPersonalizados: 15
      }));
      this.aplicarFiltros();

      // RECUPERAR JUEGO ACTIVO SI EXISTE EN LOCALSTORAGE
      const idJuegoActivo = localStorage.getItem('juego_en_curso_id');
      const inicioSesionGuardado = localStorage.getItem('inicio_sesion_actual');

      if (idJuegoActivo && inicioSesionGuardado) {
        const juegoActivo = this.biblioteca.find(j => j.id.toString() === idJuegoActivo);
        if (juegoActivo) {
          this.juegoEnCurso = juegoActivo;
          this.inicioSesionActual = parseInt(inicioSesionGuardado);
          this.usuarioJugando = juegoActivo.juego.titulo;
        }
      }

      this.cargando = false; // DESACTIVAMOS EL ESQUELETO
    },
    error: (err) => {
      console.error('Error al cargar la biblioteca:', err);
      this.cargando = false; // AUNQUE FALLE, DESACTIVAMOS EL LOADER
      this.mostrarMensaje('error', 'Error al cargar la biblioteca.');
    }
  });
}


  aplicarFiltros() {
    const nombreLower = this.filtroNombre.toLowerCase();
    this.bibliotecaFiltrada = this.biblioteca.filter(juego => {
      const coincideNombre = juego.juego.titulo.toLowerCase().includes(nombreLower);
      const coincideFavorito = this.filtroFavoritos ? juego.favorito : true;
      return coincideNombre && coincideFavorito;
    });
  }

  actualizarFiltros() {
    this.aplicarFiltros();
  }

  marcarFavorito(juego: any) {
    this.bibliotecaService.toggleFavorito(juego.id).subscribe(res => {
      juego.favorito = res.favorito;
      this.aplicarFiltros();
    });
  }

  sumarTiempo(juego: any) {
    const minutos = Number(juego.minutosPersonalizados);
    if (!minutos || minutos <= 0) {
      this.mostrarMensaje('error', '❌ Ingresa un número válido de minutos.');
      return;
    }

    this.bibliotecaService.añadirTiempo(juego.id, juego.tiempo_jugado + minutos).subscribe(() => {
      juego.tiempo_jugado += minutos;
    });
  }

  eliminarJuego(juego: JuegoBiblioteca) {
    const confirmado = confirm('¿Estás seguro de que quieres eliminar este juego de tu biblioteca?');
    if (!confirmado) return;

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.bibliotecaService.eliminarJuego(juego.id, headers).subscribe({
      next: () => {
        this.biblioteca = this.biblioteca.filter(j => j.id !== juego.id);
        this.aplicarFiltros();

        this.mostrarMensaje('success', '✅ Juego eliminado correctamente.');

        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      },
      error: (err) => {
        console.error(err);
        this.mostrarMensaje('error', '❌ Error al eliminar el juego de la biblioteca.');
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    });
  }

confirmarEliminacion(juego: JuegoBiblioteca) {
  const dialog = document.createElement('dialog');
  dialog.style.padding = '20px';
  dialog.style.border = '2px solid red';
  dialog.style.borderRadius = '12px';
  dialog.style.background = '#111';
  dialog.style.color = 'white';
  dialog.style.fontFamily = 'Orbitron, sans-serif';
  dialog.style.boxShadow = '0 0 20px #ff0040aa';
  dialog.innerHTML = `
    <h3 style="margin-bottom: 20px;">¿Eliminar "${juego.juego.titulo}" de tu biblioteca?</h3>
    <div style="display: flex; justify-content: center; gap: 20px;">
      <button id="confirmar" style="padding: 10px 20px; background-color: #ff0040; color: white; border: none; border-radius: 6px; font-family: Orbitron;">Eliminar</button>
      <button id="cancelar" style="padding: 10px 20px; background-color: gray; color: white; border: none; border-radius: 6px; font-family: Orbitron;">Cancelar</button>
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  dialog.querySelector('#confirmar')?.addEventListener('click', () => {
    this.eliminarJuego(juego);
    dialog.close();
    dialog.remove();
  });

  dialog.querySelector('#cancelar')?.addEventListener('click', () => {
    dialog.close();
    dialog.remove();
  });
}


  mostrarMensaje(tipo: 'success' | 'error', mensaje: string) {
    if (tipo === 'success') {
      this.successMessage = mensaje;
      setTimeout(() => this.successMessage = null, 4000);
    } else {
      this.errorMessage = mensaje;
      setTimeout(() => this.errorMessage = null, 4000);
    }
  }

  alternarJuego(juego: any) {
    const ahora = Date.now();

    // 🛑 YA ESTABA JUGANDO → PARAR Y GUARDAR
    if (this.juegoEnCurso?.id === juego.id) {
      const tiempoJugadoMs = ahora - this.inicioSesionActual!;
      const minutosJugados = Math.floor(tiempoJugadoMs / 60000);

      if (minutosJugados > 0) {
        this.bibliotecaService.añadirTiempo(juego.id, juego.tiempo_jugado + minutosJugados).subscribe(() => {
          juego.tiempo_jugado += minutosJugados;
          this.mostrarMensaje('success', `Has jugado ${minutosJugados} minutos a ${juego.juego.titulo}.`);
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        });
      }

      // 🔁 LIMPIAR ESTADO
      this.juegoEnCurso = null;
      this.inicioSesionActual = null;
      this.usuarioJugando = null;

      localStorage.removeItem('estado_actual');
      localStorage.removeItem('juego_en_curso_id');
      localStorage.removeItem('inicio_sesion_actual');
    }

    // ▶️ NO ESTABA JUGANDO → EMPIEZA
    else {
      this.juegoEnCurso = juego;
      this.inicioSesionActual = ahora;
      this.usuarioJugando = juego.juego.titulo;

      localStorage.setItem('estado_actual', juego.juego.titulo);
      localStorage.setItem('juego_en_curso_id', juego.id.toString());
      localStorage.setItem('inicio_sesion_actual', this.inicioSesionActual.toString());

      this.mostrarMensaje('success', `🎮 Estado actualizado: Jugando a ${juego.juego.titulo}`);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }


  // ⛔️ SI CIERRO SESIÓN / SALGO DEL COMPONENTE Y HAY JUEGO ACTIVO
  finalizarSesionEnCurso() {
    if (this.juegoEnCurso && this.inicioSesionActual) {
      const ahora = Date.now();
      const minutosJugados = Math.floor((ahora - this.inicioSesionActual) / 60000);
      if (minutosJugados > 0) {
        this.bibliotecaService.añadirTiempo(this.juegoEnCurso.id, this.juegoEnCurso.tiempo_jugado + minutosJugados).subscribe(() => {
          this.mostrarMensaje('success', `🕹️ Se guardaron ${minutosJugados} minutos de sesión en ${this.juegoEnCurso.juego.titulo}.`);
        });
      }
      this.usuarioJugando = null;
      // SOLO elimina estado_actual si estabas jugando y vas a cerrar completamente
      if (this.juegoEnCurso) {
        localStorage.setItem('estado_actual', this.juegoEnCurso.juego.titulo); // REASIGNA por seguridad
      }
    }

    // LIMPIAR VARIABLES
    this.juegoEnCurso = null;
    this.inicioSesionActual = null;
    this.usuarioJugando = null;
  }
}
