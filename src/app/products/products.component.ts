import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@remult/angular';
import { BackendMethod, Remult } from 'remult';
import { callRivhit, getRivhitItems } from '../create-invoice/invoice';
import { Roles } from '../users/roles';
import { Products } from './products';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {

  constructor(private remult: Remult) { }
  products = new GridSettings(this.remult.repo(Products), {
    allowCrud: true,
    knowTotalRows: true,
    rowsInPage: 100,
    numOfColumnsInGrid: 99,
    gridButtons: [{
      textInMenu: () => 'עדכן קודי פריט מרווחית',
      click: async () => {
        await ProductsComponent.UpdateProductsIdInRivhit();
        this.products.reloadData();
      }
    }]
  });

  @BackendMethod({ allowed: Roles.admin })
  static async UpdateProductsIdInRivhit(remult?: Remult) {
    let items = await getRivhitItems();
    for await (const p of remult.repo(Products).iterate({ where: p => p.rivhitId.isEqualTo(0).and(p.SKU.isDifferentFrom('')) })) {
      let item = items.item_list.find(i => i.item_part_num == p.SKU);
      if (item) {
        p.rivhitId = item.item_id;
        await p.save();
      }
    }
  }
  ngOnInit() {
  }

}
