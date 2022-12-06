import * as nodemailer from 'nodemailer';

import { getDocumentDetailsFromRivhit } from '../app/invoices-sent-to-logistics/rivhit-document-details';
import { CustomerStatusComponent } from '../app/customer-status/customer-status.component';
import { callRivhit } from '../app/create-invoice/invoice';

export async function sendMail(documentNumber: number, documentType: number) {
  const { EMAIL_ADDRESS, EMAIL_PASSWORD } = process.env;
  const link = await CustomerStatusComponent.openDocument(documentType, documentNumber);
  const details = await getDocumentDetailsFromRivhit(documentType, documentNumber);
  const customer = await callRivhit("Customer.Get", { customer_id: details.customer_id });

  if (!customer?.email) {
    console.log("no email", { documentNumber, documentType, customerName: customer.name })
  }
  // return;

  // do you :)

  const output = `
  <div style="text-align: center;background:#f3f1f1;border-radius: 7px;">
    <h2 style="box-shadow: 10px 10px 8px 10px gray;text-align: center;">היי ${customer.last_name}</h2>
    <h4 style="text-align: center"> לינק לחשבונית: </h4>
        <a href=${link}> חשבונית </a>
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

  const mailOptions = {
    from: EMAIL_ADDRESS,
    to: [process.env['TEST_EMAIL'] || customer.email],
    subject: 'Invoicing',
    text: 'invoicing',
    html: output
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

//TODO - get an email working. - sales@carino.co.il.
//TODO - Decide with rami on the email text - link for now.
//TODO - decide with rami if to send the link is enough or if required to download and send as attachkemnt - link for now.
//TODO - Decide with rami how do you get the email address to send the email to. - getDocumentDetailsFromRivhit.