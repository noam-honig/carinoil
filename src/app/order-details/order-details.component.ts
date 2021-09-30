import { Component, OnInit } from '@angular/core';
import { Orders, OrderDetails } from '../orders/orders';
import { Remult } from 'remult';
import { Products } from '../products/products';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {

  constructor(private remult: Remult) { }
  args: { order: Orders };
  details: OrderDetails[];
  async ngOnInit() {
    this.details = await this.remult.repo(OrderDetails).find({ where: x => x.orderId.isEqualTo(this.args.order.id), limit: 100 })

  }
  getProduct(d: OrderDetails) {
    return d.product?.name;
  }

}
