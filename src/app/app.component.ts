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
    // 🚀 FORZAMOS QUE SE CARGUE EL PERFIL EN CADA REFRESH
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
    const confirmed = confirm('¿Estás seguro de que deseas cerrar sesión?');
    if (confirmed) this.logout();
  }



}

