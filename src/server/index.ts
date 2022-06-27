//import { CustomModuleLoader } from '../../../../../../repos/radweb/src/app/server/CustomModuleLoader';
//let moduleLoader = new CustomModuleLoader('/dist-server/repos/radweb/projects/');
import * as express from 'express';
import { initExpress, JsonEntityFileStorage } from 'remult/server';
import * as fs from 'fs';
import { DataProvider, JsonDataProvider, Remult, SqlDatabase } from 'remult';

import * as helmet from 'helmet';
import * as jwt from 'express-jwt';
import * as compression from 'compression';
import sslRedirect from 'heroku-ssl-redirect';


import '../app/app-routing.module';
import '../app/app.component';
import { LogisticsController } from '../app/invoices-sent-to-logistics/logistics-controller';
import { getDataProvider } from './sync';


async function startup() {
    let dataProvider: DataProvider = await getDataProvider();

    let app = express();
    app.use(sslRedirect());
    app.use(jwt({ secret: process.env.TOKEN_SIGN_KEY, credentialsRequired: false, algorithms: ['HS256'] }));
    app.use(compression());
    app.use(
        helmet({
            contentSecurityPolicy: false,
        })
    );
    const api = initExpress(app, {
        dataProvider,
    });
    app.use(express.static('dist/carinoil'));
    app.use('/*', async (req, res) => {
        try {
            res.send(fs.readFileSync('dist/carinoil/index.html').toString());
        } catch (err) {
            res.sendStatus(500);
        }
    });
    const interval = +process.env.INVOICE_CHECK_INTERVAL;
    console.log({ interval });
    if (false && interval > 0) {
        setInterval(async () => {
            try {
                //@ts-ignore
                await LogisticsController.checkForNewInvoices(await api.getValidContext({ user: {} }));
            } catch (error: any) {
                console.log("check invoice interval", error);
            }
        }, interval * 1000);
    }
    //const xml = await LogisticsController.createXml(1,6155);
    //fs.writeFileSync('C:/temp/'+xml.filename,xml.xml);


    let port = process.env.PORT || 3000;
    app.listen(port);
}
startup();
