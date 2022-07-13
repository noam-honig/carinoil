import { DataControl } from "@remult/angular";
import { DateOnlyField, Entity, Field, IdEntity } from "remult";
import { Roles } from "../users/roles";

@Entity<InvoiceSentToLogistics>('invoicesSentToLogistics', {
    allowApiRead: Roles.admin,
    defaultOrderBy: self => [self.invoiceDate.descending(), self.transmitDate.descending()]
})
export class InvoiceSentToLogistics extends IdEntity {

    @DataControl({ width: '40' })
    @Field({ caption: 'סוג' })
    documentType: number = 0;
    @DataControl({ width: '60' })
    @Field({ caption: '#' })
    documentNumber: number = 0;
    @DataControl({ width: '100' })
    @DateOnlyField({
        caption: 'תאריך', displayValue: (_, d) => {
            let offset = d.getTimezoneOffset();
            return new Date(d.valueOf() + offset * 60 * 1000).toLocaleDateString();
            //d.toLocaleDateString();
        }
    })
    invoiceDate!: Date;
    @DataControl({ width: '250' })
    @Field({ caption: 'לקוח' })
    customerName: string = '';
    @DataControl({ width: '100' })
    @Field({ caption: 'סכום' })
    amount: number = 0;
    @DataControl({ width: '200' })
    @Field({ allowApiUpdate: false, caption: 'שודר' })
    transmitDate: Date = new Date();
    @Field({ caption: 'סטטוס' })
    status: string = '';
}