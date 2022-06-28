import { Remult } from "remult";
import { LogisticsController } from "../app/invoices-sent-to-logistics/logistics-controller";
import * as fs from 'fs';
import { getDataProvider } from "./getDataProvider";


getDataProvider().then(dp => {
    const remult = new Remult();
    remult.setDataProvider(dp);
    LogisticsController.checkForNewInvoices(remult).then(x => {

        fs.appendFileSync('./db/log.log', `${new Date().toLocaleString()} items: ${x.newItems}\n`);
    });
})

