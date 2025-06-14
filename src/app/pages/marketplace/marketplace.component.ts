import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.scss']
})
export class MarketplaceComponent {

  marketplaceItems: any[] = [];
  userItems: any[] = [];
  allItems: any[] = [];

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

  mensajeInfo: string = '';
  mensajeError: string = '';

  modalAbierto: string | null = null;
  itemAEliminar: any = null;

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

  mostrarMensaje(info: string, isError = false) {
    if (isError) {
      this.mensajeError = info;
    } else {
      this.mensajeInfo = info;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      this.mensajeInfo = '';
      this.mensajeError = '';
    }, 4000);
  }

  cargarMarketplace(): void {
    const headers = this.authHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/marketplace/`, { headers })
      .subscribe({
        next: data => this.marketplaceItems = data,
        error: err => this.mostrarMensaje('❌ Error al cargar marketplace', true)
      });
  }

  cargarUserItems(): void {
    const headers = this.authHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/inventario/`, { headers })
      .subscribe({
        next: inventario => {
          const userId = parseInt(localStorage.getItem('user_id') || '0');
          this.userItems = inventario.filter(entry =>
            (entry.usuario?.username === this.username) ||
            (typeof entry.usuario === 'number' && entry.usuario === userId)
          );
        },
        error: () => this.mostrarMensaje('❌ Error al cargar inventario', true)
      });
  }

  cargarAllItems(): void {
    const headers = this.authHeaders();
    this.http.get<any[]>(`${environment.apiUrl}/items/`, { headers })
      .subscribe({
        next: items => this.allItems = items.map(i => ({ ...i, asignarAUsername: '' })),
        error: () => this.mostrarMensaje('❌ Error al cargar ítems del sistema', true)
      });
  }

  comprarItem(itemEnVentaId: number): void {
    const headers = this.authHeaders();
    this.http.post(`${environment.apiUrl}/marketplace/${itemEnVentaId}/comprar/`, {}, { headers })
      .subscribe({
        next: () => {
          this.mostrarMensaje('✅ ¡Compra realizada correctamente!');
          this.cargarMarketplace();
          this.cargarUserItems();
        },
        error: err => this.mostrarMensaje(err.error?.error || '❌ Error al comprar ítem', true)
      });
  }

  ponerEnVenta(): void {
    if (!this.selectedItemId || !this.precioVenta || this.precioVenta <= 0) {
      this.mostrarMensaje('❌ Completa correctamente el formulario.', true);
      return;
    }

    const headers = this.authHeaders();
    const body = {
      item_id: this.selectedItemId,
      precio: this.precioVenta
    };

    this.http.post(`${environment.apiUrl}/marketplace-venta/poner_en_venta/`, body, { headers })
      .subscribe({
        next: () => {
          this.mostrarMensaje('✅ Ítem puesto en venta correctamente');
          this.selectedItemId = null;
          this.precioVenta = null;
          this.cargarMarketplace();
          this.cargarUserItems();
        },
        error: err => this.mostrarMensaje(err.error?.error || '❌ Error al poner en venta', true)
      });
  }

  crearItem(): void {
    if (!this.nuevoNombre || !this.nuevoDescripcion || !this.nuevoRareza || !this.nuevoImagenBase64) {
      this.mostrarMensaje('❌ Completa todos los campos del formulario.', true);
      return;
    }

    const headers = this.authHeaders();
    const body = {
      nombre: this.nuevoNombre,
      descripcion: this.nuevoDescripcion,
      rareza: this.nuevoRareza,
      imagen_base64: this.nuevoImagenBase64,
      juego: this.nuevoJuegoId
    };

    this.http.post(`${environment.apiUrl}/items/`, body, { headers })
      .subscribe({
        next: (res: any) => {
          this.mostrarMensaje('✅ ¡Ítem creado correctamente!');
          if (this.asignarASiMismo && res.id) this.asignarItemASiMismo(res.id);

          this.nuevoNombre = '';
          this.nuevoDescripcion = '';
          this.nuevoRareza = '';
          this.nuevoImagenBase64 = '';
          this.nuevoJuegoId = null;
          this.asignarASiMismo = false;

          this.cargarUserItems();
          this.cargarAllItems();
        },
        error: () => this.mostrarMensaje('❌ Error al crear ítem', true)
      });
  }

  eliminarItem(itemId: number): void {
    if (!confirm('¿Eliminar ítem?')) return;
    const headers = this.authHeaders();

    this.http.delete(`${environment.apiUrl}/items/${itemId}/`, { headers })
      .subscribe({
        next: () => {
          this.mostrarMensaje('✅ Ítem eliminado correctamente');
          this.cargarAllItems();      // ACTUALIZA ADMIN
          this.cargarMarketplace();   // ACTUALIZA VISTA GLOBAL
          this.cargarUserItems();     // ACTUALIZA INVENTARIO PROPIO
        },
        error: () => this.mostrarMensaje('❌ Error al eliminar ítem', true)
      });
  }


  eliminarItemEnVenta(itemEnVentaId: number): void {
    if (!confirm('¿Eliminar ítem de la tienda?')) return;
    const headers = this.authHeaders();

    this.http.delete(`${environment.apiUrl}/marketplace-venta/${itemEnVentaId}/`, { headers })
      .subscribe({
        next: () => {
          this.mostrarMensaje('✅ Ítem eliminado de la tienda correctamente');
          this.cargarMarketplace();
          this.cargarUserItems();
          this.cargarAllItems(); // NECESARIO PARA REFRESCAR ADMIN
        },
        error: () => this.mostrarMensaje('❌ Error al eliminar ítem de la tienda', true)
      });
  }


  eliminarCantidadItem(entry: any): void {
    const cantidad = entry.eliminarCantidad;
    if (!cantidad || cantidad <= 0) {
      this.mostrarMensaje('❌ Introduce una cantidad válida.', true);
      return;
    }

    if (cantidad > entry.cantidad) {
      this.mostrarMensaje('❌ No puedes eliminar más de lo que tienes.', true);
      return;
    }

    if (!confirm(`¿Eliminar ${cantidad} de "${entry.item.nombre}"?`)) return;

    const headers = this.authHeaders();
    const body = {
      item_id: entry.item.id,
      cantidad: cantidad
    };

    this.http.post(`${environment.apiUrl}/inventario/eliminar_item/`, body, { headers })
      .subscribe({
        next: () => {
          this.mostrarMensaje(`✅ Se eliminó correctamente "${entry.item.nombre}"`);
          this.cargarUserItems();
        },
        error: () => this.mostrarMensaje('❌ Error al eliminar ítem.', true)
      });
  }

  asignarItemASiMismo(itemId: number): void {
    const headers = this.authHeaders();
    const body = {
      username: this.username,
      item_id: itemId,
      cantidad: 1
    };

    this.http.post(`${environment.apiUrl}/inventario/asignar_item/`, body, { headers })
      .subscribe({
        next: () => {
          this.mostrarMensaje('✅ Ítem asignado a tu cuenta');
          this.cargarUserItems();
          this.cargarAllItems();
        },
        error: () => this.mostrarMensaje('❌ Error al asignar ítem.', true)
      });
  }

  asignarItemAUsuario(itemId: number, username: string): void {
    const usernameFinal = username.trim();
    if (!usernameFinal) {
      this.mostrarMensaje('❌ Introduce un nombre de usuario válido.', true);
      return;
    }

    const headers = this.authHeaders();
    const body = {
      username: usernameFinal,
      item_id: itemId,
      cantidad: 1
    };

    this.http.post(`${environment.apiUrl}/inventario/asignar_item/`, body, { headers })
      .subscribe({
        next: () => {
          this.mostrarMensaje(`✅ Ítem asignado a ${usernameFinal}`);
          this.cargarAllItems();

          if (usernameFinal === this.username) {
            setTimeout(() => this.cargarUserItems(), 300);
          }
        },
        error: () => this.mostrarMensaje('❌ Error al asignar ítem.', true)
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => this.nuevoImagenBase64 = e.target.result;
    reader.readAsDataURL(file);
  }

  abrirModal(tipo: string, item: any = null): void {
    this.modalAbierto = tipo;
    this.itemAEliminar = tipo === 'eliminar' ? item : null;
    if (this.itemAEliminar && !this.itemAEliminar.eliminarCantidad) {
      this.itemAEliminar.eliminarCantidad = 1;
    }
  }

  cerrarModal(): void {
    this.modalAbierto = null;
    this.itemAEliminar = null;
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }
}
