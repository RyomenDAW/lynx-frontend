//=========================================
// IMPORTACIONES NECESARIAS
//=========================================
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-importar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importar.component.html',
  styleUrls: ['./importar.component.scss']
})
export class ImportarComponent {
  searchTerm = '';
  resultados: any[] = [];
  loading = false;
  error = '';
  mensaje = '';

  constructor(private http: HttpClient, private router: Router) {}

  convertirImagenABase64(url: string): Promise<string> {
    return fetch(url, { mode: 'cors' })
      .then(res => {
        if (!res.ok) throw new Error('No se pudo descargar la imagen.');
        return res.blob();
      })
      .then(blob => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (!base64.startsWith('data:image')) reject('Formato imagen inválido');
          else resolve(base64);
        };
        reader.onerror = () => reject('Error leyendo imagen como base64');
        reader.readAsDataURL(blob);
      }));
  }

  parsearFecha(fechaSteam: string): string | null {
    if (!fechaSteam) return null;
    const partes = fechaSteam.split(' ');
    if (partes.length !== 3) return null;

    const [día, mesStr, año] = partes;
    const meses: { [key: string]: string } = {
      'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
    };
    const mes = meses[mesStr.toLowerCase()] || '01';
    return `${año}-${mes}-${día.padStart(2, '0')}`;
  }

  buscar() {
    if (!this.searchTerm.trim()) return;

    this.loading = true;
    this.resultados = [];
    this.error = '';
    this.mensaje = '';

    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>('${environment.apiUrl}/steam-search/', {
      headers,
      params: { q: this.searchTerm }
    })
    .subscribe({
      next: res => {
        this.resultados = res.items || [];
        this.loading = false;
      },
      error: () => {
        this.error = '❌ Error al buscar en Steam.';
        this.loading = false;
      }
    });
  }


  

  importarJuego(juego: any) {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    this.mensaje = 'Importando juego...';

    this.http.get<any>(`${environment.apiUrl}/steam-details/?appid=${juego.id}`, { headers })
      .subscribe({
        next: async res => {
          const data = res[juego.id]?.data;
          if (!data) {
            this.mensaje = '❌ No se pudo obtener detalles del juego/DLC.';
            return;
          }

          const base64 = data.header_image
          ? await this.convertirImagenABase64(data.header_image).catch(() => '')
          : (juego.tiny_image
            ? await this.convertirImagenABase64(juego.tiny_image).catch(() => '')
            : '');


          const precio = juego.price?.final
            ? (parseFloat(juego.price.final) / 100).toFixed(2)
            : '0';

          const videojuego = {
            titulo: data.name || juego.name,
            descripcion: data.short_description || 'Contenido adicional (DLC).',
            desarrollador: data.developers?.[0] || 'Desconocido',
            distribuidor: data.publishers?.[0] || 'Desconocido',
            genero: data.genres?.map((g: any) => g.description).join(', ') || 'DLC',
            plataforma: data.platforms?.windows ? 'PC' : 'Otro',
            requisitos_minimos: data.pc_requirements?.minimum || 'No especificados',
            requisitos_recomendados: data.pc_requirements?.recommended || 'No especificados',
            soporte_mando: data.controller_support === 'full',
            fecha_lanzamiento: this.parsearFecha(data.release_date?.date) || new Date().toISOString().split('T')[0],
            precio: precio,
            imagen_portada_base64: base64,
            disponible: true
          };

          console.log('📦 Enviando:', videojuego);

          this.http.post('${environment.apiUrl}/videojuegos/', videojuego, { headers })
            .subscribe({
              next: () => {
                this.mensaje = '✅ Videojuego importado correctamente.';
                this.router.navigate(['/tienda']);
              },
              error: err => {
                console.error(err);
                this.mensaje = '❌ Error al importar el videojuego.';
              }
            });
        },
        error: err => {
          console.error(err);
          this.mensaje = '❌ Error al contactar con Steam.';
        }
      });
  }
}
