import { RemultModule } from '@remult/angular';
import { NgModule, ErrorHandler } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';


import { UsersComponent } from './users/users.component';
import { Roles, AdminGuard } from './users/roles';
import { ShowDialogOnErrorErrorHandler } from './common/dialog';
import { ProductsComponent } from './products/products.component';
import { OrdersComponent } from './orders/orders.component';
import { JwtModule } from '@auth0/angular-jwt';
import { CustomersComponent } from './customers/customers.component';
import { CustomerStatusComponent } from './customer-status/customer-status.component';


const routes: Routes = [
  { path: 'בית', component: HomeComponent },
  { path: 'הזמנות', component: OrdersComponent, canActivate: [AdminGuard] },
  { path: 'כרטיס לקוח', component: CustomerStatusComponent, canActivate: [AdminGuard] },
  { path: 'מוצרים', component: ProductsComponent, canActivate: [AdminGuard] },
  { path: 'לקוחות', component: CustomersComponent, canActivate: [AdminGuard] },

  { path: 'משתמשים', component: UsersComponent, canActivate: [AdminGuard] },

  { path: '', redirectTo: '/בית', pathMatch: 'full' },
  { path: '**', redirectTo: '/בית', pathMatch: 'full' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes),
    RemultModule,
  JwtModule.forRoot({
    config: { tokenGetter: () => localStorage.getItem('auth_token') }
  })],
  providers: [AdminGuard, { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler }],
  exports: [RouterModule]
})
export class AppRoutingModule { }

