import { Component, OnInit } from '@angular/core';
import { BackendMethod, getFields, Remult } from 'remult';
import { OrderDetails, Orders } from '../orders/orders';
import { Roles } from '../users/roles';
import { callRivhit, Invoice, ItemInInvoice } from './invoice';
import { set } from 'remult/set';

import { DataAreaSettings, getValueList, openDialog, SelectValueDialogComponent } from '@remult/angular';
import { Customer } from '../customers/customer';
import { MatDialogRef } from '@angular/material/dialog';
import { Products } from '../products/products';
import { DialogService } from '../common/dialog';


@Component({
  selector: 'app-create-invoice',
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss']
})
export class CreateInvoiceComponent implements OnInit {

  constructor(private remult: Remult, private ref: MatDialogRef<any>, private dialog: DialogService) { }
  args: {
    order: Orders
  }
  area: DataAreaSettings;
  area2: DataAreaSettings;
  items: ItemInInvoice[];
  totalQuantity() {
    return this.items.map(x => x.quantity || 0).reduce((a, b) => a + b);
  }
  total() {
    return this.items.map(x => x.quantity || 0 * x.unitPrice || 0).reduce((a, b) => a + b);
  }
  async ngOnInit() {
    let o = this.args.order;
    this.area = new DataAreaSettings({
      fields: () => [[{
        field: o.$.customer,
        hideDataOnInput: true,
        getValue: () => o.customer?.name,

        click: async () => {
          let customers = await this.remult.repo(Customer).find({ limit: 1000 }).then(x => x.map(c => ({ caption: c.name, item: c })));
          openDialog(SelectValueDialogComponent, async x => x.args({
            values: customers,
            onSelect: c => {
              o.customer = c.item;
              Invoice.updatePriceList(this.items, o.customer?.rivhitId);
            }
          }))
        }

      }, { field: o.$.name, readonly: true }, { field: o.$.store }]
        , [{ field: o.$.comment, readonly: true }]
      ]
    });
    this.area2 = new DataAreaSettings({
      fields: () => [o.$.ramiComment, o.$.handled]
    });
    if (!this.args.order.customer) {
      await this.remult.repo(Orders).findFirst({
        where: x => x.phone.isEqualTo(this.args.order.phone).and(x.customer.isDifferentFrom(null)),
        useCache: false
      }).then(o => this.args.order.customer = o?.customer);
    }


    this.items = (await Invoice.buildItemsInInvoice(this.args.order.id, this.args.order.customer?.rivhitId)).map(y =>
      set(new ItemInInvoice(), y)
    );
  }
  async addProduct() {
    let p = await this.remult.repo(Products).find();
    openDialog(SelectValueDialogComponent, x => x.args({
      values: p.map(p => ({ caption: p.name, item: p })),
      onSelect: async (p) => {
        let r = await Invoice.buildItemsInInvoice(this.args.order.id, this.args.order.customer?.rivhitId, p.item.id);
        this.items.push(set(new ItemInInvoice(), r[0]));
      }
    }));
  }
  getQuantityField(item: ItemInInvoice) {
    return getFields(item).quantity;
  }
  getUnitPrice(item: ItemInInvoice) {
    return getFields(item).unitPrice;
  }
  async createInvoice() {
    if (!this.args.order.customer)
      throw "לא נבחר לקוח";

    for (const x of this.items) {
      if (x.quantity < 0)
        if (!await this.dialog.yesNoQuestion("למוצר " + x.productName + " יש כמות שלילית, האם להמשיך בהפקה?"))
          return;
      if (x.quantity > 0 && x.unitPrice <= 0)
        if (!await this.dialog.yesNoQuestion("למוצר " + x.productName + " יש סכום שלילי, האם להמשיך בהפקה?"))
          return;

    }

    if (this.args.order.wasChanged())
      this.args.order.save();
    let inv = this.remult.repo(Invoice).create({
      customer: this.args.order.customer,
      orderId: this.args.order.id,
      details: this.items
    });
    await inv.create();
    await this.args.order.save();
    this.ref.close();
    setTimeout(() => {
      window.open(inv.apiResponse.document_link);
    }, 100);


  }



}

/*
[V]להוסיף למעלה את פרטי ההזמנה
[V] כאשר יש לקוח לא חוקי - לא רואית את המוצרים - כאשר משנים לקוח - לרענן את המוצרים אם זה ריק
[V] אפשרות להוסיף מוצר לחשבונית - מתוך רשימת המוצרים הכוללת (כולל האל תציג)
[V] להוסיף אפשרות להגדיר הערה של רמי לחשבונית  ושיוריד את הלא טיפלתי.
[V] למיין כך שלא טיפלתי יופיע קודם.
[V] לסמן טיפלתי אוטומטית רק עם הכמות זהה לכמות בהזמנה.
[V] להציג בצור חשבונית - את הכמות שסופקה בחשבוניות הקודמות.
[V] להוסיף במסך את השדה טיפלתי לא טיפלתי.
[V] להוסיף סה"כ הזמנה
[] להוסיף DASHBOARD לקוח.
[V] לחסום מלאי שלילי
*/