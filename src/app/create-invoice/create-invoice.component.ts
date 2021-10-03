import { Component, OnInit } from '@angular/core';
import { BackendMethod, getFields, Remult } from 'remult';
import { OrderDetails, Orders } from '../orders/orders';
import { Roles } from '../users/roles';
import { callRivhit, Invoice, ItemInInvoice } from './invoice';
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
        
        click: async () => {
          let customers = await this.remult.repo(Customer).find({ limit: 1000 }).then(x => x.map(c => ({ caption: c.name, item: c })));
          openDialog(SelectValueDialogComponent, async x => x.args({
            values: customers,
            onSelect: c => {
              this.args.order.customer = c.item;
              Invoice.updatePriceList(this.items, this.args.order.customer?.rivhitId);
            }
          }))
        }
        
      }]
    });
    if (!this.args.order.customer) {
      await this.remult.repo(Orders).findFirst({
        where: x => x.phone.isEqualTo(this.args.order.phone).and(x.customer.isDifferentFrom(null)),
        useCache: false
      }).then(o => this.args.order.customer = o?.customer);
    }


    this.items = (await Invoice.buildItemsInInvoice(this.args.order.id, this.args.order.customer?.rivhitId)).map(y => {
      let r = new ItemInInvoice();
      set(r, y);
      return r;
    });
  }
  getQuantityField(item: ItemInInvoice) {
    return getFields(item).quantity;
  }
  getUnitPrice(item: ItemInInvoice) {
    return getFields(item).unitPrice;
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
    this.args.order.handled = true;
    await this.args.order.save();
    this.ref.close();
    setTimeout(() => {
      window.open(inv.apiResponse.document_link);
    }, 100);


  }



}

