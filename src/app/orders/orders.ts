import { IdEntity, StringColumn, EntityClass, DateTimeColumn, BoolColumn, IdColumn, NumberColumn, ServerFunction, Context } from '@remult/core';
import { Roles } from '../users/roles';

@EntityClass
export class Orders extends IdEntity {
    name = new StringColumn("שם");
    handled = new BoolColumn("טיפלתי בהזמנה");
    createDate = new DateTimeColumn({ caption: "תאריך", allowApiUpdate: false });
    constructor(context: Context) {
        super({
            name: "Orders",
            allowApiUpdate: Roles.admin,
            allowApiRead: Roles.admin,
            defaultOrderBy: () => [{ column: this.createDate, descending: true }],
            saving: () => {
                if (this.isNew() && context.onServer)
                    this.createDate.value = new Date();
            }
        });
    }
    @ServerFunction({ allowed: true })
    static async SubmitOrder(name: string, products: productInOrder[], context?: Context) {
        let o = context.for(Orders).create();
        o.name.value = name;

        await o.save();
        for (const p of products) {
            let od = context.for(OrderDetails).create();
            od.orderId.value = o.id.value;
            od.product.value = p.product;
            od.quantity.value = p.quantity;
            await od.save();
        }

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