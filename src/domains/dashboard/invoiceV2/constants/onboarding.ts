import {
    BankVerificationFormValues,
    CurrencyAccountBusinessData,
    OnboardingStep,
    VerifiedBankData,
} from '../types/onboarding';

export const STEP_LABELS: Record<
    Extract<OnboardingStep, 'review' | 'pan' | 'bank-verification' | 'consent'>,
    string
> = {
    review: 'Business Details',
    pan: 'PAN Verification',
    'bank-verification': 'Bank Verification',
    consent: 'Consent & Confirm',
};

export const STEP_ORDER = ['review', 'pan', 'bank-verification', 'consent'] as const;

export const BACK_STEP: Partial<Record<OnboardingStep, OnboardingStep>> = {
    pan: 'review',
    'bank-verification': 'pan',
    consent: 'bank-verification',
};

export const DEFAULT_CURRENCY_ACCOUNT_BUSINESS: CurrencyAccountBusinessData = {
    businessName: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
};

export const DEFAULT_BANK_VERIFICATION_VALUES: BankVerificationFormValues = {
    accountNumber: '',
    ifsc: '',
    name: '',
    phone: '',
};

export const BANK_VERIFICATION_INFO_ROWS: Array<{
    label: string;
    key: keyof VerifiedBankData;
}> = [
    { label: 'Account Number', key: 'accountNumber' },
    { label: 'Bank Name', key: 'bankName' },
    { label: 'IFSC Code', key: 'ifsc' },
    { label: 'Account Holder Name', key: 'accountHolderName' },
    { label: 'Phone Number', key: 'phone' },
];
