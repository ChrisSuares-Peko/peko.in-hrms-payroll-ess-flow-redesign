export type createDeductionComponentPayload = {
    eId?: string;
    userId: number;
    userType: string;
    deductionName: string;
    deductionType: string;
    calculationType: string;
    amount: number | string;
    calculationBasis: string;
    status: string;
};

type DeductionComponent = {
    corporateUser: string;
    employee: string | null; // Employee-specific or null for global
    deductionName: string;
    deductionType: string;
    calculationType: 'FIXED' | 'PERCENTAGE'; // Add other types if applicable
    amount: number;
    calculationBasis: 'MONTHLY' | 'ANNUAL'; // Add other options if needed
    status: 'ACTIVE' | 'INACTIVE'; // Define status options
    applicabilityCriteria: string | null;
    isGlobal: boolean;
    globalComponentId: string | null;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    id: string;
};

export type CreateDeductionComponentResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data: DeductionComponent;
};

export type updateDeductionComponentPayload = {
    deductionName: string;
    deductionType: string;
    calculationType: string;
    amount?: string;
    percentage?: string;
    calculationBasis: string;
    status: string;
    id: string;
    employeeId?: string;
};

export type CreateBankDetailsPayload = {
    employeeId: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    isDefaultAccount?: boolean;
};

export type UpdateBankDetailsPayload = {
    bankId: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    isDefaultAccount?: boolean;
};
