import dayjs from 'dayjs';

import {
    BuyerFormValues,
    ItemsFormValues,
    SellerFormValues,
    TransactionFormValues,
} from '../types/generateIrn';

export const defaultTransactionValues: TransactionFormValues = {
    supplyType: 'B2B',
    documentType: 'INV',
    documentPrefix: '',
    documentNumber: '',
    documentDate: dayjs().format('YYYY-MM-DD'),
    reverseCharge: false,
    igstOnIntra: false,
};

export const defaultSellerValues: SellerFormValues = {
    sellerGstin: '',
    legalName: '',
    tradeName: '',
    address1: '',
    location: '',
    pinCode: '',
    state: '',
};

export const defaultBuyerValues: BuyerFormValues = {
    buyerGstin: '',
    legalName: '',
    tradeName: '',
    phoneNumber: '',
    address1: '',
    location: '',
    pinCode: '',
    state: '',
    placeOfSupply: '',
};

export const defaultItemsValues: ItemsFormValues = {
    items: [
        {
            id: '1',
            description: '',
            hsnSac: '',
            quantity: 1,
            unit: 'PCS',
            unitPrice: 0,
            discount: 0,
            gstRate: 18,
        },
    ],
};

export const SUPPLY_TYPE_OPTIONS = [
    { label: 'B2B – Business to Business', value: 'B2B' },
    { label: 'SEZWP – SEZ With Payment', value: 'SEZWP' },
    { label: 'SEZWOP – SEZ Without Payment', value: 'SEZWOP' },
    { label: 'EXPWP – Export With Payment', value: 'EXPWP' },
    { label: 'EXPWOP – Export Without Payment', value: 'EXPWOP' },
    { label: 'DEXP – Deemed Export', value: 'DEXP' },
];

export const STEP_TITLES: Record<number, string> = {
    0: 'Transaction Details',
    1: 'Seller / Supplier Details',
    2: 'Buyer / Recipient Details',
    3: 'Line Items',
    4: 'Review & Generate',
};

export const DOCUMENT_TYPE_OPTIONS = [
    { label: 'INV – Tax Invoice', value: 'INV' },
    { label: 'CRN – Credit Note', value: 'CRN' },
    { label: 'DBN – Debit Note', value: 'DBN' },
];

export const DECIMAL_QUANTITY_UNITS = ['KGS', 'LTR', 'MTR', 'HR', 'OTH', 'MTS'];

export const UNIT_OPTIONS = [
    { label: 'MTS – Metric Tons', value: 'MTS' },
    { label: 'KGS – Kilograms', value: 'KGS' },
    { label: 'NOS – Numbers', value: 'NOS' },
    { label: 'PCS – Pieces', value: 'PCS' },
    { label: 'MTR – Metres', value: 'MTR' },
    { label: 'LTR – Litres', value: 'LTR' },
    { label: 'BOX – Box', value: 'BOX' },
    { label: 'PKT – Packet', value: 'PAC' },
    { label: 'SET – Set', value: 'SET' },
    { label: 'HR – Hours', value: 'HR' },
    { label: 'OTH – Others', value: 'OTH' },
];

export const GST_RATE_OPTIONS = [
    { label: '0%', value: 0 },
    { label: '0.1%', value: 0.1 },
    { label: '0.25%', value: 0.25 },
    { label: '1%', value: 1 },
    { label: '1.5%', value: 1.5 },
    { label: '3%', value: 3 },
    { label: '5%', value: 5 },
    { label: '6%', value: 6 },
    { label: '7.5%', value: 7.5 },
    { label: '12%', value: 12 },
    { label: '18%', value: 18 },
    { label: '28%', value: 28 },
];

export const IRN_STEPS = [
    { number: 1, title: 'Transaction', subtitle: 'Supply type & doc details' },
    { number: 2, title: 'Seller', subtitle: 'Supplier information' },
    { number: 3, title: 'Buyer', subtitle: 'Receipt information' },
    { number: 4, title: 'Items', subtitle: 'Line items & tax' },
    { number: 5, title: 'Review', subtitle: 'Preview & generate' },
];

export const FORM_STEP_TO_DISPLAY: Record<number, number> = {
    0: 1,
    1: 2,
    2: 3,
    3: 4,
    4: 5,
};
