import { Component, OnInit } from '@angular/core';
import { Context } from '@remult/core';
import { OrderDetails, Orders, PhoneColumn } from './orders';
import { OrderDetailsComponent } from '../order-details/order-details.component';
import { Products } from '../products/products';
import { YesNoQuestionComponent } from '../common/yes-no-question/yes-no-question.component';

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
    allowDelete: true,
    numOfColumnsInGrid:6,
    confirmDelete: async (r) => await this.context.openDialog(YesNoQuestionComponent, x => x.args = { message: 'אתה בטוח שאתה רוצה למחוק? אין חרטות :)' }, x => x.okPressed),
    columnSettings: o => [
      { column: o.name, readOnly: true },
      { column: o.handled, width: '55px' },
      { column: o.store, readOnly: true },
      { column: o.comment, readOnly: true },
      { column: o.phone, readOnly: true },
      { column: o.createDate, readOnly: true },
    ],
    rowButtons: [
      {
        icon: 'shopping_cart'
        , showInLine: true,
        textInMenu: 'מוצרים בהזמנה',
        click: (o) => {
          this.context.openDialog(OrderDetailsComponent, x => x.args = { order: o })
        }
      },
      {
        icon: 'speaker_notes'
        , showInLine: true,
        textInMenu: o => 'שלח ווטסאפ ל' + o.name.value,
        click: async (o) => {
          let message = 'שלום ' + o.name.value + '\r\nאלו הפריטים שהזמנת:\r\n';
          for (const d of await this.context.for(OrderDetails).find({ where: od => od.orderId.isEqualTo(o.id) })) {
            message += d.quantity.value + " x " + (await (await this.context.for(Products).lookupAsync(d.product)).name.value) + "\r\n";
          }
          PhoneColumn.sendWhatsappToPhone(o.phone.value, message, this.context);
        }
      },
      {
        icon: 'call'
        , showInLine: true,
        textInMenu: o => 'התקשר ל' + o.name.value,
        click: async (o) => {
          window.open('tel:' + o.phone.displayValue)
        }
      }
    ]
  });

  ngOnInit() {
  }

}
