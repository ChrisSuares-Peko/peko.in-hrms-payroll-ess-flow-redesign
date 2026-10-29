import { GenerateIrnFormState } from '../types/generateIrn';
import { GetInvoiceByIdResponse } from '../types/invoice';

const INVOICE_UNIT_TO_IRN: Record<string, string> = {
    kg: 'KGS',
    ltr: 'LTR',
    nos: 'NOS',
    pcs: 'PCS',
    mtr: 'MTR',
    box: 'BOX',
    set: 'SET',
    hr: 'OTH',
    non: 'OTH',
};

const mapUnit = (unit: string): string =>
    INVOICE_UNIT_TO_IRN[unit?.toLowerCase()] ?? unit?.toUpperCase() ?? 'OTH';

export const mapInvoiceToIrn = (invoice: GetInvoiceByIdResponse): GenerateIrnFormState => ({
    invoiceId: invoice.id,
    transaction: {
        supplyType: 'B2B',
        documentType: 'INV',
        documentPrefix: '',
        documentNumber: '',
        documentDate: invoice.invoiceDate,
        reverseCharge: false,
        igstOnIntra: false,
    },
    seller: {
        sellerGstin: '',
        legalName: '',
        tradeName: '',
        address1: '',
        location: '',
        pinCode: '',
        state: '',
    },
    buyer: {
        customerId: invoice.customerId,
        buyerGstin: invoice.gstNumber || '',
        legalName: invoice.name,
        tradeName: '',
        phoneNumber: invoice.phoneNumber || '',
        address1: invoice.address,
        location: invoice.city,
        pinCode: invoice.pincode,
        state: invoice.state,
        placeOfSupply: '',
    },
    items: {
        items: invoice.items.map((item, index) => ({
            id: String(index + 1),
            description: item.name,
            hsnSac: item.hsn,
            quantity: Number(item.quantity),
            unit: mapUnit(item.unit),
            unitPrice: Number(item.unitPrice),
            discount: Number(item.quantity) * Number(item.unitPrice) * (Number(item.discount) / 100),
            gstRate: Number(item.taxRate),
        })),
    },
});
