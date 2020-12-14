import { Component, OnInit } from '@angular/core';
import { Context } from '@remult/core';
import { Orders } from './orders';
import { OrderDetailsComponent } from '../order-details/order-details.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {

  constructor(private context: Context) {

  }
  orders = this.context.for(Orders).gridSettings({
    allowUpdate: true,
    rowButtons: [
      {
        icon: 'shopping_cart'
        , showInLine: true,
        textInMenu: 'מוצרים בהזמנה',
        click: (o) => {
          this.context.openDialog(OrderDetailsComponent, x => x.args = { order: o })
        }
      }
    ]
  });

  ngOnInit() {
  }

}
