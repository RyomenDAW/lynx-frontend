import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SocialService } from './social.service';
import { Usuario, Amistad } from './social.model';

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.scss']
})
export class SocialComponent implements OnInit {
  terminoBusqueda: string = '';
  resultadosBusqueda: Usuario[] = [];
  amigos: Usuario[] = [];
  solicitudes: Amistad[] = [];

  constructor(private socialService: SocialService) {}

  ngOnInit(): void {
    this.recargarDatos();
  }

  recargarDatos() {
    this.socialService.listarAmigos().subscribe(res => this.amigos = res);
    this.socialService.listarSolicitudes().subscribe(res => this.solicitudes = res);
  }

  buscarUsuarios() {
    if (!this.terminoBusqueda.trim()) return;
    this.socialService.buscarUsuarios(this.terminoBusqueda).subscribe(res => {
      this.resultadosBusqueda = res;
    });
  }

  enviarSolicitud(id: number) {
    this.socialService.enviarSolicitud(id).subscribe(() => {
      alert('Solicitud enviada');
      this.resultadosBusqueda = [];
    });
  }

  aceptarSolicitud(id: number) {
    this.socialService.aceptarSolicitud(id).subscribe(() => this.recargarDatos());
  }

  rechazarSolicitud(id: number) {
    this.socialService.rechazarSolicitud(id).subscribe(() => this.recargarDatos());
  }

  eliminarAmigo(id: number) {
    if (confirm('¿Eliminar amigo?')) {
      this.socialService.eliminarAmigo(id).subscribe(() => this.recargarDatos());
    }
  }
}
