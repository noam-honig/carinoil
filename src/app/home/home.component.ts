import { Component, OnInit } from '@angular/core';
import { getFields, IntegerField, Remult } from 'remult';
import { Products } from '../products/products';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { Orders } from '../orders/orders';
import { YesNoQuestionComponent } from '../common/yes-no-question/yes-no-question.component';
import { openDialog } from '@remult/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private remult: Remult) { }
  products: item[];
  async ngOnInit() {
    this.products = (await this.remult.repo(Products).find({ where: x => x.archive.isEqualTo(false), limit: 200 })).map(x => new item(x));
  }
  async submit() {
    let items = this.products.filter(p => p.quantity > 0).map(p => ({ product: p.product.id, quantity: p.quantity }));
    if (items.length == 0) {
      await openDialog(YesNoQuestionComponent, x => x.args = {
        message: 'לא נבחרו מוצאים, אנא בחרו מוצרים',
        isAQuestion: false
      })
      return;
    }
    var order = this.remult.repo(Orders).create();
    order.name = localStorage.getItem('name');
    order.phone = localStorage.getItem('phone');
    order.store = localStorage.getItem('store');
    order.items = JSON.stringify(this.products.filter(p => p.quantity > 0).map(p => ({ product: p.product.id, quantity: p.quantity })))
    await openDialog(InputAreaComponent, x => x.args = {
      title: 'שלח הזמנה',
      fields: () => [
        order.$.name,
        order.$.store,
        order.$.phone,
        order.$.comment
      ],
      ok: async () => {
        await order.save();
        localStorage.setItem('name', order.name);
        localStorage.setItem('phone', order.phone);
        localStorage.setItem('store', order.store);
        await openDialog(YesNoQuestionComponent, x => x.args = {
          message: 'הזמתנך התקבלה, תודה רבה',
          isAQuestion: false
        });
        window.location.href = 'https://www.carino.co.il'
      }
    })
  }
}

class item {
  @IntegerField({ caption: 'כמות' })
  quantity: number = 0;
  get $() { return getFields(this); }
  add(amount: number) {
    if (!this.quantity)
      this.quantity = 0;
    this.quantity += amount;
    if (this.quantity < 0)
      this.quantity = 0;
  }
  constructor(public product: Products) {

  }

}
