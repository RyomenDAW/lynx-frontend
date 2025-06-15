// src/app/pages/tienda/crear.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-crear-videojuego',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear.component.html',
  styleUrls: ['./crear.component.scss']
})
export class CrearVideojuegoComponent {
  juegoForm: FormGroup;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.juegoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      desarrollador: ['', [Validators.required, Validators.minLength(2)]],
      distribuidor: ['', [Validators.required, Validators.minLength(2)]],
      genero: ['', [Validators.required, Validators.minLength(3)]],
      plataforma: ['', [Validators.required, Validators.minLength(2)]],
      precio: [null, [Validators.required, Validators.min(0.01)]],
      fecha_lanzamiento: ['', Validators.required],
      requisitos_minimos: ['', [Validators.required, Validators.minLength(5)]],
      requisitos_recomendados: ['', [Validators.required, Validators.minLength(5)]],
      imagen_portada: [null]
    });
  }

  onImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.juegoForm.patchValue({
          imagen_portada: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  }

  crearJuego() {
    if (this.juegoForm.valid) {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      this.http.post(`${environment.apiUrl}/videojuegos/`, this.juegoForm.value, { headers }).subscribe({
        next: () => {
          this.successMessage = '✅ Videojuego creado correctamente.';
          this.errorMessage = '';
          setTimeout(() => {
            this.juegoForm.reset();
            this.router.navigate(['/tienda']);
          }, 2000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || '❌ Error al crear el videojuego.';
          this.successMessage = '';
        }
      });
    } else {
      this.errorMessage = '❌ Rellena todos los campos correctamente antes de enviar.';
      this.successMessage = '';
    }
  }


}
