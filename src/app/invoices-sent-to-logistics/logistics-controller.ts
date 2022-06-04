import { BackendMethod, Remult } from "remult";
import { callRivhit, RivhitDocument } from "../create-invoice/invoice";
import { Roles } from "../users/roles";
import { InvoiceSentToLogistics } from "./InvoicesSentToLogistics";
import { LogisticsLog } from "./logisitcs-log";
import { createOrianOutGoingMessage } from "./orian-outgoing-message";
import { getDocumentDetailsFromRivhit } from "./rivhit-document-details";
import { sendDataToFtp } from "./sendFtp";

let running = false;
export class LogisticsController {

    @BackendMethod({ allowed: Roles.admin })
    static async checkForNewInvoices(remult?: Remult) {
        if (running)
            throw "check for new invoices already running";
        running = true;
        const log = await remult.repo(LogisticsLog).findFirst({ createIfNotFound: true });
        log.lastRun = new Date();
        try {
            let lastDate = new Date();
            lastDate.setMonth(lastDate.getMonth() - 1);
            {
                let last = await remult.repo(InvoiceSentToLogistics).findFirst({});
                if (last)
                    lastDate = last.invoiceDate;
            }
            const result: { document_list: RivhitDocument[] } = await callRivhit("Document.List", {
                from_date: dateToString(lastDate),
                to_date: dateToString(new Date()),
                from_document_type: 1,
                to_document_type: 1

            });

            let counter = 0;
            let newItems = 0;
            const repo = remult!.repo(InvoiceSentToLogistics);
            for (const d of result.document_list) {
                counter++;
                let i = await repo.findFirst({ where: x => x.invoiceNumber.isEqualTo(d.document_number), createIfNotFound: true })
                if (i.isNew()) {
                    console.log("processing new " + i.invoiceNumber + " - " + d.document_date);
                    i.transmitDate = new Date();
                    let sp = d.document_date.split('/');
                    i.invoiceDate = new Date(sp[2] + '-' + sp[1] + '-' + sp[0]);
                    i.customerName = d.customer_name;
                    i.amount = d.amount;
                    try {
                        newItems++;
                        const o = await LogisticsController.createXml(d.document_number);
                        await sendDataToFtp(o.xml, o.filename);
                        i.status = "ok";

                    }
                    catch (error) {
                        i.status = error;
                        console.log(error);
                    }
                    await i.save();
                }
            }
            log.status = 'ok';
            const r = { counter, newItems }
            console.log("checkForNewInvoices", r);
            return r;
        } catch (err) {
            log.status = err;
            throw err;
        }
        finally {
            running = false;
            await log.save();
        }
    }
    @BackendMethod({ allowed: Roles.admin })
    static async createXml(number: number) {
        return await createOrianOutGoingMessage(number, await getDocumentDetailsFromRivhit(number));
    }
}


export function dateToString(today: Date) {
    const yyyy = today.getFullYear();
    let mm: any = today.getMonth() + 1; // Months start at 0!
    let dd: any = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    return dd + '/' + mm + '/' + yyyy;


}