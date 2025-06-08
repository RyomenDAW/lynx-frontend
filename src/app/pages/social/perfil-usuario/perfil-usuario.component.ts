import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Usuario } from '../social.model'; // <--- AÑADE ESTA IMPORTACIÓN

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.scss']
})
export class PerfilUsuarioComponent implements OnInit {
  usuario: any = null;
  amigos: Usuario[] = []; // <--- AÑADE ESTA LÍNEA
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  private getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get<any>(`http://127.0.0.1:8000/api/social/${id}/profile/`, this.getHeaders())
        .subscribe(res => {
          this.usuario = res;
        });
    }
  }

  volverASocial() {
    this.router.navigate(['/social']);
  }
}
