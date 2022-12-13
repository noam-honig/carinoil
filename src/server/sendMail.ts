import * as nodemailer from 'nodemailer';

import { getDocumentDetailsFromRivhit } from '../app/invoices-sent-to-logistics/rivhit-document-details';
import { CustomerStatusComponent } from '../app/customer-status/customer-status.component';
import { callRivhit } from '../app/create-invoice/invoice';


export async function sendMail(documentNumber: number, documentType: number) {
  const { STORAGE_ROOM_EMAIL_ADDRESS, EMAIL_ADDRESS, EMAIL_PASSWORD } = process.env;
  const link = await CustomerStatusComponent.openDocument(documentType, documentNumber);
  const details = await getDocumentDetailsFromRivhit(documentType, documentNumber);
  const customer = await callRivhit("Customer.Get", { customer_id: details.customer_id });

  const log = (what: any) => report.log(`${documentType}-${documentNumber}: ${what}`)

  const clientOutput = `
  <div style="direction: rtl;text-align: center;background:#f3f1f1;border-radius: 7px;">
    <h2 style="box-shadow: 10px 10px 8px 10px gray;text-align: center;"> שלום.</h2>
    <h4 style="text-align: center">מצורף לינק לחשבונית של חברת קארינו קידס בע"מ.</h4>
    <a href=${link} download> להורדת המסמך: Invoicing </a>
    <h3 style="text-align: center"> שים לב </h3>
    <h4 style="text-align: center">  אינך יכול/ה לשלוח מייל בחזרה לכתובת זו.  </h4>
    </div>
    `

  const storageRoomOutput = `
  <div style="direction: rtl;text-align: center;background:#f3f1f1;border-radius: 7px;">
    <h2 style="box-shadow: 10px 10px 8px 10px gray;text-align: center;"> שלום.</h2>
    <h4 style="text-align: center">מצורפת חשבונית קרינו קידס, מספר הזמנה: ${details.document_number}.</h4>
    <a href=${link} download> להורדת המסמך: Invoicing </a>
    <h3 style="text-align: center"> שים לב </h3>
    <h4 style="text-align: center">  אינך יכול/ה לשלוח מייל בחזרה לכתובת זו.  </h4>
    </div>
    `

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_ADDRESS,
      pass: EMAIL_PASSWORD
    }
  });

  transporter.sendMail({
    from: EMAIL_ADDRESS,
    to: STORAGE_ROOM_EMAIL_ADDRESS,
    subject: 'חשבונית מקרינו קידס.',
    text: 'invoicing',
    html: storageRoomOutput
  },
    (error, info) => {
      if (error) {
        log(error);
      } else {
        log('Email sent to storage room: ' + info.response);
      }
    });

  if (documentType === 1 && customer?.email) {
    transporter.sendMail({
      from: EMAIL_ADDRESS,
      to: customer.email,
      subject: 'חשבונית מקרינו קידס.',
      text: 'invoicing',
      html: clientOutput
    },
      (error, info) => {
        if (error) {
          log(error);
        } else {
          log('Email sent to client: ' + info.response);
        }
      });
  } else {
    let noEmailText = `The user: ${customer?.first_name} does not have email.`;
    let noDocumentTypeText = `The document type is not 1.`;
    log(`${documentType === 1 ? noEmailText : noDocumentTypeText}`);
  }

}
export const report = {
  log: (what: any) => console.log(what)
}