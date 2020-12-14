import { Component, OnInit } from '@angular/core';
import { Orders, OrderDetails } from '../orders/orders';
import { Context } from '@remult/core';
import { Products } from '../products/products';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {

  constructor(private context: Context) { }
  args: { order: Orders };
  details: OrderDetails[];
  async ngOnInit() {
    this.details = await this.context.for(OrderDetails).find({ where: x => x.orderId.isEqualTo(this.args.order.id) })

  }
  getProduct(d: OrderDetails) {
    return this.context.for(Products).lookup(d.product).name.value;
  }

}
