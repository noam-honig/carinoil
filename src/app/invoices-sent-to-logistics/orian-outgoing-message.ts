
import { Builder } from 'xml2js';
import { RivhitDocumentDetails } from './rivhit-document-details';

export interface Welcome2 {
    DATACOLLECTION: Datacollection[];
}

export interface Datacollection {
    DATA: Data[];
}

export interface Data {
    CONSIGNEE: string;
    ORDERID: string;
    ORDERTYPE: string;
    REFERENCEORD: string;
    TARGETCOMPANY: string;
    COMPANYTYPE: string;
    REQUESTEDDATE: string;
    CREATEDATE: string;
    ROUTE: string;
    NOTES: string;
    CHECK1DATE: string;
    CHECK1AMOUNT: string;
    CHECK2DATE: string;
    CHECK2AMOUNT: string;
    CHECK3DATE: string;
    CHECK3AMOUNT: string;
    CASH: string;
    COLLECT: string;
    FRIDAY: string;
    DELIVERYCOMMENTS: string;
    DELEVERYCONFIRMATION: string;
    STREET1: string;
    STREET2: string;
    CITY: string;
    STATE: string;
    ZIP: number;
    CONTACT1NAME: string;
    CONTACT2NAME: string;
    CONTACT1PHONE: string;
    CONTACT2PHONE: string;
    CONTACT1FAX: string;
    CONTACT2FAX: string;
    CONTACT1EMAIL: string;
    CONTACT2EMAIL: string;
    LINES: Lines;
}

export interface Lines {
    LINE: Line[];
}

export interface Line {
    ORDERLINE: number;
    REFERENCEORDLINE: string;// could be number
    SKU: string;
    QTYORIGINAL: number;
    NOTES: string;
    INVENTORYSTATUS: string;
}
export function createOrianOutGoingMessage(d: RivhitDocumentDetails) {
    const date = d.document_date.split('/');
    const time = d.documnet_time.split(':');
    const docNumber = d.document_number.replace(/\//g, '');
    if (!d.customer_city && d.document_number.startsWith('02')) {

        let z = d.customer_address.indexOf(',');
        if (z > 0) {
            d.customer_city = d.customer_address.substring(0, z);
            d.customer_address = d.customer_address.substring(z + 1);
        }
    }
    d.customer_address = d.customer_address.replace(/,/g, ' ');
    return {
        filename: 'OUTBOUND_' + docNumber + "_" + date[2] + date[1] + date[0] + time[0] + time[1] + time[2] + "_CAR.xml",
        xml: new Builder().buildObject({
            DATACOLLECTION: [{
                DATA: [{
                    CONSIGNEE: 'CAR',
                    ORDERID: docNumber,
                    ORDERTYPE: 'CUSTOMER',
                    REFERENCEORD: '',
                    TARGETCOMPANY: 'CAR002',
                    COMPANYTYPE: "CUSTOMER",
                    REQUESTEDDATE: d.document_date.replace(/\//g, '-'),
                    CREATEDATE: d.document_date.replace(/\//g, '-'),
                    ROUTE: 'AVIV',
                    NOTES: d.comments,
                    CHECK1DATE: '',
                    CHECK1AMOUNT: '',
                    CHECK2DATE: '',
                    CHECK2AMOUNT: '',
                    CHECK3DATE: '',
                    CHECK3AMOUNT: '',
                    CASH: '',
                    COLLECT: '',
                    FRIDAY: '',
                    DELIVERYCOMMENTS: '',
                    DELEVERYCONFIRMATION: '',
                    STREET1: d.customer_address,
                    STREET2: '',
                    CITY: d.customer_city,
                    STATE: 'ישראל',
                    ZIP: d.customer_zipcode,
                    CONTACT1NAME: d.customer_name,
                    CONTACT1PHONE: d.customer_phone,
                    CONTACT1EMAIL: '',
                    CONTACT1FAX: '',
                    CONTACT2NAME: '',
                    CONTACT2EMAIL: '',
                    CONTACT2FAX: '',
                    CONTACT2PHONE: '',
                    LINES: {
                        LINE: d.items.filter(item => item.catalog_number && item.catalog_number != '9999').map(item =>
                        ({
                            ORDERLINE: item.line,
                            REFERENCEORDLINE: '',
                            SKU: item.catalog_number,
                            QTYORIGINAL: item.quantity,
                            INVENTORYSTATUS: 'AVAILABLE',
                            NOTES: '',
                        } as Line))
                    }
                }]
            }]
        } as Welcome2)
    }
}
