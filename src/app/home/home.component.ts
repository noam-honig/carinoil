import { Component, OnInit } from '@angular/core';
import { Context, NumberColumn, StringColumn } from '@remult/core';
import { Products } from '../products/products';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { async } from '@angular/core/testing';
import { Orders } from '../orders/orders';
import { YesNoQuestionComponent } from '../common/yes-no-question/yes-no-question.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private context: Context) { }
  products: item[];
  async ngOnInit() {
    this.products = (await this.context.for(Products).find({ where: x => x.archive.isEqualTo(false), limit: 200 })).map(x => new item(x));
  }
  async submit() {
    let items = this.products.filter(p => p.quantity.value > 0).map(p => ({ product: p.product.id.value, quantity: p.quantity.value }));
    if (items.length == 0) {
      await this.context.openDialog(YesNoQuestionComponent, x => x.args = {
        message: 'לא נבחרו מוצאים, אנא בחרו מוצרים',
        isAQuestion: false
      })
      return;
    }
    var order = this.context.for(Orders).create();
    order.name.value = localStorage.getItem('name');
    order.phone.value = localStorage.getItem('phone');
    order.store.value = localStorage.getItem('store');
    order.items.value = JSON.stringify(this.products.filter(p => p.quantity.value > 0).map(p => ({ product: p.product.id.value, quantity: p.quantity.value })))
    await this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'שלח הזמנה',
      columnSettings: () => [
        order.name,
        order.store,
        order.phone,
        order.comment
      ],
      ok: async () => {
        await order.save();
        localStorage.setItem('name', order.name.value);
        localStorage.setItem('phone', order.phone.value);
        localStorage.setItem('store', order.store.value);
        await this.context.openDialog(YesNoQuestionComponent, x => x.args = {
          message: 'הזמתנך התקבלה, תודה רבה',
          isAQuestion: false
        });
        window.location.href = 'https://www.carino.co.il'
      }
    })
  }
}

class item {
  quantity = new NumberColumn('כמות');
  add(amount: number) {
    if (!this.quantity.value)
      this.quantity.value = 0;
    this.quantity.value += amount;
    if (this.quantity.value < 0)
      this.quantity.value = 0;
  }
  constructor(public product: Products) {

  }

}
