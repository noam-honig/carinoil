import * as ftpClient from 'ftp';
import { Readable } from 'stream';

export async function sendDataToFtp(data: string, targetFileName: string) {
    await new Promise((res, err) => {
        const c = new ftpClient();
        c.on('ready', () => {
            const stream = new Readable();
            stream.push(data);
            stream.push(null);
            c.put(stream, targetFileName, error => {
                if (error)
                    err("FTP " + error);
                else res({});
                c.end();
            });
        });
        c.connect({
            host: process.env.ORIAN_FTP_ADDRESS,
            user: process.env.ORIAN_FTP_USER,
            password: process.env.ORIAN_FTP_PASSWORD
        })
        c.on('error', error => {
            err("FTP " + error);
        });
    })

}