export type OnboardingStep =
    | 'get-started'
    | 'review'
    | 'pan'
    | 'bank-verification'
    | 'consent'
    | 'success';

export interface CurrencyAccountBusinessData {
    businessName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
}

export type CurrencyAccountBusinessDetails = Partial<CurrencyAccountBusinessData>;

export type BankAccountFormValues = Pick<
    CurrencyAccountBusinessData,
    'bankName' | 'accountNumber' | 'ifsc'
>;

export interface PANVerificationFormValues {
    pan: string;
}

export interface BankVerificationFormValues {
    accountNumber: string;
    ifsc: string;
    name: string;
    phone: string;
}

export interface VerifiedBankData {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
    phone: string;
}

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
