import * as fetch from "node-fetch";
import { DataControl } from "@remult/angular";
import { DateOnlyField, Entity, Field, IdEntity, ProgressListener, Remult} from "remult";
import { Roles } from "../app/users/roles";
import { LogisticsLog } from "../app/invoices-sent-to-logistics/logistics-log";
import { DateOnlyValueConverter } from "remult/valueConverters";
import { sendDataToFtp } from "../app/invoices-sent-to-logistics/sendFtp";
import { LogisticsController } from "../app/invoices-sent-to-logistics/logistics-controller";
import { callRivhit } from "../app/create-invoice/invoice";

export async function callSuperPharm(api: string) {
  const { SUPERPHARMSHOPKEY, SUPERPHARMSHOPURL } = process.env;

  let headers = new fetch.Headers();
  headers = {
    Accept: "application/json",
    Authorization: SUPERPHARMSHOPKEY,
  };

  let r = await fetch.default(SUPERPHARMSHOPURL + "/api/orders", {
      method: "GET",
      headers,
    })
    .then((response) => { return response.json()})
    .catch((error) => {
      throw error?.client_message || error;
    });
  return r.orders;
}

@Entity<OrdersSentToRivhit>("OrdersSentToRivhit", {
  allowApiRead: Roles.admin,
  defaultOrderBy: (self) => [
    self.invoiceDate.descending(),
    self.transmitDate.descending(),
  ],
})
export class OrdersSentToRivhit extends IdEntity {
  @DataControl({ width: "40" })
  @Field({ caption: "סוג" })
  documentType: number = 0;

  @DataControl({ width: "60" })
  @Field({ caption: "#" })
  documentNumber: number = 0;

  @DataControl({ width: "100" })
  @DateOnlyField({
    caption: "תאריך",
    displayValue: (_, d) => d.toLocaleDateString(),
  })
  invoiceDate!: Date;

  @DataControl({ width: "250" })
  @Field({ caption: "לקוח" })
  customerName: string = "";

  @DataControl({ width: "250" })
  @Field({ caption: "לקוח" })
  order_id: string = "";

  @DataControl({ width: "100" })
  @Field({ caption: "סכום" })
  amount: number = 0;

  @DataControl({ width: "200" })
  @Field({
    allowApiUpdate: false,
    caption: "שודר",
    displayValue: (_, d) => {
      let offset = d.getTimezoneOffset();
      return new Date(d.valueOf() + offset * 60 * 1000).toLocaleString();
      //d.toLocaleDateString();
    },
  })
  transmitDate: Date = new Date();

  @Field({ caption: "סטטוס" })
  status: string = "";
}

let running = false;
export async function checkForNewOrdersOnSuperpharm( remult?: Remult, progress?: ProgressListener) {
  if (running) throw "check for new orders already running";
  running = true;
  const log = await remult.repo(LogisticsLog).findFirst({ createIfNotFound: true });

  log.lastRun = new Date();
  // console.log("log: ", log);
  try {
    let lastDate = new Date();
    lastDate.setMonth(lastDate.getMonth() - 1);
    {
      let last = await remult.repo(OrdersSentToRivhit).findFirst({});
      // console.log("last: ", last);
      if (last) lastDate = last.invoiceDate;
      // console.log("last: ", last);
    }
    const result = await callSuperPharm("/api/orders");
    // console.log("result: ",result);

    let counter = 0;
    let newItems = 0;
    const repo = remult!.repo(OrdersSentToRivhit);
    // console.log("repo: ",repo);
    
    for (const d of result.filter((d) => d.order_state.includes("SHIPPED"))) {
      counter++;
      // console.log("counter: ",counter);
      // console.log("d: ",d);
      
      if (progress) progress.progress(counter / result.length);
      let i = await repo.findFirst({ where: (x) => x.order_id.isEqualTo(d.order_id),createIfNotFound: true});
      // console.log("i: ", i);

      if (i.isNew()) {
        // for each new order - create invoice and send to rivhit.
        
        console.log(((counter * 100) / result.length).toFixed() + "% processing new " + i.documentType + "/" + i.documentNumber + " - " + d.document_date);
        i.transmitDate = new Date();
        let sp = d.created_date.split('/');
        i.invoiceDate = DateOnlyValueConverter.fromJson!(sp[2] + "-" + sp[1] + "-" + sp[0]);
        i.customerName = d.customer.firstname;
        i.amount = d.total_price;
        try {
          newItems++;
          let req = {
            order: d.order_id,
            customer_id: "3521",
            last_name: "לקוחות סופר פארם",
            first_name: `${
              d.customer.firstname +
              d.customer.lastname
            }`,
            phone: d.customer.billing_address.phone,
            address: d.customer.billing_address.street_1,
            city: d.customer.billing_address.city,
            document_type: 1,
            price_include_vat: false,
            items: result
              .filter((d) => d.order_lines)
              .map((d) => ({
                item_id: d.rivhitId,
                quantity: d.quantity,
                catalog_number: d.product_sku,
                price_nis: d.price_unit,
                description: d.product_title,
              })),
          };
          await callRivhit("Document.New", req);
          i.status = "ok";
        } catch (error) {
          i.status = error;
          console.log(error);
        }
        await i.save();
      }
    }
    log.status = "ok";
    const r = { counter, newItems };
    console.log("checkForNewOrdersOnSuperpharm", r);
    return r;
  } catch (err) {
    log.status = err;
    throw err;
  } finally {
    running = false;
    await log.save();
  }
}
