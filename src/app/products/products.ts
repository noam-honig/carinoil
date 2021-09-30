import { DataControl } from '@remult/angular';
import { Entity, Field, IdEntity, IntegerField } from 'remult';
import { Roles } from '../users/roles';

@Entity<Products>("Products", {
    allowApiInsert: Roles.admin,
    allowApiUpdate: Roles.admin,
    allowApiRead: true,
    defaultOrderBy: (self) => [self.archive, self.seder, self.name]
}, (options, remult) => options.apiPrefilter = (self) => {
    if (!remult.isAllowed(Roles.admin))
        return self.archive.isEqualTo(false);
})
export class Products extends IdEntity {
    @DataControl({ width: '50px' })
    @Field({ caption: "סדר" })
    seder: number;
    @Field()
    name: string;
    @Field()
    imageUrl: string;
    @Field({ caption: 'גורם אירוז' })
    pacingFunction: string;
    @Field({ caption: 'מק"ט' })
    SKU: string;
    @IntegerField({ caption: 'מספר ברווחית' })
    rivhitId: number;
    @Field({caption:'אל תציג'})
    archive: boolean;


}