// src/app/pages/tienda/crear.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

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
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      desarrollador: ['', Validators.required],
      distribuidor: ['', Validators.required],
      genero: ['', Validators.required],
      plataforma: ['', Validators.required],
      precio: [0, [Validators.required, Validators.min(0)]],
      fecha_lanzamiento: ['', Validators.required],
      requisitos_minimos: ['', Validators.required],
      requisitos_recomendados: ['', Validators.required],
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
      this.http.post('${environment.apiUrl}/videojuegos/', this.juegoForm.value).subscribe({
        next: () => {
          this.successMessage = 'Videojuego creado correctamente.';
          this.juegoForm.reset();
          this.router.navigate(['/tienda']);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Error al crear el videojuego.';
        }
      });
    }
  }
}
