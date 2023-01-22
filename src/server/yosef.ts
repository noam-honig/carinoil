import { Remult } from "remult";
import { callRivhit, RivhitDocument } from "../app/create-invoice/invoice";
import { getDataProvider } from "./getDataProvider";
import { sendMail } from "./sendMail";
import { callSuperPharm, checkForNewOrdersOnSuperpharm } from "./superPhramOrders";

getDataProvider().then(async dp => {
  const remult = new Remult();
  remult.setDataProvider(dp);
  const result: { document_list: RivhitDocument[] } = await callRivhit("Document.List", {
   // from_date: dateToString(lastDate),
  //  to_date: dateToString(new Date()),
    from_document_type: 1,
    to_document_type: 11

});
// console.log(result);
// await sendMail(98, 1);

  // const data  = await callSuperPharm("/api/orders")
  // console.log("data: ", data);
  checkForNewOrdersOnSuperpharm(remult).then(x => {
    console.log("Hii")
  })
});
