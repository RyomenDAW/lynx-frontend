import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SocialService } from './social.service';
import { Usuario, Amistad } from './social.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.scss']
})
export class SocialComponent implements OnInit {
  terminoBusqueda: string = '';
  resultadosBusqueda: Usuario[] = [];
  amigos: Usuario[] = [];
  solicitudes: Amistad[] = [];
  mensajeInfo: string | null = null;

  // CHAT
  mostrarChat: boolean = false;
  amigoSeleccionado: Usuario | null = null;
  mensajesPrivados: any[] = [];
  nuevoMensaje: string = '';
  username: string = localStorage.getItem('username') || '';

  constructor(private socialService: SocialService) { }

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
      this.resultadosBusqueda = [];
      this.mensajeInfo = '📨 Solicitud de amistad enviada.';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => this.mensajeInfo = null, 4000);
    });
  }


aceptarSolicitud(id: number) {
  this.socialService.aceptarSolicitud(id).subscribe(() => {
    this.recargarDatos();
    this.mensajeInfo = '✅ Solicitud aceptada correctamente.';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => this.mensajeInfo = null, 4000);
  });
}


rechazarSolicitud(id: number) {
  this.socialService.rechazarSolicitud(id).subscribe(() => {
    this.recargarDatos();
    this.mensajeInfo = '❌ Solicitud rechazada.';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => this.mensajeInfo = null, 4000);
  });
}

  eliminarAmigo(id: number) {
    if (confirm('¿Eliminar amigo?')) {
      this.socialService.eliminarAmigo(id).subscribe(() => {
        this.recargarDatos();
        this.mensajeInfo = '✅ Amigo eliminado correctamente.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => this.mensajeInfo = null, 4000);
      });
    }
  }


  esAmigo(id: number): boolean {
    return this.amigos.some(a => a.id === id);
  }

  // CHAT 🚀

  abrirChat(amigo: Usuario) {
    this.amigoSeleccionado = amigo;
    this.mensajesPrivados = [];
    this.nuevoMensaje = '';
    this.mostrarChat = true;

    this.socialService.obtenerChat(amigo.id).subscribe(data => {
      this.mensajesPrivados = data;
    });
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.amigoSeleccionado) return;

    const body = {
      receptor_id: this.amigoSeleccionado.id,
      contenido: this.nuevoMensaje
    };

    this.socialService.enviarMensaje(body).subscribe(() => {
      this.nuevoMensaje = '';
      // Refrescamos el chat actualizado
      this.abrirChat(this.amigoSeleccionado!);
    });
  }

  cerrarChat() {
    this.mostrarChat = false;
    this.amigoSeleccionado = null;
    this.mensajesPrivados = [];
    this.nuevoMensaje = '';
  }
}
