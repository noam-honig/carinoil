import { BackendMethod, Entity, Field, IdEntity, IntegerField, Remult } from "remult";
import { Customer } from "../customers/customer";
import { Roles } from "../users/roles";
import * as fetch from 'node-fetch';

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
    async create(remult?: Remult) {
        if (!this.isNew())
            throw "Invalid Operation";
        this.date = new Date();


        let req = {
            document_type: 1,
            customer_id: this.customer.rivhitId,
            items: this.details.filter(d => d.quantity).map(d => ({
                item_id: d.rivhitId,
                quantity: d.quantity,
                catalog_number:d.catalog_number,
                price_nis:1
            }))

        };
        this.apiResponse = await callRivhity("Document.New", req);

        await this.save();

    }
}


export class ItemInInvoice {
    orderDetailId: string;
    productName: string;
    rivhitId: number;
    catalog_number:string;
    orderedQuantity: number;
    quantityInStock: string;
    @IntegerField({ caption: ' ' })
    quantity: number;
}
export async function callRivhity(api: string, args: any) {
    var raw = JSON.stringify({
        api_token: process.env.API_KEY,
        ...args
    });
    console.log(raw);
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
        throw r.client_message;
    return r.data;


}