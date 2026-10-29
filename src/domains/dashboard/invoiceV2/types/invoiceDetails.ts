export interface InfoRow {
    label: string;
    value?: string;
    isBadge?: boolean;
}


export type DomesticPaymentKey = 'payment-link' | 'upi' | 'bank' | 'enach';
export type InternationalPaymentKey = 'virtual-iban' | 'currency-account';
export type CollectPaymentKey = DomesticPaymentKey | InternationalPaymentKey;

export interface PaymentMethod {
    key: CollectPaymentKey;
    label: string;
    iconBg: string;
    icon: string;
    disabled?: boolean;
}

export type SendUPICollectFormValues = {
    amount: string;
    upiId: string;
    requestExpiry: string | null;
};

export interface UPICollectPendingData {
    amount: string;
    upiId: string;
    expiryMinutes: number;
}

export interface UPICollectSuccessData {
    amount: string;
    referenceId: string;
    dateTime: string;
}

export type UPICollectStep = 'form' | 'pending' | 'success' | 'failed';

export type ENACHFrequency = 'monthly' | 'quarterly';

export interface ENACHMandateFormValues {
    customer: {
        name: string;
        email: string;
        mobile: string;
    };
    mandate: {
        maxAmount: string;
        frequency: ENACHFrequency;
        startDate: string | null;
        endDate: string | null;
        untilCancelled: boolean;
    };
    purpose: {
        description: string;
    };
}

export interface VirtualAccountDetails {
    companyName?: string;
    invoiceNo?: string;
    accountName?: string;
    bankName?: string;
    iban?: string;
    swiftCode?: string;
    accountNumber?: string;
    currency?: string;
    routingNumber?: string;
    bankAddress?: string;
}
