export type DomesticAccount = {
    id: number;
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    bankAddress: string;
    ifscCode: string;
    accountType: 'Savings' | 'Current';
    status: number;
    default: number;
    bankBranch: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
};

export type VirtualAccount = {
    id: string;
    name: string;
    bankName: string;
    accountNumber: string;
    swiftCode?: string;
    ifsc?: string;
    iban?: string;
    currency: string;
    type: 'International' | 'Domestic';
};

export type VirtualAccountResponse = {
    id: number;
    status: string;
    vendor: string | null;
    activatedAt: string | null;
    businessName: string | null;
    bankName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    virtualAccountNumber: string | null;
    virtualIfsc: string | null;
    pan: string | null;
    panVerifiedAt: string | null;
    bankVerifiedAt: string | null;
    accountHolderName: string | null;
    phone: string | null;
};

export type EscrowAccount = {
    id: string;
    name: string;
    bankName: string;
    accountNumber: string;
    swiftCode: string;
    currency: string;
};

export type AddDomesticAccountFormValues = {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: 'Savings' | 'Current';
    bankBranch?: string;
};
