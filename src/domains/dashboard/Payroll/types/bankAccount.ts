export interface SalaryRolloutBankAccount {
    _id: string;
    corporateUser: string;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: 'savings' | 'current';
    branch: string | null;
    currency: string;
    isPrimary: boolean;
    createdAt: string;
    updatedAt: string;
}

export type ManageBankAccountSource = 'PAYROLL_SETTINGS' | 'MANAGE_BANKS';

export interface ManageBankDisplayAccount extends SalaryRolloutBankAccount {
    accountSource: ManageBankAccountSource;
}

export interface SalaryRolloutBankPayload {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: 'savings' | 'current';
    branch?: string;
}

export interface BankTransaction {
    _id: string;
    description: string;
    dateTime: string;
    transactionId: string;
    paymentMethod: 'NEFT' | 'RTGS' | 'IMPS' | 'UPI';
    amount: number;
    type: 'credit' | 'debit';
    status: 'Success' | 'Inprogress' | 'Failed';
}

export interface VerifyBankAccountPayload {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    branch?: string;
    mobile?: string;
}

export interface BankAccountRecord {
    _id: string;
    corporateUser: string;
    accountHolderName: string | null;
    accountNumber: string | null;
    ifscCode: string | null;
    branch: string | null;
    mobile: string | null;
    nameAtBank: string | null;
    nameMatchScore: number | null;
    accountStatus: string | null;
    validationType: string | null;
    validationMessage: string | null;
    bankReferenceNumber: string | null;
    decentroTxnId: string | null;
    referenceId: string | null;
    responseKey: string | null;
    message: string | null;
    verifiedAt: string | null;
    providerResponse: unknown;
    createdAt: string;
    updatedAt: string;
}
