import { Entity, Field, IdEntity, IntegerField } from "remult";
import { Roles } from "../users/roles";



@Entity<Customer>('customers', {
    allowApiCrud: Roles.admin,
    defaultOrderBy: x => x.name
})
export class Customer extends IdEntity {
    @Field({ caption: 'שם לקוח' })
    name: string;
    @IntegerField({ caption: 'מספר ברווחית' })
    rivhitId: number;
}
