import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerfilService } from './perfil.service';
import { PerfilUsuario, JuegoBiblioteca } from './perfil.model';
import { HttpClientModule } from '@angular/common/http';
import { Usuario } from '../social/social.model'; // <-- AÑADE ESTA IMPORTACIÓN
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  perfil!: PerfilUsuario;
  juegoFavorito: JuegoBiblioteca | null = null;

  amigos: Usuario[] = [];
  usuarioLogueadoId: number = Number(localStorage.getItem('user_id'));

  constructor(private perfilService: PerfilService, private authService: AuthService) { }


  get estadoActual(): string | null {
    return localStorage.getItem('estado_actual');
  }


  ngOnInit(): void {

    this.perfilService.getPerfil().subscribe(data => {
      this.perfil = data;
      this.calcularJuegoFavorito();
    });
  }




  calcularJuegoFavorito(): void {
    const jugados = this.perfil.biblioteca?.filter(j => j.tiempo_jugado > 0) || [];
    if (jugados.length) {
      this.juegoFavorito = jugados.sort((a, b) => b.tiempo_jugado - a.tiempo_jugado)[0];
    }
  }

  cambiarImagen(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.perfilService.cambiarAvatar(base64).subscribe(() => {
        this.perfil.avatar_base64 = base64;
        this.authService.fetchUserProfile();

      });
    };
    reader.readAsDataURL(file);

  }


}
