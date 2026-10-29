import { DEFAULT_DOCUMENT_PREFIXES } from '../constants/settings';
import {
    BusinessDetailsValues,
    DocumentPrefixItem,
    DocumentSettingsValues,
    SettingsFormValues,
} from '../types/settings';

// Maps API enum keys ↔ form display keys
const API_TO_FORM_KEY: Record<string, string> = {
    INVOICE: 'Invoice',
    QUOTATION: 'Quotation',
    SALES_ORDER: 'Sales Order',
    AGREEMENT: 'Agreement',
};

const FORM_TO_API_KEY: Record<string, string> = {
    Invoice: 'INVOICE',
    Quotation: 'QUOTATION',
    'Sales Order': 'SALES_ORDER',
    Agreement: 'AGREEMENT',
};

/** API array → form Record */
export const prefixArrayToRecord = (items: DocumentPrefixItem[]): Record<string, string> => {
    const base = { ...DEFAULT_DOCUMENT_PREFIXES };
    items.forEach(({ type, prefix }) => {
        const formKey = API_TO_FORM_KEY[type] ?? type;
        base[formKey] = prefix;
    });
    return base;
};

/** Form Record → API array */
export const prefixRecordToArray = (record: Record<string, string>): DocumentPrefixItem[] =>
    Object.entries(record).map(([formKey, prefix]) => ({
        type: FORM_TO_API_KEY[formKey] ?? formKey.toUpperCase().replace(' ', '_'),
        prefix,
    }));

export const splitSettingsValues = (
    values: SettingsFormValues
): { businessDetails: BusinessDetailsValues; documentSettings: DocumentSettingsValues } => {
    const {
        businessName,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        gstNo,
        logoUrl,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        selectedDocumentType: _,
        ...documentSettings
    } = values;
    return {
        businessDetails: {
            businessName,
            address,
            city,
            state,
            pincode,
            phone,
            email,
            gstNo,
            logoUrl,
        },
        documentSettings,
    };
};
