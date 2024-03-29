import { BackendMethod, Entity, Field, IdEntity, IntegerField, Remult } from "remult";
import { Customer } from "../customers/customer";
import { Roles } from "../users/roles";
import * as fetch from 'node-fetch';
import { OrderDetails } from "../orders/orders";
import { Products } from "../products/products";

@Entity<Invoice>('invoices', {
    allowApiCrud: false

})
export class Invoice extends IdEntity {
    @Field()
    orderId: string;
    @Field()
    customer: Customer
    @Field()
    date: Date;
    @Field()
    details: ItemInInvoice[];
    @Field()
    apiResponse: any;

    @BackendMethod({ allowed: Roles.admin })
    async create() {
        if (!this.isNew())
            throw "Invalid Operation";
        this.date = new Date();


        let req = {
            document_type: 1,
            customer_id: this.customer.rivhitId,
            price_include_vat: false,
            items: this.details.filter(d => d.quantity).map(d => ({
                item_id: d.rivhitId,
                quantity: d.quantity,
                catalog_number: d.catalog_number,
                price_nis: d.unitPrice
            }))

        };
        this.apiResponse = await callRivhit("Document.New", req);

        await this.save();

    }
    @BackendMethod({ allowed: Roles.admin })
    static async buildItemsInInvoice(orderId: string, customerIdInRivhit?: number, productId?: string, remult?: Remult) {
        let result: ItemInInvoice[] = [];

        let previousInvoices = await remult.repo(Invoice).find({ where: x => x.orderId.isEqualTo(orderId) });


        let addToResult = async (p: Products, quantity: number, orderDetailId: string) => {
            let quantityInStock: string;
            if (p.rivhitId == 0)
                quantityInStock = "קוד פריט ברווחית לא מעודכן";
            else {
                try {
                    quantityInStock = await callRivhit("Item.Quantity", {
                        item_id: p.rivhitId
                    }).then(r => r.quantity);
                }
                catch (err) {
                    quantityInStock = err
                }
            }
            let quantityDelivered = previousInvoices.map(i => i.details.find(d => d.orderDetailId == orderDetailId))?.map(d => d?.quantity).reduce((a, b) => a + b, 0);
            if (!quantityDelivered)
                quantityDelivered = 0;

            result.push({
                orderDetailId: orderDetailId,
                orderedQuantity: quantity,
                catalog_number: p.SKU,
                productName: p?.name,
                rivhitId: p?.rivhitId,
                quantity: quantity - quantityDelivered > 0 ? quantity - quantityDelivered : 0,
                quantityInStock,
                unitPrice: 0,
                quantityDelivered,
                productId:p.id

            })
        }
        if (productId) {
            addToResult(await remult.repo(Products).findId(productId), 0, "");
        }
        else
            for await (const od of remult.repo(OrderDetails).iterate({ where: od => od.orderId.isEqualTo(orderId) })) {

                await addToResult(od.product, od.quantity, od.id);

            }
        await Invoice.updatePriceList(result, customerIdInRivhit);
        return result;
    }
    static async updatePriceList(items: ItemInInvoice[], customerIdInRivhit?: number) {
        let p = await Invoice.getPriceList(customerIdInRivhit);
        for (const item of items) {
            item.unitPrice = p.find(x => x.item_id == item.rivhitId)?.price_nis
        }
    }
    @BackendMethod({ allowed: Roles.admin })
    static async getPriceList(customerIdInRivhit?: number): Promise<{ item_id: number, price_nis: number }[]> {
        let price_list_id = 0;
        try {
            if (customerIdInRivhit)
                price_list_id = await callRivhit("Customer.Get", { customer_id: customerIdInRivhit }).then((r: CustomerInfoInRivhit) => r.price_list_id);
            if (price_list_id > 0)
                return callRivhit("PriceList.Items", { price_list_id }).then(x => x.price_list_items);
        } catch { }
        return getRivhitItems().then((x) => x.item_list.map(({ item_id, sale_nis }) => ({ item_id, price_nis: sale_nis })))
    }
}


export class ItemInInvoice {
    orderDetailId: string;
    productId:string;
    productName: string;
    rivhitId: number;
    catalog_number: string;
    orderedQuantity: number;
    quantityInStock: string;
    @IntegerField({ caption: ' ' })
    quantity: number;
    @Field({ caption: ' ' })
    unitPrice: number;
    quantityDelivered: number;
}
export interface RivhitDocument {
    document_type: number;
    document_number: number;
    document_date: string;
    sortDate: string;
    document_time: string;
    amount: number;
    amount_exempt: number;
    customer_id: number;
    agent_id: number;
    is_cancelled: boolean;
    customer_name: string;
    order: string;
    sort_code: number;
    total_vat: number;
    document_type_name: string;
    is_accounting: boolean;
    project_id: number;
  }
  

export async function getRivhitItems(): Promise<{ item_list: { item_id: number, sale_nis: number, item_part_num: string }[] }> {
    return callRivhit("Item.List", {});
}
export async function callRivhit(api: string, args: any) {
    //console.time(api);
    var raw = JSON.stringify({
        api_token: process.env.API_KEY,
        ...args
    });
    let headers = new fetch.Headers();
    headers.append("Content-Type", "application/json");

    let r = await fetch.default("https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/" + api, {
        method: 'POST',
        headers,
        body: raw
    })
        .then(response => response.json())
        .catch(error => { throw error?.client_message || error });
    if (r.error_code != 0)
        throw api + ":" + r.client_message;
    //console.timeEnd(api);
    return r.data;
}
export interface CustomerInfoInRivhit {
    price_list_id: number;
    customer_id: number;
    last_name: string;
}