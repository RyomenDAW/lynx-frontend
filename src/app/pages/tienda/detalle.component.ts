import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle.component.html',
  styleUrls: ['./detalle.component.scss']
})
export class DetalleComponent implements OnInit {

  videojuego: any = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const token = localStorage.getItem('access_token');

    if (!id) {
      this.router.navigate(['/tienda']);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>(`http://127.0.0.1:8000/api/videojuegos/${id}/`, { headers }).subscribe({
      next: (data) => {
        this.videojuego = data;
      },
      error: () => {
        alert('❌ Error al cargar el videojuego');
        this.router.navigate(['/tienda']);
      }
    });
  }
}
