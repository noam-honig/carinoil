import { Remult } from "remult";
import { LogisticsController } from "../app/invoices-sent-to-logistics/logistics-controller";
import * as fs from 'fs';
import { getDataProvider } from "./getDataProvider";
import { report } from "./sendMail";
import { callSuperPharm, checkForNewOrdersOnSuperpharm } from "./superPhramOrders";


report.log = what => fs.appendFileSync('./db/log.log', what + '\n');
getDataProvider().then(async dp => {
    const remult = new Remult();
    remult.setDataProvider(dp);
    if (true)
        await checkForNewOrdersOnSuperpharm(remult).then(x => {
            if (x) {
                report.log("superpharm sync:" + JSON.stringify(x))
            } else {
                report.log("there are no new orders from superpharm.");

            }
        })

    await LogisticsController.checkForNewInvoices(remult).then(x => {

        report.log(`${new Date().toLocaleString()} items: ${x.newItems}\n`);
    });
}).catch(error=>report.log(error));

