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
    this.products = (await this.context.for(Products).find({ where: x => x.archive.isEqualTo(false) })).map(x => new item(x));
  }
  async submit() {
    let name = new StringColumn('שם המזמין');
    await this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'שלח הזמנה',
      columnSettings: () => [name],
      ok: async () => {
        await Orders.SubmitOrder(name.value, this.products.filter(p => p.quantity.value > 0).map(p => ({ product: p.product.id.value, quantity: p.quantity.value })));
        await this.context.openDialog(YesNoQuestionComponent, x => x.args = {
            message:'הזמתנך התקבלה, תודה רבה',
            isAQuestion:false
        });
        window.location.href='https://www.carino.co.il'
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
