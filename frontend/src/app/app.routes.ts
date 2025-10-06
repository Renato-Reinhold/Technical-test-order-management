import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { ProductsComponent } from './features/products/products';
import { DashboardComponent } from './features/dashboard/dashboard';
import { CreateOrderComponent } from './features/orders/create-order';
import { NotFoundComponent } from './features/not-found/not-found';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'orders/create', component: CreateOrderComponent },
  { path: '**', component: NotFoundComponent }
];
