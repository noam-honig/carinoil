import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@remult/angular';
import { BackendMethod, Remult } from 'remult';
import { callRivhit, CustomerInfoInRivhit } from '../create-invoice/invoice';
import { Roles } from '../users/roles';
import { Customer } from './customer';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {

  constructor(private remult: Remult) { }
  customers = new GridSettings(this.remult.repo(Customer), {
    allowCrud: true,
    allowDelete: false,
    knowTotalRows:true,
    gridButtons: [{
      textInMenu: () => 'קליטת לקוחות מרווחית',
      click: async () => {
        await CustomersComponent.ImportCustomersFromRivhit();
        this.customers.reloadData();
      }
    }]
  });
  ngOnInit(): void {
  }
  @BackendMethod({ allowed: Roles.admin })
  static async ImportCustomersFromRivhit(remult?: Remult) {
    let items: CustomerInfoInRivhit[] = await callRivhit("Customer.List", {}).then(x => x.customer_list);
    for (const r of items.filter(i => i.price_list_id > 0)) {
      let c = await remult.repo(Customer).findFirst({ where: c => c.rivhitId.isEqualTo(r.customer_id), useCache: false, createIfNotFound: true });
      if (c.isNew()) {
        c.name = r.last_name;
        await c.save();
      }
    }

  }

}
