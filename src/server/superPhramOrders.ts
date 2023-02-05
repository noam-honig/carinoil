import * as fetch from "node-fetch";
import { DataControl } from "@remult/angular";
import { DateOnlyField, Entity, Field, IdEntity, ProgressListener, Remult} from "remult";
import { Roles } from "../app/users/roles";
import { callRivhit } from "../app/create-invoice/invoice";

export async function callSuperPharm(api: string) {
  const { SUPERPHARMSHOPKEY, SUPERPHARMSHOPURL } = process.env;

  let headers = new fetch.Headers();
  headers = {
    Accept: "application/json",
    Authorization: SUPERPHARMSHOPKEY,
  };

  let r = await fetch
    .default(SUPERPHARMSHOPURL + api, {
      method: "GET",
      headers,
    })
    .then((response) => {
      return response.json();
    })
    .catch((error) => {
      throw error?.client_message || error;
    });
  return r.orders;
}

@Entity<OrdersSentToRivhit>("orderSentToRivhit", {
  allowApiRead: Roles.admin,
  defaultOrderBy: (self) => [
    self.orderDate.descending(),
    self.transmitDate.descending(),
  ],
})
export class OrdersSentToRivhit extends IdEntity {
  @DataControl({ width: "100" })
  @DateOnlyField({
    caption: "תאריך",
    displayValue: (_, d) => d.toLocaleDateString(),
  })
  orderDate!: Date;

  @DataControl({ width: "250" })
  @Field({ caption: "לקוח" })
  customerName: string = "";

  @DataControl({ width: "250" })
  @Field({ caption: "מספר הזמנה" })
  order_id: string = "";

  @DataControl({ width: "100" })
  @Field({ caption: "סכום" })
  amount: number;

  @DataControl({ width: "200" })
  @Field({
    allowApiUpdate: false,
    caption: "שודר",
    displayValue: (_, d) => {
      let offset = d.getTimezoneOffset();
      return new Date(d.valueOf() + offset * 60 * 1000).toLocaleString();
    },
  })
  transmitDate: Date = new Date();

  @Field({ caption: "סטטוס" })
  status: string = "";
}

@Entity("superPharmLog", { allowApiRead: Roles.admin })
export class SuperPharmLog extends IdEntity {
  @Field()
  lastRun: Date = new Date();
  @Field()
  status: string = "";
}

let running = false;
export async function checkForNewOrdersOnSuperpharm(
  remult?: Remult,
  progress?: ProgressListener
) {
  if (running) throw "check for new orders already running";
  running = true;
  const log = await remult
    .repo(SuperPharmLog)
    .findFirst({ createIfNotFound: true });

  log.lastRun = new Date();
  try {
    const result = await callSuperPharm("/api/orders?paginate=false&order_state_codes=SHIPPING");

    let counter = 0;
    let newItems = 0;
    const repo = remult!.repo(OrdersSentToRivhit);

    for (const d of result) {
      counter++;

      if (progress) progress.progress(counter / result.length);
      let i = await repo.findFirst({where: (x) => x.order_id.isEqualTo(d.order_id),createIfNotFound: true,});

      if (i.isNew()) {
        // for each new order - create invoice and send to rivhit.

        const { API_KEY, SUPERPHARMID } = process.env;

        i.transmitDate = new Date();
        const date = new Date(d.created_date);
        i.orderDate = date;
        i.customerName = d.customer.firstname + " " + d.customer.lastname;
        i.amount = d.total_price;
        try {
          newItems++;

          let items = d.order_lines.filter((d) => d.order_line_state === "SHIPPING").map((d) => ({
              quantity: d.quantity,
              catalog_number: d.product_sku,
              price_nis: d.price_unit,
              description: d.product_title,
            }));

          if (items.length === 0) return;

          if (d.shipping_price)
            items.push({
              quantity: 1,
              catalog_number: d.shipping_type_code,
              price_nis: d.shipping_price,
              description: d.shipping_type_label,
            });

          let req = {
            token_api: API_KEY,
            document_type: 1,
            customer_id: SUPERPHARMID,
            order: i.order_id,
            last_name: "לקוחות סופר פארם",
            first_name: `${d.customer.firstname + " " + d.customer.lastname}`,
            phone: d.customer.shipping_address.phone,
            address: d.customer.shipping_address.street_1,
            comments:d.customer.shipping_address.street_2,
            city: d.customer.shipping_address.city,
            price_include_vat: true,
            items,
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
