export interface PackagePrices {
    monthly: string;
    annually: string;
}

export enum PlanType {
    Monthly = 'monthly',
    Annually = 'annually',
}

export enum SubscriptionType {
    Current = 'CURRENT',
    Upgrade = 'UPGRADE',
    Downgrade = 'DOWNGRADE',
}

interface Discount {
    monthly: number;
    annually: number;
}

export interface PackageService {
    serviceOperatorId: number;
    serviceName: string;
    accessKey: string;
    unitPrice: number;
    baseLimit: number;
    isDynamicUnitPricing: boolean;
    surcharge?: number;
    surchargeType?: string;
}

export interface ServicePackage {
    id: number;
    packageName: string;
    packagePrices: PackagePrices;
    description: string;
    serviceList: string;
    discount: Discount;
    services: PackageService[];
    priorityLevel: number;
    packageLogo: string;
}

export interface WhatsAppPlan {
    id: number;
    packageName: string;
    packagePrices: PackagePrices;
    description: string;
    discount: {
        monthly: string;
        annually: string;
    };
    priorityLevel: number;
}

// Individual à-la-carte plan, surfaced at the top level of list-packages (like whatsappPlans).
export interface IndividualPlan {
    id: number;
    packageName: string;
    packagePrices: PackagePrices;
    description: string;
    discount: {
        monthly: string;
        annually: string;
    };
    accessCode: string;
    packageLogo: string;
    serviceList: string;
    priorityLevel: number;
    /** True when the user already holds this individual package (active) — blocks re-purchase. */
    isOwned?: boolean;
}

export interface PackagesData {
    packages: ServicePackage[];
    currentPackageId: number;
    currentPlanPriorityLevel: number;
    /** Billing cycle of the active paid plan; null for free/basic users. */
    currentBillingType?: 'MONTHLY' | 'ANNUALLY' | null;
    /** Active plan is cancelled (ending at period end) — suppresses the annual-upgrade CTA. */
    currentPlanIsCancelled?: boolean;
    whatsappPlans?: WhatsAppPlan[];
    individualPlans?: IndividualPlan[];
}

export interface PackageDetails {
    id: number;
    packageName: string;
    packagePrices: PackagePrices;
    description: string;
    serviceList: string;
    discount: Discount;
    packageType?: 'INDIVIDUAL' | 'GROUP';
    priorityLevel?: number;
    individualPackages?: Record<string, number>;
    services?: PackageService[];
}

interface DiscountDetails {
    price: number;
    message?: string;
    reason?: string;
    breakdown?: {
        subscriptionId?: number;
        packageId: number;
        isAddon: boolean;
        billingType: string;
        subscriptionEndDate: string;
        remainingDiscount: number;
        reason: string;
    }[];
}

// Static package config — served by users service /subscription/package-details.
export interface PackageDetailsApiResponse {
    packageDetails: PackageDetails;
}

// Dynamic pricing — served by paymentGateway /payment-gateway/cashfree-gateway/subscription-pricing.
export interface SubscriptionPricingResponse {
    packagePrice: number;
    packageDiscount: number;
    additionalDiscount: number;
    couponDiscount: number;
    totalDiscount: number;
    annualAddonPrice: number;
    monthlyAddonPrice: number;
    taxableAmount?: number;
    taxAmount?: number;
    taxRate?: number;
    expectedPaymentAmount: number;
    breakdown: DiscountDetails;
}

// Merged shape consumed by components (same as before the split).
export interface PackageDetailsResponse {
    packageDetails: PackageDetails;
    discount: DiscountDetails;
    annualAddonPrice: number;
    monthlyAddonPrice: number;
    expectedPaymentAmount?: number;
    taxableAmount?: number;
    taxAmount?: number;
    taxRate?: number;
    couponDiscount?: number;
}

// Add-on quote — served by paymentGateway /payment-gateway/cashfree-gateway/addon-pricing.
export interface AddonPricingResponse {
    taxableAmount: number;
    taxAmount: number;
    taxRate: number;
    expectedPaymentAmount: number;
    unitPrice: number;
    quantity: number;
}

export interface AddressFormValues {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    flatNO: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
}

export interface PaymentRequestPayload {
    amount: number;
    packageId: number;
    billingType: string;
    accessKey?: string;
    pgAmount?: number;
    successUrl: string;
    failureUrl: string;
    currentUrl: string;
    billingAddress?: AddressFormValues;
    couponCode?: string;
    isMandate?: boolean;
    // One-time (non-auto-renew) purchase — annual plans only. Routes to a plain /pg/orders
    // payment instead of a recurring Cashfree mandate; the plan lapses at its end date.
    isOneTime?: boolean;
    // Addon data embedded in mandate creation — backend webhook uses these to create the addon row
    addonQuantity?: number;
    addonsAccessKey?: string;
    addonPackageId?: number;
    isDynamicUnitPricing?: boolean;
}

export interface AddOnPaymentRequestPayload {
    isAddOns: boolean;
    pgAmount: number;
    addonsAccessKey: string;
    packageId: number;
    quantity: number;
    accessKey: string;
    successUrl: string;
    failureUrl: string;
    currentUrl: string;
    isDynamicUnitPricing?: boolean;
}

export interface userPayload {
    userType: string;
    userId: number;
}

export type PaymentResponse = {
    corporateFinalBalance: string;
    corporateCashback: string;
    orderId: number;
    datetime: string;
    amount: number;
    corporateTxnId: number;
};

export type PaytmCreateOrderResponse = {
    amount: string;
    orderId: number;
    session_id: string;
};

export type DynamicNumberObject = {
    [key: string]: number;
};

export interface TableData {
    groupPackages: DynamicNumberObject;
    individualPackages: DynamicNumberObject;
    groupPackageDiscounts: DynamicNumberObject;
}

export type TableDataPackages = {
    tableData: TableData;
};

export type SelectedType = 'monthly' | 'annually';

export type DiscountResult = {
    discountedAmount: number;
    discountPercentage: number;
};

export type MaxDiscountResult = {
    maxMonthlyDiscountPercentage: number;
    maxAnnualDiscountPercentage: number;
};

export type UsePaymentApiProps = {
    setCheckoutJsInstance: React.Dispatch<React.SetStateAction<any>>;
    checkoutJsInstance: any;
};

export type PaymentGeneric = {
    accessKey?: string;
    successUrl?: string;
    failureUrl?: string;
    amount?: number | string;
    total?: number;
    [key: string]: number | string | Object | undefined | null;
};

export interface ApplyCouponPayload {
    amount: number;
    couponCode: string;
    packageId?: number;
    accessKey?: string;
    billingType?: string;
}

export type ApplyCouponResponse = {
    originalAmount: string;
    discountAmount: number;
    finalAmount: number;
};

export enum SubscriptionPaymentMode {
    voucherCode = 'VOUCHER',
    card = 'CARD',
}

type SubscriptionPackage = {
    packageName: string;
    accessCode: string;
};

export type SubscriptionDetailsResponse = {
    billingType: string;
    subscriptionAmountPaid: string;
    subscriptionPrice: string;
    status: string;
    package: SubscriptionPackage;
};
