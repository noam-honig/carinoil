import { RemultModule, NotSignedInGuard, SignedInGuard } from '@remult/angular';
import { NgModule, ErrorHandler } from '@angular/core';
import { Routes, RouterModule, Route, ActivatedRouteSnapshot } from '@angular/router';
import { HomeComponent } from './home/home.component';

import { RegisterComponent } from './users/register/register.component';
import { UpdateInfoComponent } from './users/update-info/update-info.component';

import { UsersComponent } from './users/users.component';
import { Roles, AdminGuard } from './users/roles';
import { ShowDialogOnErrorErrorHandler } from './common/dialog';
import { ProductsComponent } from './products/products.component';
import { OrdersComponent } from './orders/orders.component';


const routes: Routes = [
  { path: 'בית', component: HomeComponent },
  { path: 'הזמנות', component: OrdersComponent, canActivate: [AdminGuard] },
  { path: 'מוצרים', component: ProductsComponent, canActivate: [AdminGuard] },
  { path: 'משתמשים', component: UsersComponent, canActivate: [AdminGuard] },

  { path: 'הרשמה', component: RegisterComponent, canActivate: [NotSignedInGuard] },
  { path: 'פרטים', component: UpdateInfoComponent, canActivate: [SignedInGuard] },
  { path: '', redirectTo: '/בית', pathMatch: 'full' },
  { path: '**', redirectTo: '/בית', pathMatch: 'full' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes), RemultModule],
  providers: [AdminGuard, { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler }],
  exports: [RouterModule]
})
export class AppRoutingModule { }

