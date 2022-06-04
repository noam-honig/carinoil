import { Entity, Field, IdEntity } from "remult";
import { Roles } from "../users/roles";
@Entity("logisticsLog", { allowApiRead: Roles.admin })
export class LogisticsLog extends IdEntity {
    @Field()
    lastRun:Date = new Date();
    @Field()
    status: string = '';
}