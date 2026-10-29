import { DropDown } from '@customtypes/general';

export type getpaymentlinkPayload = {
    payment_link_image?: any;
    full_name: string;
    email: string;
    phone_number: string;
    amount: number;
    notification?: string;
    expires_at: any;
    purpose_message: any;
};

export type PaymentLinkOrder = {
    id: number;
    sentPayload: {
        email: string;
        amount: string;
        full_name: string;
        expires_at: string;
        notification: 'EML' | 'SMS' | 'LNK' | 'ALL';
        phone_number: string;
    };
    client_url: string;
    status: string;
    updates: any[];
    paymobId: string | null;
    invoiceId: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    credential: {
        name: string;
        email: string;
        username: string;
    };
    amount: number;
};
export interface Statistics {
    totalPaymentRequests: number;
    totalAmountRequested: string;
    totalPaidRequests: number;
    totalPendingRequests: number;
    totalPaidAmount: string;
    totalPendingAmount: string;
}

export type OrderHistoryResponse = {
    recordsTotal: number;
    data: PaymentLinkOrder[];
    statistics: Statistics;
};
export type BankListResponse = {
    bankList: DropDown;
    bankDetails: BankDetails;
};

export type BankDetails = {
    id: number;
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    bankAddress: string;
    iban: string;
    swiftCode: string;
    accountType: string;
    destinationIdLean: string;
    bankIdentifier: string | null;
    status: number;
    default: number;
    createdAt: string; // Date ISO string
    updatedAt: string; // Date ISO string
    credentialId: number;
};

export type CreateSupplierPayload = {
    bankId: number | string;
    accountHolderName: string;
    accountNumber: string;
    ibanNumber: string;
    companyLogo: File | string;
};

export type KybDocumentPayload = {
    file?: File | string;
    documentName: KYBDocumentName | '';
    websiteLink?: string;
    isFinalUpload: boolean;
    natureOfBusiness?: string;
    userConsent?: boolean;
};

export type ExistingDocumentsListResponse = {
    corporateDocuments: CorporateDocument;
};

export type UploadedDocuments = {
    Trade_License?: {
        fileUrl: string;
        isUploaded: boolean;
    };
    Articles_Of_Association?: {
        fileUrl: string;
        isUploaded: boolean;
    };
    Emirates_ID?: {
        fileUrl: string;
        isUploaded: boolean;
    };
    Passport?: {
        fileUrl: string;
        isUploaded: boolean;
    };
    Bank_Letter?: {
        fileUrl: string;
        isUploaded: boolean;
    };
};

export interface CorporateDocument {
    Trade_License?: string;
    Articles_Of_Association?: string;
    Emirates_ID?: string;
    Passport?: string;
    Bank_Letter?: string;
    Nature_Of_Business?: string;
    Proof_Of_Business?: string;
    supplierDetails: {
        bankDetails?: {
            bankId?: string;
            bankAccountHolderName?: string;
            bankAccount?: string;
            iban?: string;
        };
        uploadedDocuments: UploadedDocuments;
        natureOfBusiness?: string;
        websiteLink?: string;
        companyLogo?: string;
    };
    userConsent?: boolean;
}

export interface KYBDocumentUploadForm {
    Trade_License?: string;
    Articles_Of_Association?: string;
    Emirates_ID?: string;
    Passport?: string;
    Bank_Letter?: string;
    natureOfBusiness?: string;
    websiteLink?: string;
    uploadedStatus: {
        Trade_License?: boolean;
        Articles_Of_Association?: boolean;
        Emirates_ID?: boolean;
        Passport?: boolean;
        Bank_Letter?: boolean;
    };
    userConsent: boolean;
}

export type KYBDocumentName =
    | 'Trade_License'
    | 'Articles_Of_Association'
    | 'Emirates_ID'
    | 'Passport'
    | 'Bank_Letter';
