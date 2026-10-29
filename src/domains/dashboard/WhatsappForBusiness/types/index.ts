export interface PackagePrices {
    monthly: number;
    annually: number;
}

export enum PlanType {
    Monthly = 'monthly',
    Annually = 'annually',
}

export enum PlanMode {
    Basic = 'WhatsApp Basic',
    Pro = 'WhatsApp Pro',
}

export type SsoResponse = {
    redirectLink: string;
    token: string;
};

export interface PreviousSubscription {
    billingType: 'MONTHLY' | 'ANNUALLY';
    status: 'EXPIRED';
    packageId: number;
    packageName: string;
}

export type WhatsappDetailsResponse = {
    isPurchased: boolean;
    previousSubscription: null | PreviousSubscription;
};
