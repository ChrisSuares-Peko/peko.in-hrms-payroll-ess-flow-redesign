export interface PlanDetailsResponse {
    _id: string;
    defaultPlan: string;
    plans: {
        [key: string]: {
            name: string;
            duration: number;
            INR: number;
            USD: number;
        };
    };
}
export interface Project {
    type: 'project';
    id: string;
    name: string;
    business_id: string;
    partner_id: string;
    plan_activated_on: number | null;
    status: string;
    sandbox: boolean;
    credit: number;
    active_plan: string;
    created_at: number;
    updated_at: number;
    plan_renewal_on: number | null;
    scheduled_subscription_changes: string;
    wa_number: string;
    wa_messaging_tier: string;
    billing_currency: string;
    timezone: string;
    subscription_started_on: number | null;
    is_whatsapp_verified: boolean;
    subscription_status: string;
    daily_template_limit: number;
    remainingQuota: number;
    mau_usage?: number; // Optional property as it only appears in some projects
}

export interface projectPayload {
    userId: number;
    userType: string;
    projectName: string;
}
export interface projectPayloadWithId {
    userId: number;
    userType: string;
    id: string | number;
}
// export interface projectPayloadWithIds {
//     userId: number;
//     userType: string;
// }
export interface orderPayload {
    userId: number;
    userType: string;
    searchText: string;
    pageSize: number;
    page: number;
}
// export interface updateWccPayload {
//     userId: number;
//     userType: string;
//     id: string;
//     amount: number;
//     action: string;
// }
// export type ProjectBillingResponse = {
//     projectId: string;
//     success: boolean;
//     message: string;
// };

export interface ISubscriptionDetailsPayload {
    accessKey?: string;
    packageName?: string;
}
export interface GenerateURLResponse {
    embeddedSignupURL: string;
}

interface PackagePrice {
    monthly: number;
    annually: number;
}

interface Discount {
    monthly: number;
    annually: number;
}
export interface PackageDetails {
    id: number;
    packageName: string;
    packagePrices: PackagePrice;
    description: string;
    discount: Discount;
    priorityLevel: number;
    isPurchased?: boolean;
    purchasedBillingType?: 'MONTHLY' | 'ANNUALLY' | null;
}

interface Package {
    description: string;
    id: number;
    packageName: string;
    packageType: string;
    priorityLevel: number;
}

interface ActiveSubscriptions {
    id: number;
    billingType: string;
    status: string;
    package: Package;
    projectId: string;
    billingPlan: string;
    subscriptionAmountPaid: string;
    subscriptionEndDate: string;
    subscriptionStartDate: string;
    isCancelled: boolean;
    isCustom?: boolean;
    addOnType?: 'BOT_BUILDER' | 'SHOPIFY_INTEGRATION' | null;
    // Null for Peko+ bundled WhatsApp Basic (free perk — no payment ref).
    subscriptionPaymentRefId?: string | null;
}

export interface ActiveSubscriptionSummary {
    id: number;
    billingPlan: 'BASIC' | 'PRO' | string;
    billingType: 'MONTHLY' | 'ANNUALLY' | string;
    packageName: string | null;
    subscriptionEndDate: string | null;
}

export interface SubscriptionDetailsResponse {
    packageDetails: PackageDetails[];
    discountPrice: number | null;
    activeSubscription?: ActiveSubscriptionSummary | null;
}
export interface ActiveSubscriptionResponse {
    activeSubscriptions: ActiveSubscriptions;
}

export type businessProfile = {
    businessId: string;
    projectId?: null | string;
};

export interface botBuilderAmount {
    amount: number;
    yearlyAmount: number;
}

export interface shopifyIntegrationAmount {
    amount: number;
    yearlyAmount: number;
}

export type downloadInvoicePayload = {
    userId: number;
    userType: string;
    transactionID: string;
    type: 'invoice' | 'receipt';
};

export type downloadResponse = {
    pdfBuffer: {
        type: string;
        data: [];
    };
};
