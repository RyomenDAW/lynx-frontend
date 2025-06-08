import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.scss']
})
export class MarketplaceComponent {

  marketplaceItems: any[] = []; // ItemEnVenta
  userItems: any[] = []; // InventarioItem
  allItems: any[] = []; // Todos los Items (para admin)

  selectedItemId: number | null = null;
  precioVenta: number | null = null;

  username: string = localStorage.getItem('username') || '';
  rol: string = '';
  mostrarCrear: boolean = false;

  nuevoNombre: string = '';
  nuevoDescripcion: string = '';
  nuevoRareza: string = '';
  nuevoImagenBase64: string = '';
  nuevoJuegoId: number | null = null;
  asignarASiMismo: boolean = false;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.rol = payload.rol;
    }

    this.cargarMarketplace();
    this.cargarUserItems();

    if (this.rol === 'ADMIN') {
      this.cargarAllItems();
    }
  }

  cargarMarketplace(): void {
    const token = localStorage.getItem('access_token') || '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:8000/api/marketplace/', { headers })
      .subscribe({
        next: (data) => { this.marketplaceItems = data; },
        error: (error) => { console.error('Error al cargar marketplace:', error); }
      });
  }

cargarUserItems(): void {
    const token = localStorage.getItem('access_token') || '';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>('http://localhost:8000/api/inventario/', { headers })
      .subscribe({
        next: (inventario) => {
          // SIEMPRE → FILTRAMOS SOLO LOS ITEMS DEL USUARIO ACTUAL
          this.userItems = inventario.filter(entry => {
            // Caso 1 → usuario es objeto
            if (entry.usuario && entry.usuario.username) {
              return entry.usuario.username === this.username;
            }
            // Caso 2 → usuario es id
            const userId = parseInt(localStorage.getItem('user_id') || '0');
            if (typeof entry.usuario === 'number') {
              return entry.usuario === userId;
            }
            return false;
          });

          console.log('Tus ítems:', this.userItems);
        },
        error: (error) => {
          console.error('Error al cargar inventario:', error);
        }
      });
}


  cargarAllItems(): void {
    const token = localStorage.getItem('access_token') || '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:8000/api/items/', { headers })
      .subscribe({
        next: (items) => {
          this.allItems = items.map(item => ({
            ...item,
            asignarAUsername: ''
          }));
        },
        error: (error) => { console.error('Error al cargar todos los ítems:', error); }
      });
  }

  comprarItem(itemEnVentaId: number): void {
    const token = localStorage.getItem('access_token') || '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.post(`http://localhost:8000/api/marketplace/${itemEnVentaId}/comprar/`, {}, { headers })
      .subscribe({
        next: (response) => {
          alert('¡Compra realizada correctamente!');
          this.cargarMarketplace();
          this.cargarUserItems();
        },
        error: (error) => {
          alert('Error al comprar ítem: ' + (error.error?.error || 'Error desconocido'));
        }
      });
  }

  ponerEnVenta(): void {
    if (!this.selectedItemId || !this.precioVenta || this.precioVenta <= 0) {
      alert('Completa correctamente el formulario.');
      return;
    }

    const token = localStorage.getItem('access_token') || '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    const body = {
      item_id: this.selectedItemId,
      precio: this.precioVenta
    };

    this.http.post('http://localhost:8000/api/marketplace-venta/poner_en_venta/', body, { headers })
      .subscribe({
        next: (response) => {
          alert('Ítem puesto en venta correctamente!');
          this.selectedItemId = null;
          this.precioVenta = null;
          this.cargarMarketplace();
          this.cargarUserItems();
        },
        error: (error) => {
          alert('Error al poner en venta: ' + (error.error?.error || 'Error desconocido'));
        }
      });
  }

  crearItem(): void {
    if (!this.nuevoNombre || !this.nuevoDescripcion || !this.nuevoRareza || !this.nuevoImagenBase64) {
      alert('Completa todos los campos del formulario.');
      return;
    }

    const token = localStorage.getItem('access_token') || '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    const body = {
      nombre: this.nuevoNombre,
      descripcion: this.nuevoDescripcion,
      rareza: this.nuevoRareza,
      imagen_base64: this.nuevoImagenBase64,
      juego: this.nuevoJuegoId
    };

    this.http.post('http://localhost:8000/api/items/', body, { headers })
      .subscribe({
        next: (response: any) => {
          alert('¡Ítem creado correctamente!');

          if (this.asignarASiMismo && response.id) {
            this.asignarItemASiMismo(response.id);
          }

          this.nuevoNombre = '';
          this.nuevoDescripcion = '';
          this.nuevoRareza = '';
          this.nuevoImagenBase64 = '';
          this.nuevoJuegoId = null;
          this.asignarASiMismo = false;

          this.cargarUserItems();
          this.cargarAllItems();
        },
        error: (error) => {
          alert('Error al crear ítem: ' + (error.error?.error || 'Error desconocido'));
        }
      });
  }

  asignarItemASiMismo(itemId: number): void {
    const token = localStorage.getItem('access_token') || '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    const username = localStorage.getItem('username');

    const body = {
      username: username,
      item_id: itemId,
      cantidad: 1
    };

    this.http.post('http://localhost:8000/api/inventario/asignar_item/', body, { headers })
      .subscribe({
        next: () => {
          alert('Ítem asignado a tu cuenta');
          this.cargarUserItems();
          this.cargarAllItems();
        },
        error: () => {
          alert('Error al asignar ítem');
        }
      });
  }

  asignarItemAUsuario(itemId: number, username: string): void {
    const usernameFinal = username.trim();

    console.log('USERNAME A ENVIAR:', usernameFinal);

    if (!usernameFinal) {
      alert('Introduce un nombre de usuario válido');
      return;
    }

    const token = localStorage.getItem('access_token') || '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    const body = {
      username: usernameFinal,
      item_id: itemId,
      cantidad: 1
    };

    console.log('BODY A ENVIAR:', body);

    this.http.post('http://localhost:8000/api/inventario/asignar_item/', body, { headers })
      .subscribe({
        next: () => {
          alert(`Ítem asignado a ${usernameFinal}`);

          this.cargarAllItems();

          // SI ASIGNAS A TI MISMO → REFRESCA TUS ÍTEMS TAMBIÉN
          if (usernameFinal === this.username) {
            setTimeout(() => {
              this.cargarUserItems();
            }, 300);
          }
        },
        error: (error) => {
          console.error('ERROR EN LA RESPUESTA:', error);
          alert('Error al asignar ítem');
        }
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.nuevoImagenBase64 = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarItem(itemId: number): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este ítem? Esta acción no se puede deshacer.')) {
      return;
    }

    const token = localStorage.getItem('access_token') || '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.delete(`http://localhost:8000/api/items/${itemId}/`, { headers })
      .subscribe({
        next: () => {
          alert('Ítem eliminado correctamente');
          this.cargarAllItems();
        },
        error: () => {
          alert('Error al eliminar ítem');
        }
      });
  }

  eliminarItemEnVenta(itemEnVentaId: number): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este ítem de la tienda?')) {
      return;
    }

    const token = localStorage.getItem('access_token') || '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.delete(`http://localhost:8000/api/marketplace-venta/${itemEnVentaId}/`, { headers })
      .subscribe({
        next: () => {
          alert('Ítem eliminado de la tienda correctamente');
          this.cargarMarketplace();
          this.cargarUserItems();
        },
        error: () => {
          alert('Error al eliminar el ítem de la tienda');
        }
      });
  }

  eliminarCantidadItem(entry: any): void {
  const cantidadEliminar = entry.eliminarCantidad;

  if (!cantidadEliminar || cantidadEliminar <= 0) {
    alert('Introduce una cantidad válida.');
    return;
  }

  if (cantidadEliminar > entry.cantidad) {
    alert('No puedes eliminar más de lo que tienes.');
    return;
  }

  if (!confirm(`¿Estás seguro de que quieres eliminar ${cantidadEliminar} de "${entry.item.nombre}"?`)) {
    return;
  }

  const token = localStorage.getItem('access_token') || '';
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

  // Suponiendo que tienes una endpoint tipo: /api/inventario/eliminar_item/
  const body = {
    item_id: entry.item.id,
    cantidad: cantidadEliminar
  };

  this.http.post('http://localhost:8000/api/inventario/eliminar_item/', body, { headers })
    .subscribe({
      next: () => {
        alert(`Eliminado ${cantidadEliminar} de "${entry.item.nombre}".`);
        this.cargarUserItems();
      },
      error: () => {
        alert('Error al eliminar ítem.');
      }
    });
}

modalAbierto: string | null = null;
itemAEliminar: any = null;

abrirModal(tipo: string, item: any = null): void {
  this.modalAbierto = tipo;
  if (tipo === 'eliminar') {
    this.itemAEliminar = item;
    if (!this.itemAEliminar.eliminarCantidad) {
      this.itemAEliminar.eliminarCantidad = 1;
    }
  }
}

cerrarModal(): void {
  this.modalAbierto = null;
  this.itemAEliminar = null;
}


}
