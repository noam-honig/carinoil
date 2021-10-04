import { Component, OnInit } from '@angular/core';
import { DataAreaSettings, DataControl, openDialog, SelectValueDialogComponent } from '@remult/angular';
import { BackendMethod, Field, getFields, Remult } from 'remult';
import { callRivhit, getRivhitItems } from '../create-invoice/invoice';
import { Customer } from '../customers/customer';
import { Roles } from '../users/roles';

@Component({
  selector: 'app-customer-status',
  templateUrl: './customer-status.component.html',
  styleUrls: ['./customer-status.component.scss']
})
export class CustomerStatusComponent implements OnInit {

  constructor(private remult: Remult) { }
  status: customerStatus;
  async ngOnInit() {
    let lastCustomerId = localStorage.getItem("lastCustomer");
    if (lastCustomerId) {
      this.setCustomer(await this.remult.repo(Customer).findId(lastCustomerId));
    }
  }
  @DataControl<CustomerStatusComponent>({
    hideDataOnInput: true,
    getValue: (o) => o.customer?.name,

    click: async (o) => {
      let customers = await o.remult.repo(Customer).find({ limit: 1000 }).then(x => x.map(c => ({ caption: c.name, item: c })));
      openDialog(SelectValueDialogComponent, async x => x.args({
        values: customers,
        onSelect: c => {
          o.setCustomer(c.item)
        }
      }));
    }
  })
  @Field<CustomerStatusComponent, Customer>({
    caption: 'לקוח',
    displayValue: x => x.customer?.name
  })
  customer: Customer;
  filter(doc: Document) {
    return doc.sortDate <= this.to && doc.sortDate >= this.from;
  }
  total() {
    return this.status.documents.filter(d => this.filter(d)).map(d => d.amount - d.total_vat).reduce((a, b) => a + b, 0);
  }
  count() {
    return this.status.documents.filter(d => this.filter(d)).length;
  }

  @Field({ caption: 'מחודש', inputType: 'month' })
  from: string = new Date().getFullYear().toString() + "-01";
  @Field({ caption: 'עד חודש', inputType: 'month' })
  to: string = new Date().getFullYear().toString() + "-12";
  area = new DataAreaSettings({ fields: () => [[this.$.from, this.$.to]] })
  async setCustomer(c: Customer) {
    this.customer = c;
    localStorage.setItem("lastCustomer", c?.id);
    this.status = await CustomerStatusComponent.getInfo(c.id);
    console.table(this.status.documents);
  }
  get $() { return getFields(this) }
  async open(d: Document) {
    let doc = await CustomerStatusComponent.openDocument(d.document_type, d.document_number);
    setTimeout(() => {
      window.open(doc);
    }, 100);;
  }
  @BackendMethod({ allowed: Roles.admin })
  static async openDocument(document_type: number, document_number: number, remult?: Remult): Promise<string> {
    return (await callRivhit("Document.Copy", {
      document_type, document_number
    })).document_link;
  }
  @BackendMethod({ allowed: Roles.admin })
  static async getInfo(customerId: string, remult?: Remult): Promise<customerStatus> {
    let c = await remult.repo(Customer).findId(customerId);
    return {
      documents: await callRivhit("Document.List", {
        from_customer_id: c.rivhitId,
        to_customer_id: c.rivhitId
      }).then(r => sortDocumentArray(r.document_list))
    }
  }
}
function sortDocumentArray(docs: Document[]) {
  for (const d of docs) {
    d.sortDate = toSortableDate(d.document_date);
  }
  docs.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  return docs;
}
interface customerStatus {
  documents: Document[];
}
interface Document {
  document_type: number;
  document_number: number;
  document_date: string;
  sortDate: string;
  document_time: string;
  amount: number;
  amount_exempt: number;
  customer_id: number;
  agent_id: number;
  is_cancelled: boolean;
  customer_name: string;
  order: string;
  sort_code: number;
  total_vat: number;
  document_type_name: string;
  is_accounting: boolean;
  project_id: number;
}
function toSortableDate(d: string) {
  return d.substr(6, 4) + '-' + d.substr(3, 2) + d.substr(0, 2);
}