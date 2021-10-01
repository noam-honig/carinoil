import { Component, OnInit } from '@angular/core';
import { Remult } from 'remult';
import { OrderDetails, Orders, PhoneColumn } from './orders';
import { OrderDetailsComponent } from '../order-details/order-details.component';
import { Products } from '../products/products';
import { YesNoQuestionComponent } from '../common/yes-no-question/yes-no-question.component';
import { GridSettings, openDialog } from '@remult/angular';
import { CreateInvoiceComponent } from '../create-invoice/create-invoice.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {

  constructor(private remult: Remult) {

  }
  orders = new GridSettings(this.remult.repo(Orders), {
    allowUpdate: true,
    allowDelete: false,
    numOfColumnsInGrid: 6,
    confirmDelete: async (r) => await openDialog(YesNoQuestionComponent, x => x.args = { message: 'אתה בטוח שאתה רוצה למחוק? אין חרטות :)' }, x => x.okPressed),
    columnSettings: o => [
      { field: o.name, readOnly: true },
      { field: o.handled, width: '55px' },
      { field: o.store, readOnly: true },
      { field: o.comment, readOnly: true },
      { field: o.phone, readOnly: true },
      { field: o.createDate, readOnly: true },
    ],
    rowButtons: [
      {
        icon: 'shopping_cart'
        , showInLine: true,
        textInMenu: 'צור חשבונית',
        click: (o) => {
          openDialog(CreateInvoiceComponent, x => x.args = { order: o })
        }
      },
   
      {
        icon: 'speaker_notes'
        , showInLine: true,
        textInMenu: o => 'שלח ווטסאפ ל' + o.name,
        click: async (o) => {
          let message = 'שלום ' + o.name + '\r\nאלו הפריטים שהזמנת:\r\n';
          for (const d of await this.remult.repo(OrderDetails).find({ where: od => od.orderId.isEqualTo(o.id), limit: 100 })) {
            message += d.quantity + " x " + (d.product?.name && '') + "\r\n";
          }
          setTimeout(() => {
            PhoneColumn.sendWhatsappToPhone(o.phone, message, this.remult);
          }, 10);

        }
      },
      {
        icon: 'call'
        , showInLine: true,
        textInMenu: o => 'התקשר ל' + o.name,
        click: async (o) => {
          window.open('tel:' + o.$.phone.displayValue)
        }
      }
    ]
  });

  ngOnInit() {
    if (false)
      setTimeout(() => {

        openDialog(CreateInvoiceComponent, x => x.args = { order: this.orders.items[0] });
      }, 500);

  }

}
