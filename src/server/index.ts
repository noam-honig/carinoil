//import { CustomModuleLoader } from '../../../../../../repos/radweb/src/app/server/CustomModuleLoader';
//let moduleLoader = new CustomModuleLoader('/dist-server/repos/radweb/projects/');
import * as express from 'express';
import { initExpress } from 'remult/server';
import * as fs from 'fs';
import { DataProvider, Remult, SqlDatabase } from 'remult';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, verifyStructureOfAllEntities } from 'remult/postgres';
import * as helmet from 'helmet';
import * as jwt from 'express-jwt';
import * as compression from 'compression';

import '../app/app-routing.module';
import '../app/app.component';
import { LogisticsController } from '../app/invoices-sent-to-logistics/logistics-controller';


async function startup() {
    config(); //loads the configuration from the .env file
    let dataProvider: DataProvider;

    // use json db for dev, and postgres for production
    if (!process.env.dev) {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false }// use ssl in production but not in development. the `rejectUnauthorized: false`  is required for deployment to heroku etc...
        });
        let database = new SqlDatabase(new PostgresDataProvider(pool));
        var remult = new Remult();
        remult.setDataProvider(database);
        await verifyStructureOfAllEntities(database, remult);
        dataProvider = database;
    }

    let app = express();
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
    console.log({interval});
    if (interval > 0) { 
        setInterval(async () => {
            try {
                //@ts-ignore
                await LogisticsController.checkForNewInvoices(await api.getValidContext({ user: {} }));
            } catch (error: any) {
                console.log("check invoice interval", error);
            }
        }, interval * 1000);
    }


    let port = process.env.PORT || 3000;
    app.listen(port);
}
startup();