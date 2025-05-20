import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibliotecaService } from './biblioteca.service';
import { JuegoBiblioteca } from './biblioteca.model';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // ← NECESARIO PARA [(ngModel)]

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './biblioteca.component.html',
  styleUrls: ['./biblioteca.component.scss']
})
export class BibliotecaComponent implements OnInit {
  biblioteca: any[] = []; // ← EXTENDIDO para añadir minutosPersonalizados

  constructor(private bibliotecaService: BibliotecaService) { }

  ngOnInit(): void {
    this.cargarBiblioteca();
  }

  cargarBiblioteca() {
    this.bibliotecaService.getBiblioteca().subscribe(data => {
      this.biblioteca = data.map(juego => ({
        ...juego,
        minutosPersonalizados: 15 // ← VALOR POR DEFECTO
      }));
    });
  }

  marcarFavorito(juego: any) {
    this.bibliotecaService.toggleFavorito(juego.id).subscribe(res => {
      juego.favorito = res.favorito;
    });
  }

  sumarTiempo(juego: any) {
    const minutos = Number(juego.minutosPersonalizados);
    if (!minutos || minutos <= 0) {
      alert('❌ Ingresa un número válido de minutos.');
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
        // Lo eliminamos del array local
        this.biblioteca = this.biblioteca.filter(j => j.id !== juego.id);
      },
      error: (err) => {
        console.error(err);
        alert('❌ Error al eliminar el juego de la biblioteca.');
      }
    });
  }


confirmarEliminacion(juego: JuegoBiblioteca) {
  this.eliminarJuego(juego);
}

}
