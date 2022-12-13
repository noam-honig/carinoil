import { Remult } from "remult";
import { LogisticsController } from "../app/invoices-sent-to-logistics/logistics-controller";
import * as fs from 'fs';
import { getDataProvider } from "./getDataProvider";
import { report } from "./sendMail";


report.log = what => fs.appendFileSync('./db/log.log', what + '\n');
getDataProvider().then(dp => {
    const remult = new Remult();
    remult.setDataProvider(dp);
    LogisticsController.checkForNewInvoices(remult).then(x => {

        fs.appendFileSync('./db/log.log', `${new Date().toLocaleString()} items: ${x.newItems}\n`);
    });
})

