import * as nodemailer from 'nodemailer';

import { getDocumentDetailsFromRivhit } from '../app/invoices-sent-to-logistics/rivhit-document-details';
import { CustomerStatusComponent } from '../app/customer-status/customer-status.component';
import { callRivhit } from '../app/create-invoice/invoice';

export async function sendMail(documentNumber: number, documentType: number) {
  const { STORAGE_ROOM_EMAIL_ADDRESS, EMAIL_ADDRESS, EMAIL_PASSWORD } = process.env;
  const link = await CustomerStatusComponent.openDocument(documentType, documentNumber);
  const details = await getDocumentDetailsFromRivhit(documentType, documentNumber);
  const customer = await callRivhit("Customer.Get", { customer_id: details.customer_id });
  
  if (!customer?.email) {
    console.log("no email", { documentNumber, documentType, customerName: customer.name })
    return;
  }

  const output = `
  <div style="direction: rtl;text-align: center;background:#f3f1f1;border-radius: 7px;">
    <h2 style="box-shadow: 10px 10px 8px 10px gray;text-align: center;"> שלום.</h2>
    <h4 style="text-align: center"> מצורף לינק לחשבונית של חברת קארינו קידס בע"מ. </h4>
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

  const mailOptionsClient = {
    from: EMAIL_ADDRESS,
    to: customer.email,
    subject: 'Invoicing',
    text: 'invoicing',
    html: output
  };
 
  const mailOptionsStorageRoom = {
    from: EMAIL_ADDRESS,
    to: STORAGE_ROOM_EMAIL_ADDRESS,
    subject: 'Invoicing',
    text: 'invoicing',
    html: output
  };

  transporter.sendMail(mailOptionsStorageRoom, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent to storage room: ' + info.response);
    }
  });
  
  if (documentType === 1) {
    transporter.sendMail(mailOptionsClient, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent to client: ' + info.response);
      }
    });   
  }

}
