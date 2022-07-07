
import { Builder } from 'xml2js';
import { RivhitDocumentDetails } from './rivhit-document-details';

export interface OutGoingXml {
    DATACOLLECTION: OutGoingDatacollection[];
}

export interface OutGoingDatacollection {
    DATA: OutGoingData[];
}

export interface OutGoingData {
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
    LINES: OutGoingLines;
}

export interface OutGoingLines {
    LINE: OutGoingLine[];
}

export interface OutGoingLine {
    ORDERLINE: number;
    REFERENCEORDLINE: string;// could be number
    SKU: string;
    QTYORIGINAL: number;
    NOTES: string;
    INVENTORYSTATUS: string;
}

export interface IncomingXmlMessage {
    DATACOLLECTION: IncomingDatacollection;
}

export interface IncomingDatacollection {
    DATA: IncomingData;
}

export interface IncomingData {
    CONSIGNEE: string;
    ORDERID: string;
    ORDERTYPE: string;
    REFERENCEORD: string;
    SOURCECOMPANY: string;
    COMPANYTYPE: string;
    CREATEDATE: string;
    EXPECTEDDATE: string;
    NOTES: string;
    LINES: IncomingLines;
}

export interface IncomingLines {
    LINE: IncomingLine[];
}

export interface IncomingLine {
    ORDERLINE: number;
    REFERENCEORDLINE: string;
    SKU: string;
    QTYORDERED: number;
    INVENTORYSTATUS: string;
}



export function createOrianOutGoingMessage(d: RivhitDocumentDetails) {
    const date = d.document_date.split('/');
    const time = d.documnet_time.split(':');
    const docNumber = d.document_number.replace(/\//g, '');
    let CITY = d.customer_city;
    let STREET1 = d.customer_address;
    if (!CITY && d.document_number.startsWith('02')) {

        let z = STREET1.indexOf(',');
        if (z > 0) {
            CITY = STREET1.substring(0, z);
            STREET1 = STREET1.substring(z + 1);
        }
    }
    STREET1 = STREET1.replace(/,/g, ' ');
    const items = d.items.filter(item => item.catalog_number && item.catalog_number != '9999');
    if (items.length === 0) {
        throw "no items";
    }
    const timestamp = date[2] + date[1] + date[0] + time[0] + time[1] + time[2];
    if (d.document_number.startsWith('11')) {
        {
            return {
                filename: 'INBOUND_' + docNumber + "_" + timestamp + "_CAR.xml",
                xml: new Builder().buildObject({
                    DATACOLLECTION: {
                        DATA: {
                            CONSIGNEE: 'CAR',
                            ORDERID: docNumber,
                            ORDERTYPE: 'RET',
                            REFERENCEORD: '',
                            SOURCECOMPANY: 'CAR002',
                            COMPANYTYPE: 'CUSTOMER',
                            CREATEDATE: d.document_date.replace(/\//g, '-'),
                            EXPECTEDDATE: d.document_date.replace(/\//g, '-'),
                            NOTES: d.comments!,
                            LINES: {
                                LINE: items.map(item => ({
                                    ORDERLINE: item.line,
                                    REFERENCEORDLINE: '',
                                    SKU: item.catalog_number,
                                    QTYORDERED: item.quantity,
                                    INVENTORYSTATUS: 'AVAILABLE'
                                }) as IncomingLine)
                            }
                        }
                    }
                } as IncomingXmlMessage)
            }
        }
    } else
        return {
            filename: 'OUTBOUND_' + docNumber + "_" + timestamp + "_CAR.xml",
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
                        STREET1,
                        STREET2: '',
                        CITY,
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
                            LINE: items.map(item =>
                            ({
                                ORDERLINE: item.line,
                                REFERENCEORDLINE: '',
                                SKU: item.catalog_number,
                                QTYORIGINAL: item.quantity,
                                INVENTORYSTATUS: 'AVAILABLE',
                                NOTES: '',
                            } as OutGoingLine))
                        }
                    }]
                }]
            } as OutGoingXml)
        }
}
