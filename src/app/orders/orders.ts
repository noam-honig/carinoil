import { IdEntity, EntityClass, DateTimeColumn, BoolColumn, IdColumn, NumberColumn, ServerFunction, Context, StringColumn, ColumnOptions } from '@remult/core';
import { Roles } from '../users/roles';

@EntityClass
export class Orders extends IdEntity {
    name = new StringColumn("שם", {
        validate: () => {
            if (!this.name.value)
                this.name.validationError = 'חסר ערך';

        }
    });
    handled = new BoolColumn("טיפלתי בהזמנה");
    comment = new StringColumn("הערות");
    phone = new PhoneColumn();
    items = new StringColumn();
    createDate = new DateTimeColumn({ caption: "תאריך", allowApiUpdate: false });
    constructor(context: Context) {
        super({
            name: "Orders",
            allowApiUpdate: Roles.admin,
            allowApiInsert: true,
            allowApiRead: Roles.admin,
            defaultOrderBy: () => [{ column: this.createDate, descending: true }],
            saving: async () => {
                if (this.isNew() && context.onServer) {
                    this.createDate.value = new Date();
                    let items: productInOrder[] = JSON.parse(this.items.value);
                    if (!items || items.length === 0) {
                        this.items.validationError = 'חובה לכלול פריטים בהזמנה';
                    }
                    for (const p of items) {
                        let od = context.for(OrderDetails).create();
                        od.orderId.value = this.id.value;
                        od.product.value = p.product;
                        od.quantity.value = p.quantity;
                        await od.save();
                    }
                }
            }
        });
    }

}
@EntityClass
export class OrderDetails extends IdEntity {
    orderId = new IdColumn();
    product = new IdColumn();
    quantity = new NumberColumn();
    constructor() {
        super({
            name: "OrderDetails",
            allowApiUpdate: Roles.admin,
            allowApiRead: Roles.admin
        });
    }
}
export interface productInOrder {
    product: string;
    quantity: number;
}


export class PhoneColumn extends StringColumn {
    constructor(settingsOrCaption?: ColumnOptions<string>) {
        super({
            validate: () => {
                if (!this.value || this.value == '')
                    this.validationError = 'אנא הזן מספר טלפון';

                else if (!isPhoneValidForIsrael(this.value)) {
                    this.validationError = 'טלפון שגוי';
                }
            },
            caption: 'טלפון',
            dataControlSettings: () => ({
                click: () => window.open('tel:' + this.displayValue),
                allowClick: () => !!this.originalValue,
                clickIcon: 'phone',
                inputType: 'tel',
                forceEqualFilter: false
            })
        }, settingsOrCaption);
    }
    get displayValue() {
        return PhoneColumn.formatPhone(this.value);
    }
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

    static sendWhatsappToPhone(phone: string, smsMessage: string, context: Context) {
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
    static validatePhone(col: StringColumn, context: Context) {
        if (!col.value || col.value == '')
            return;

        if (!isPhoneValidForIsrael(col.value)) {
            col.validationError = 'טלפון שגוי';
        }
        /*
            if (col.displayValue.startsWith("05") || col.displayValue.startsWith("07")) {
              if (col.displayValue.length != 12) {
                col.validationError = getLang(context).invalidPhoneNumber;
              }
        
            } else if (col.displayValue.startsWith('0')) {
              if (col.displayValue.length != 11) {
                col.validationError = getLang(context).invalidPhoneNumber;
              }
            }
            else {
              col.validationError = getLang(context).invalidPhoneNumber;
            }
          */
    }
}
export function isPhoneValidForIsrael(input: string) {
    if (input) {
        let st1 = input.match(/^0(5\d|7\d|[2,3,4,6,8,9])(-{0,1}\d{3})(-*\d{4})$/);
        return st1 != null;
    }
}