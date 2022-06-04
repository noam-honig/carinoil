import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@remult/angular';
import { Remult } from 'remult';
import { DialogService } from '../common/dialog';
import { openDocument } from '../customer-status/customer-status.component';
import { InvoiceSentToLogistics } from './InvoicesSentToLogistics';
import { LogisticsLog } from './logisitcs-log';
import { LogisticsController } from './logistics-controller';

@Component({
  selector: 'app-invoices-sent-to-logistics',
  templateUrl: './invoices-sent-to-logistics.component.html',
  styleUrls: ['./invoices-sent-to-logistics.component.scss']
})
export class InvoicesSentToLogisticsComponent implements OnInit {

  constructor(private remult: Remult, private dialog: DialogService) { }
  grid = new GridSettings(this.remult.repo(InvoiceSentToLogistics), {
    numOfColumnsInGrid: 1000,
    knowTotalRows: true,
    gridButtons: [{
      name: 'סטטוס תקשורת',
      click: async () => {
        let log = await this.remult.repo(LogisticsLog).findFirst();
        console.log(log.status);
        this.dialog.error(log.lastRun.toLocaleString() + " - " + log.status);
      }
    },
    {
      name: 'הפעל תקשורת עכשיו',
      click: async () => {
        let log = await LogisticsController.checkForNewInvoices();
        this.dialog.error(log.newItems + " חשבוניות חדשות");
        this.grid.reloadData();
      }
    }
    ],
    rowButtons: [
      { name: 'הצג', click: (d) => openDocument(d.documentType, d.documentNumber) },
      {
        name: 'XML', click: async d => {
          const doc = await LogisticsController.createXml(d.documentType, d.documentNumber);
          var element = document.createElement('a');
          element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(doc.xml));
          element.setAttribute('download', doc.filename);
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        }
      }
    ]
  })
  ngOnInit(): void {
  }

}
