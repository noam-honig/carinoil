import { DataControl } from '@remult/angular';
import { Entity, Field, IdEntity, IntegerField, isBackend, Remult, Validators } from 'remult';
import { InputTypes } from 'remult/inputTypes';
import { Customer } from '../customers/customer';
import { Products } from '../products/products';
import { Roles } from '../users/roles';

@Entity<Orders>("Orders", {
    allowApiUpdate: Roles.admin,
    allowApiInsert: true,
    allowApiRead: Roles.admin,
    allowApiDelete: Roles.admin,
    defaultOrderBy: (self) => [self.handled, self.createDate.descending()]
}
    , (options, remult) =>
        options.saving = async (self) => {
            if (self.isNew() && isBackend()) {
                self.createDate = new Date();
                let items: productInOrder[] = JSON.parse(self.items);
                if (!items || items.length === 0) {
                    self.$.items.error = 'חובה לכלול פריטים בהזמנה';
                }
                for (const p of items) {
                    let od = remult.repo(OrderDetails).create();
                    od.orderId = self.id;
                    od.product = await remult.repo(Products).findId(p.product);
                    od.quantity = p.quantity;
                    await od.save();
                }
            }
        }
)
export class Orders extends IdEntity {
    @Field({
        caption: "שם",
        validate: Validators.required.withMessage("חסר ערך")
    })
    name: string;
    @Field({ caption: "חנות" })
    store: string;
    @Field({ caption: "טיפלתי בהזמנה" })
    handled: boolean;
    @Field({ caption: "הערות" })
    comment: string;
    @PhoneField()
    phone: string;
    @Field()
    items: string;
    @Field<any, Date>({
        caption: "תאריך", allowApiUpdate: false
    })
    createDate: Date;
    @Field({ caption: 'לקוח', allowNull: true })
    customer: Customer;
    @Field({ caption: 'הערה של רמי' })
    ramiComment: string;
}
@Entity("OrderDetails", {
    allowApiUpdate: Roles.admin,
    allowApiRead: Roles.admin
})
export class OrderDetails extends IdEntity {
    @Field()
    orderId: string;
    @Field()
    product: Products;
    @IntegerField()
    quantity: number;
}
export interface productInOrder {
    product: string;
    quantity: number;
}
export function PhoneField() {
    return (target, key) => {
        Field<any, string>({
            validate: (_, self) => {
                if (!self.value || self.value == '')
                    self.error = 'אנא הזן מספר טלפון';

                else if (!isPhoneValidForIsrael(self.value)) {
                    self.error = 'טלפון שגוי';
                }
            },
            caption: 'טלפון',
            displayValue: (_, phone) => PhoneColumn.formatPhone(phone)
        })(target, key);
        DataControl<any, string>({
            click: (_, self) => window.open('tel:' + self.displayValue),
            allowClick: (_, self) => !!self.originalValue,
            clickIcon: 'phone',
            inputType: 'tel',
            useContainsFilter: false
        });
    }
}
export class PhoneColumn {

    static fixPhoneInput(s: string) {
        if (!s)
            return s;
        let orig = s;
        s = s.replace(/\D/g, '');
        if (orig.startsWith('+'))
            return '+' + s;
        if (s.length == 9 && s[0] != '0' && s[0] != '3')
            s = '0' + s;
        return s;
    }

    static sendWhatsappToPhone(phone: string, smsMessage: string, remult: Remult) {
        phone = PhoneColumn.fixPhoneInput(phone);
        if (phone.startsWith('0')) {
            phone = '972' + phone.substr(1);
        }

        if (phone.startsWith('+'))
            phone = phone.substr(1);

        window.open('https://wa.me/' + phone + '?text=' + encodeURI(smsMessage), '_blank');
    }

    static formatPhone(s: string) {
        if (!s)
            return s;
        let x = s.replace(/\D/g, '');
        if (x.length < 9 || x.length > 10)
            return s;
        if (x.length < 10 && !x.startsWith('0'))
            x = '0' + x;
        x = x.substring(0, x.length - 4) + '-' + x.substring(x.length - 4, x.length);

        x = x.substring(0, x.length - 8) + '-' + x.substring(x.length - 8, x.length);

        return x;
    }

}
export function isPhoneValidForIsrael(input: string) {
    if (input) {
        let st1 = input.match(/^0(5\d|7\d|[2,3,4,6,8,9])(-{0,1}\d{3})(-*\d{4})$/);
        return st1 != null;
    }
}