import { IdEntity, StringColumn, EntityClass, BoolColumn, Context } from '@remult/core';
import { Roles } from '../users/roles';

@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
    imageUrl = new StringColumn();
    pacingFunction = new StringColumn('גורם אירוז');
    archive = new BoolColumn();
    constructor(context: Context) {
        super({
            name: "Products",
            allowApiInsert: Roles.admin,
            allowApiUpdate: Roles.admin,
            allowApiRead: true,
            apiDataFilter: () => {
                if (!context.isAllowed(Roles.admin))
                    return this.archive.isEqualTo(false);
            },

            defaultOrderBy: () => [this.archive, this.name]

        });
    }
}