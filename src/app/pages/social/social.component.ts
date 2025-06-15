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
    const dialog = document.createElement('dialog');
    dialog.style.padding = '20px';
    dialog.style.border = '2px solid #00f0ff';
    dialog.style.borderRadius = '12px';
    dialog.style.background = '#111';
    dialog.style.color = '#fff';
    dialog.style.fontFamily = 'Orbitron, sans-serif';
    dialog.style.boxShadow = '0 0 20px #00f0ff';
    dialog.style.textAlign = 'center';
    dialog.style.width = '400px';
    dialog.innerHTML = `
    <h3 style="margin-bottom: 15px; font-size: 18px;">¿Estás seguro de que deseas eliminar a este amigo?</h3>
    <div style="display: flex; justify-content: center; gap: 12px;">
      <button id="confirmar" style="
        padding: 10px 20px;
        background-color: #00f0ff;
        border: none;
        color: black;
        font-weight: bold;
        border-radius: 6px;
        font-family: Orbitron, sans-serif;
        cursor: pointer;
        transition: transform 0.2s;
      ">Eliminar</button>
      <button id="cancelar" style="
        padding: 10px 20px;
        background-color: #666;
        border: none;
        color: white;
        font-family: Orbitron, sans-serif;
        border-radius: 6px;
        cursor: pointer;
        transition: transform 0.2s;
      ">Cancelar</button>
    </div>
  `;

    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector('#confirmar')?.addEventListener('click', () => {
      this.socialService.eliminarAmigo(id).subscribe(() => {
        this.recargarDatos();
        this.mensajeInfo = '❌ Amigo eliminado correctamente.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => this.mensajeInfo = null, 4000);
      });

      dialog.close();
      dialog.remove();
    });

    dialog.querySelector('#cancelar')?.addEventListener('click', () => {
      dialog.close();
      dialog.remove();
    });
  }



  esAmigo(id: number): boolean {
    return this.amigos.some(a => a.id === id);
  }

  // CHAT 

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
