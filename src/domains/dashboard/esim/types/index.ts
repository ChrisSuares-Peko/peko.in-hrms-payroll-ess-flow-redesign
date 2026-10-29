export type PostData = {
    amount: number;
    packageId: string;
    quantity?: number | null;
    plan: string;
    iccid?: string;
    operatorImage?: string;
    operatorName: string;
    isRechargable?: boolean;
    topupType?: string;
    countries?: any[];
    packageType?: string;
    region?: string | null;
};

export type PurchasingForType = 'self' | 'employee' | 'other';

export type PurchasingFor = {
    type: PurchasingForType;
    name: string;
    email: string;
    employeeId?: string;
};

export type PayrollEmployee = {
    id: string;
    personalInformation: { fullName: string; email: string };
    employeeInformation: { employeeId: string };
};

export type MultiOrderPayload = {
    orders: {
        country: string;
        countryCode?: string;
        data: number;
        validity: number | string;
        quantity: number;
        iccid?: string;
        customerUid?: string;
    }[];
    purchasingFor?: PurchasingFor;
};

export type TopUpFormData = {
    iccid?: string;
    orders: {
        quantity?: number | null;
        country: string;
        data: number | string;
        validity: string | number;
    }[];
};

export type InnerPlan = {
    country: string;
    dataMBs: string | number;
    periodDays: string | number;
    planId: string;
    provider: string;
    name: string;
    amount: number;
    totalAmount: number;
    quantity: number;
};

export type PlanData = {
    planId: string;
    amount: number;
    name: string;
    subtotalAmount: number;
    totalQuantity: number;
    plans: InnerPlan[];
};

export interface PlanDetailsState {
    planId: string;
    country: string;
    dataMBs: string;
    periodDays: string;
    unitPrice: number;
    quantity: number;
    name: string;
}
