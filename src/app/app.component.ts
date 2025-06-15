import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations'; // 🚀 AÑADIR ESTO


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(20px)', filter: 'brightness(0.8) blur(2px)' }),
        animate('0.6s ease-in-out',
          style({ opacity: 1, transform: 'translateY(0)', filter: 'brightness(1) blur(0)' }))
      ])
    ])
  ]
})

export class AppComponent implements OnInit {
  userInfo: any = null;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // FORZAMOS QUE SE CARGUE EL PERFIL EN CADA REFRESH
    const token = this.authService.getToken();
    if (token) {
      this.authService.fetchUserProfile();
    }

    // ⏳ SIEMPRE NOS SUSCRIBIMOS AL CAMBIO
    this.authService.user$.subscribe(user => {
      this.userInfo = user;
    });
  }

  logout() {
    this.authService.logout();
  }

confirmLogout() {
  const dialog = document.createElement('dialog');
  dialog.style.padding = '20px';
  dialog.style.border = '2px solid #00f0ff'; // BORDE MÁS DESTACADO
  dialog.style.borderRadius = '12px';
  dialog.style.background = '#111';
  dialog.style.color = '#fff';
  dialog.style.fontFamily = 'Orbitron, sans-serif';
  dialog.style.boxShadow = '0 0 25px #00f0ff';
  dialog.style.textAlign = 'center';
  dialog.innerHTML = `
    <h3 style="margin-bottom: 20px; font-size: 18px;">¿Estás seguro de que deseas cerrar sesión?</h3>
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
      ">Aceptar</button>
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
    this.logout();
    dialog.close();
    dialog.remove();
  });

  dialog.querySelector('#cancelar')?.addEventListener('click', () => {
    dialog.close();
    dialog.remove();
  });
}





}

