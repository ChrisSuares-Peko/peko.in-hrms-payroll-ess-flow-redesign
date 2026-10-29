export type BillerPaymentChannelInfo = {
    paymentChannelName?: string;
    minAmount?: string;
    maxAmount?: string;
};

export type SuccessGenericResponse<T> = {
    status: boolean;
    message: string;
    responseCode: string;
    data: T;
};

export type ErrorGenericResponse = {
    status: boolean;
    message: string;
    responseCode: string;
    data: {};
};

export interface UserPayload {
    userId: number;
    userType: string;
}

export type DropDown = {
    label: string;
    value: string;
    network?: number;
    provider?: string;
}[];

export interface summaryTexts {
    key: string;
    value: string | number;
    isInput?: boolean;
    // Muted secondary line under the label.
    subText?: string;
}

export type SurchargeResponse = {
    surcharge: string;
    corporateCashback: string;
    ccf1Amount?: string | null;
};

export enum SortDirection {
    ASC = 'ASC',
    DESC = 'DESC',
}
export type ProductTour = {
    dashboard: boolean;
    payroll: boolean;
};
export type UserInfoResponse = {
    balance: string;
    credentialId: number;
    role: string;
    companyName: string;
    roleName: string;
    username?: string;
    logo: string;
    productTour: ProductTour;
    gstVerified: boolean | number | string;
    panVerified: boolean | number | string;
    contactPersonName: string;
    email: string;
    mobileNo: string;
    chatId: string;
    partnerId?: string;
    subCorporateCredential?: number;
    subCorporateEmail?: string;
    subCorporateMobile?: string;
    isPekoCreditActive?: boolean;
    isPekoCreditAvailable?: boolean;
    pekoCredits?: string;
    accountType?: 'freelancer' | 'corporate';
    isTopPlan?: boolean;
    activeGroupPackageName?: string | null;
    isWalletPaymentAvailable?: boolean;
};

export type notificationListResponse = {
    data: notification[];
    count: number;
};

export type notification = {
    id: number;
    notificationTitle: string;
    notificationBrief: string;
    notificationCategory: string;
    notificationTo: string;
    notificationBy: string;
    scheduleDate: string | null;
    flag: boolean;
    createdAt: string;
    updatedAt: string;
};
export interface ServicesListResponse {
    data: {
        serviceCategory: string;
        hasAccess: boolean;
        services: Service[];
        label: string;
        subServices: {
            label: string;
            hasAccess: boolean;
            icon?: string;
            enableMoreService?: boolean;
        }[];
        alias?: string; // optional display-name override for the service
        icon?: string; // service icon — pasted SVG markup (preferred) or a legacy URL
        enableMoreService?: boolean; // flat service shown under the "More Services" grouping
    }[];
    isAdmin?: boolean;
}

export interface Permission {
    services: Service[];
    hasAccess: boolean;
    serviceCategory: string;
    label: string;
    subServices: {
        label: string;
        hasAccess: boolean;
    }[];
}

export interface Service {
    service: string;
    serviceCategory: string;
    hasAccess: boolean;
    label: string;
    services: SubService[];
    category?: string;
}

export interface SubService {
    label: string;
    serviceType: string;
    service: string;
    hasAccess: boolean;
    icon?: string;
}

export enum UserRole {
    CORPORATE = 'corporate',
    SYSTEM = 'system_user',
    // ESS employees log in with backend role USER; /user/login returns
    // `role: role.toLowerCase()`, so the frontend sees 'user'.
    EMPLOYEE = 'user',
}

export enum RoleName {
    ADMIN = 'admin',
    CORPORATE = 'corporate',
    ECOM = 'ecom_manager',
}

export enum BBPSCategoryName {
    postpaid = 'Mobile Postpaid',
    test = 'Mobile',
    broadband = 'Broadband Postpaid',
    education = 'Education Fees',
    electricity = 'Electricity',
    landline = 'Landline Postpaid',
    lpg = 'LPG Gas',
    pipedGas = 'Gas',
    water = 'Water',
    creditCard = 'Credit Card',
    cable = 'Cable TV',
    dth = 'DTH',
    fastag = 'Fastag',
    loanRepayment = 'Loan Repayment',
    municipalTaxes = 'Municipal Taxes',
    municipalServices = 'Municipal Services',
    recurringDeposite = 'Recurring Deposit',
    rental = 'Rental',
    donations = 'Donation',
    Insurance = 'Insurance',
    lifeInsurance = 'Life Insurance',
    bikeInsurance = 'Bike Insurance',
    carInsurance = 'Car Insurance',
    clubs = 'Clubs and Associations',
    hospital = 'Hospital and Pathology',
    housingSociety = 'Housing Society',
    subscription = 'Subscription',
    ncmc = 'NCMC',
    nps = 'NPS',
    prepaidMeter = 'Prepaid Meter',
    challan = 'Traffic Challan',
}

export type commonSelectType = {
    oName: string;
    oValue: any;
};

export interface PurchasedListResponse {
    userAccessibleServices: string[];
    packageName?: string;
}

export type CommonFileBuffer = {
    pdfBuffer: any;
    buffer: any;
    fileType: string;
};

export enum DownloadType {
    Excel = 'excel',
    Csv = 'csv',
    Pdf = 'pdf',
}

export enum PekoPackages {
    Basic = 'Basic',
    Standard = 'Standard',
    Premium = 'Premium',
}

export type SubscriptionAddOnResponse = {
    unitPrice: number;
    maxLimit: number;
    freeBaseLimit: number;
    addonLimit: number;
    packageId: number;
    isDynamicUnitPricing: boolean;
    isAddonPurchaseAllowed?: boolean;
};

export interface SubscriptionHistory {
    id?: number;
    subscriptionStartDate: string;
    subscriptionEndDate: string;
    subscriptionAmountPaid: number;
    status: string;
    billingType: string;
    maxLimit: number;
    isCancelled?: boolean;
    isGracePeriod?: boolean;
    subscriptionIds?: number[];
    vendorSubscriptionId?: string | null;
    package: {
        id?: number;
        packageName: string;
    };
}

export interface subscriptionHistoryResponse {
    currentSubscription: SubscriptionHistory;
    addOns: (SubscriptionHistory & { isCustom: number }) | null;
    cancelledAddOns?: (SubscriptionHistory & { isCustom: number }) | null;
    isGroupSubscription: boolean;
}

export interface subscriptionCodeResponse {
    activationCode: ActivationCode;
}

export type ActivationCode = {
    billingType: string;
    packageId: number;
    package: {
        packageName: string;
        packagePrices: PackagePrices;
        discount: PackagePrices;
        packageType: string;
    };
};

interface PackagePrices {
    monthly: number;
    annually: number;
}
export type ActivateCodeResponse = {
    subscription: {
        subscriptionStartDate: string;
        subscriptionEndDate: string;
        billingType: string;
        packageName: string;
    };
};

export type createChatDataPayload = {
    userId?: number;
    userType?: string;
    body: string;
    id: number;
};

export type ticketChatPayload = {
    userType: string;
    userId: number;
    id: number;
};
export type Sender = {
    userId: string;
    displayName: string | undefined;
};
export type LastMessage = {
    id: string;
    content: {
        message: string;
        attachments: any[];
    };
    createdOn: string;
    type: string;
    metadata: {
        type: string;
    };
};
export type Chat = {
    threadId: string;
    topic: string;
    sender: Sender;
    lastMessage: LastMessage | null;
    unreadCount: number;
};

export type ChatProfile = {
    id: string;
    acs_user_id: string;
    logo: string;
    name: string;
    image: string;
    credential: {
        username: number;
    };
};

export type ChatState = {
    chats: Chat[];
    profiles: ChatProfile[];
    isLoading: boolean;
    error: any;
    unreadChats: number;
    status: 'idle' | 'call';
    notification: any;
    notifications: any[];
    acsUserId: string;
    page: string;
    mode: string;
    pendingRequests: number;
};
