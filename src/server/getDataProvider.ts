import { DataProvider, JsonDataProvider, Remult, SqlDatabase } from "remult";
import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, verifyStructureOfAllEntities } from 'remult/postgres';
import { JsonEntityFileStorage } from "remult/server";



export async function getDataProvider() {
    config(); //loads the configuration from the .env file
    let dataProvider: DataProvider = new JsonDataProvider(new JsonEntityFileStorage('./db'));

    // use json db for dev, and postgres for production
    if (!process.env.dev) {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false } // use ssl in production but not in development. the `rejectUnauthorized: false`  is required for deployment to heroku etc...
        });
        let database = new SqlDatabase(new PostgresDataProvider(pool));
        var remult = new Remult();
        remult.setDataProvider(database);
        await verifyStructureOfAllEntities(database, remult);
        dataProvider = database;
    }
    return dataProvider;
}
