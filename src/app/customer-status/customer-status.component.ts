import { Component, OnInit } from '@angular/core';
import { DataAreaSettings, DataControl, openDialog, SelectValueDialogComponent } from '@remult/angular';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Label } from 'ng2-charts';
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
    this.initChart();
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
        to_customer_id: c.rivhitId,
        from_date:'2019-01-01'
      }).then((r: { document_list: Document[] }) => {
        for (const d of r.document_list) {
          d.sortDate = toSortableDate(d.document_date);
        }
        r.document_list.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
        return r.document_list;

      }),
      open: await callRivhit("Customer.OpenDocuments", {
        customer_id: c.rivhitId

      }).then((r: { open_documents: OpenDocument[] }) => {
        for (const d of r.open_documents) {
          d.sortDate = toSortableDate(d.issue_date);
        }
        r.open_documents.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
        return r.open_documents;

      }),

    }
  }
  public barChartOptions: ChartOptions = {
    responsive: true,


  };
  public barChartLabels: Label[] = [];
  public barChartType: ChartType = 'horizontalBar';
  public barChartLegend = true;
  public barChartPlugins = [];
  thisYear: ChartDataSets = { data: [], label: 'נוכחי' };
  previousYear: ChartDataSets = { data: [], label: 'שנה קודמת' };
  public barChartData: ChartDataSets[] = [
    this.thisYear, this.previousYear
  ];

  initChart() {
    let m = "ינואר,פברואר,מרץ,אפריל,מאי,יוני,יולי,אוגוסט,ספטמבר,אוקטובר,נובמבר,דצמבר".split(',');
    let year = new Date().getFullYear();
    let month = new Date().getMonth();
    this.thisYear.data = [];
    this.previousYear.data = [];
    this.barChartLabels.splice(0);

    for (let index = 0; index < 12; index++) {
      this.thisYear.data.push(this.sum(year, month));
      this.previousYear.data.push(this.sum(year - 1, month));
      this.barChartLabels.push(m[month]);
      month -= 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
    }
    
    
  }
  sum(year: number, month: number) {
    let m = (month + 1).toString();
    if (m.length == 1)
      m = '0' + m;
    let filter = year.toString() + '-' + m;
    return this.status.documents.filter(d => d.sortDate.startsWith(filter)).map(d => d.amount - d.total_vat).reduce((a, b) => a + b, 0);
  }
}
interface customerStatus {
  documents: Document[];
  open?: OpenDocument[];
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
export interface OpenDocument {
  balance: number;
  currency_id: number;
  customer_id: number;
  customer_name: string;
  document_number: number;
  document_type: number;
  due_date: string;
  issue_date: string;
  paid_amount: number;
  total_amount: number;
  total_amount_mtc: number;
  sortDate: string;
}
function toSortableDate(d: string) {
  return d.substr(6, 4) + '-' + d.substr(3, 2) + d.substr(0, 2);
}