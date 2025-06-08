import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './auth/auth.guard';
import { TiendaComponent } from './pages/tienda/tienda.component';
import { ImportarComponent } from './pages/tienda/importar.component'; // LO AÑADIREMOS AHORA
import { CrearVideojuegoComponent } from './pages/tienda/crear/crear.component';
import { DetalleComponent } from './pages/tienda/detalle.component';
import { BibliotecaComponent } from './pages/biblioteca/biblioteca.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { CodigosComponent } from './pages/codigos/codigos.component';
import { MarketplaceComponent } from './pages/marketplace/marketplace.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },

  { path: 'tienda', component: TiendaComponent },
  { path: 'tienda/importar', component: ImportarComponent },
  { path: 'tienda/crear', component: CrearVideojuegoComponent },
  { path: 'tienda/detalle/:id', component: DetalleComponent },
  { path: 'biblioteca', component: BibliotecaComponent, canActivate: [AuthGuard] },
  { path: 'perfil', component: PerfilComponent, canActivate: [AuthGuard] },
  {
    path: 'fondos',
    loadComponent: () => import('./pages/fondos/fondos.component').then(m => m.FondosComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'social',
    loadComponent: () => import('./pages/social/social.component').then(m => m.SocialComponent),
    canActivate: [AuthGuard]
  },

  { path: 'codigos', component: CodigosComponent, canActivate: [AuthGuard] },

  { path: 'politica-privacidad', loadComponent: () => import('./pages/legal/politica/politica.component').then(m => m.PoliticaComponent) },
  { path: 'terminos-servicio', loadComponent: () => import('./pages/legal/terminos/terminos.component').then(m => m.TerminosComponent) },
  { path: 'contacto', loadComponent: () => import('./pages/legal/contacto/contacto.component').then(m => m.ContactoComponent) },
  {
    path: 'social/perfil-usuario/:id',
    loadComponent: () => import('./pages/social/perfil-usuario/perfil-usuario.component').then(m => m.PerfilUsuarioComponent),
    canActivate: [AuthGuard]
  },
{
  path: 'marketplace',
  loadComponent: () => import('./pages/marketplace/marketplace.component').then(m => m.MarketplaceComponent),
  canActivate: [AuthGuard]
},

  // SIEMPRE AL FINAL
  { path: '**', redirectTo: '', pathMatch: 'full' },


];

