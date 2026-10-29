import { DropDown } from '@customtypes/general';

export type InvoiceProfileData = {
    email: string;
    mobileNo: string;
    name: string;
    gstNumber: string | null;
    logo: string | null;
};

export type InvoiceAddressItem = {
    id: number;
    addressLine1: string;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    default: number;
};

export type BusinessDetailsValues = {
    businessName?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone: string;
    email?: string;
    gstNo?: string;
    logoUrl?: string | null;
};

export type DocumentPrefixItem = {
    type: string;
    prefix: string;
};

export type GetSettingsResponse = {
    id: number;
    corporateUserId: number;
    businessName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phoneNumber: string;
    email: string;
    gstNo: string;
    logoUrl: string | null;
    signatureUrl: string | null;
    autoUpdateDocumentNumber: boolean;
    autoAddToCatalog: boolean;
    gstPercent: string | null;
    currency: string | null;
    paymentMode: string | null;
    defaultDueDays: number | null;
    termsAndConditions: string;
    notes: string;
    documentNumberPrefix: DocumentPrefixItem[];
    createdAt: string;
    updatedAt: string;
};

export type DocumentSettingsValues = {
    autoUpdateDocNumber?: boolean;
    autoAddItemsToCatalog?: boolean;
    gstPercent?: string;
    currency?: string;
    paymentMode?: string;
    defaultDueDays?: number;
    selectedDocumentType?: string;
    documentPrefixes?: Record<string, string>;
    termsAndConditions?: string;
    notes?: string;
    signature?: File | null;
    signatureUrl?: string | null;
    removeSignature?: boolean;
};

export type SettingsFormValues = BusinessDetailsValues & DocumentSettingsValues;

export type FilePayload = {
    file: string;
    format: string;
};

export type SaveSettingsPayload = {
    autoUpdateDocumentNumber?: boolean;
    autoAddToCatalog?: boolean;
    gstPercent?: string;
    currency?: string;
    paymentMode?: string;
    defaultDueDays?: number;
    termsAndConditions?: string;
    notes?: string;
    signature?: FilePayload;
    documentPrefixes?: DocumentPrefixItem[];
    removeSignature?: boolean;
};

export type IndianStatesResponse = {
    states: DropDown;
};
