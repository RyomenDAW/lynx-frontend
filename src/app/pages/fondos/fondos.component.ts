import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

declare var paypal: any; // ✅ PayPal JS SDK global

@Component({
  selector: 'app-fondos',
  standalone: true,
  imports: [FormsModule], // ✅ NECESARIO PARA ngModel
  templateUrl: './fondos.component.html',
  styleUrls: ['./fondos.component.scss']
})
export class FondosComponent implements OnInit {
  monto: number = 0;

  constructor(private http: HttpClient) {}

ngOnInit(): void {
  this.cargarScriptPaypal().then(() => {
    this.renderizarBoton();
  });
}

cargarScriptPaypal(): Promise<void> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=EUR`;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}


  renderizarBoton() {
    setTimeout(() => {
      paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          if (!this.monto || this.monto <= 0) {
            alert("Introduce un monto válido");
            return;
          }

          return actions.order.create({
            purchase_units: [{
              amount: {
                value: this.monto.toFixed(2)
              }
            }]
          });
        },
        onApprove: (data: any, actions: any) => {
          return actions.order.capture().then((details: any) => {
            const orderID = data.orderID;
            this.confirmarPago(orderID);
          });
        }
      }).render('#paypal-button-container');
    }, 0);
  }

confirmarPago(orderID: string) {
const token = localStorage.getItem('access_token');
const headers = {
  Authorization: `Bearer ${token}`
};

this.http.post('/api/fondos/confirmar/', { orderID }, { headers }).subscribe({
  next: (res: any) => {
    alert("✅ Pago confirmado. Nuevo saldo: " + res.nuevo_saldo + " €");
    location.reload();
  },
  error: () => alert("❌ Error confirmando pago con PayPal.")
});
}}
