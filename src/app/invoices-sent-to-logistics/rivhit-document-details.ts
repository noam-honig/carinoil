import { callRivhit } from "../create-invoice/invoice";


export interface Item {
    bruto_price_nis: number;
    catalog_number: string;
    description: string;
    discount: number;
    item_id: number;
    line: number;
    mtc_code: number;
    price_mtc: number;
    price_nis: number;
    quantity: number;
    storage_id: number;
    total_line: number;
}

export interface RivhitDocumentDetails {
    agent_id: number;
    comments: string;
    company_address: string;
    company_fax: string;
    company_id: number;
    company_name: string;
    company_phone: string;
    country: string;
    crm_user_id?: any;
    currency_id: number;
    customer_address: string;
    customer_city: string;
    customer_id: number;
    customer_id_number: number;
    customer_name: string;
    customer_phone: string;
    customer_zipcode: number;
    discount_amount: number;
    discount_percent: number;
    document_date: string;
    document_due_date: string;
    document_number: string;
    document_total: number;
    document_total_mtc: number;
    document_type: string;
    documnet_time: string;
    exchange_rate: number;
    items: Item[];
    order: string;
    payments?: any;
    project_id?: any;
    receipt_total: number;
    reference: number;
    total_vat: number;
    total_without_vat: number;
    vat_percent: string;
}




export async function getDocumentDetailsFromRivhit(type: number, number: number): Promise<RivhitDocumentDetails> {
    return await callRivhit("Document.Details", {
        "document_type": type,
        "document_number": number.toString()
    });
}