import { Component, OnInit } from '@angular/core';
import { BackendMethod, getFields, Remult } from 'remult';
import { OrderDetails, Orders } from '../orders/orders';
import { Roles } from '../users/roles';
import { callRivhity, Invoice, ItemInInvoice } from './invoice';
import { set } from 'remult/set';

import { DataAreaSettings, getValueList, openDialog, SelectValueDialogComponent } from '@remult/angular';
import { Customer } from '../customers/customer';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-create-invoice',
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss']
})
export class CreateInvoiceComponent implements OnInit {

  constructor(private remult: Remult, private ref: MatDialogRef<any>) { }
  args: {
    order: Orders
  }
  area: DataAreaSettings;
  items: ItemInInvoice[];
  async ngOnInit() {
    this.area = new DataAreaSettings({
      fields: () => [{
        field: this.args.order.$.customer,
        hideDataOnInput: true,
        getValue: () => this.args.order.customer?.name,
        valueList: getValueList(this.remult.repo(Customer))
      }]
    });
    this.items = (await CreateInvoiceComponent.buildItemsInInvoice(this.args.order.id)).map(y => {
      let r = new ItemInInvoice();
      set(r, y);
      return r;
    });
  }
  getQuantityField(item: ItemInInvoice) {
    return getFields(item).quantity;
  }
  async createInvoice() {
    if (this.args.order.wasChanged())
      this.args.order.save();
    let inv = this.remult.repo(Invoice).create({
      customer: this.args.order.customer,
      orderId: this.args.order.id,
      details: this.items
    });
    await inv.create();
    this.ref.close();

  }
  @BackendMethod({ allowed: Roles.admin })
  static async buildItemsInInvoice(orderId: string, remult?: Remult) {




    let result: ItemInInvoice[] = [];
    for await (const od of remult.repo(OrderDetails).iterate({ where: od => od.orderId.isEqualTo(orderId) })) {


      let quantityInStock: string;
      try {
        quantityInStock = await callRivhity("Item.Quantity", {
          item_id: od.product.rivhitId
        }).then(r => r.quantity);
      }
      catch (err) {
        quantityInStock = err
      }



      result.push({
        orderDetailId: od.id,
        orderedQuantity: od.quantity,
        catalog_number:od.product.SKU,
        productName: od.product?.name,
        rivhitId: od.product?.rivhitId,
        quantity: od.quantity,
        quantityInStock
      })
    }
    return result;
  }

}

