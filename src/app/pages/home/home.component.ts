import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {

  userInfo: any = null;

  constructor(private authService: AuthService) {
    this.authService.user$.subscribe(user => {
      console.log('Usuario decodificado desde token:', user);
      this.userInfo = user;
    });
  }

  logout() {
    this.authService.logout();
  }
}
