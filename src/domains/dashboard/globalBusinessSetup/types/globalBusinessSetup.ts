export interface OrderDetails {
    id: number;
    amountInINR: string;
    paymentMode: string;
    status: string;
    orderResponse: string; // This is the full parsed object type
    transactionDate: string;
    corporateTxnId: string;
}

export type transactionResponse = {
    totalData: number;
    result: OrderDetails[];
};

// src/types/pekoOrder.ts

export interface PlanFee {
    licenceFee: number;
    establishmentCard: number;
    visaFee: number;
}

export interface Plan {
    _id: string;
    name: string;
    description: string;
    activities: string[];
    shareHolderPricing: number;
    activitiesPricing: number;
    freeshareHolders: number;
    freeActivities: number;
    licenceType: string;
    logo: string;
    emirate: string;
    fee: PlanFee;
    featuresIncluded: string[];
    documentRequired: {
        passportCopy: boolean;
    };
    partner: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    totalShareHolders: number;
    totalVisa: number;
}

export interface PaymentMethod {
    expiry: string;
    cardholderName: string;
    name: string;
    cardType: string;
    cardCategory: string;
    issuingOrg: string;
    issuingCountry: string;
    pan: string;
}

export interface PaymentGatewayResponse {
    orderReferenceNo: string;
    paymentReferenceNo: string;
    captureReferenceNo: string;
    amount: {
        currencyCode: string;
        value: number;
    };
    paymentMethod: PaymentMethod;
}

export interface PekoOrderData {
    licence: Plan;
    totalAmount: string; // "970.00"
    totalCost: number; // 9700
    selectedActivities: string[];
    totalShareHolders: number;
    payCashback: boolean;
    accessKey: string;
    pgAmount: string; // "970.0000"
    successUrl: string;
    failureUrl: string;
    isSaveCardDetails: boolean;
    couponCode: string;
    paymentRefId: string;
    paymentGatewayResponse: PaymentGatewayResponse;
}

// The overall structure you provided:
export interface PekoOrderResponse {
    data: PekoOrderData;
}

export type getData = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    sortField?: string;
    from?: string;
    to?: string;
    id?: string | number;
    category?: string | number;
    type?: string;
    partnerId?: string | number;
};

export type CompanyDetails = {
    proposedCompanyName1: string;
    proposedCompanyName2: string;
    proposedCompanyName3: string;
    shortBusinessDescription: string;
};

export type Licence = {
    _id: string;
    name: string;
    heading?: string;
    description: string;
    activities: string[];
    licenceType: string;
    logo: string;
    emirate: string;
    fee: {
        FormationFee: string;
        visa: string;
    };
    featuresIncluded: string[];
    documentRequired: {
        emiratesId: boolean;
        passportCopy: boolean;
        tradeLicense: boolean;
        visaCopy: boolean;
    };
    partner: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
};

export type ShareHolderData = {
    typeOfOwner: string;
    country?: string;
    shareHolderFullName: string;
    nationality: string;
    ownershipPercentage: number;
    designation: string;
    passportNumber: string;
    passportCopy: string;
    passportSizePhotographs: string;
    visaCopies: string;
    noc: string;
    certificateOfIncorporation: string;
    memorandum: string;
    boardResolution: string;
    shareCertificate: string;
    goodStandingCertificate: string;
    tradeLicense: string;
    passportAuthorisedSignatory: string;
    proofOfAddressCompany: string;
};

export type UltimateBeneficialOwnerData = {
    name: string;
    dob: string;
    nationality: string;
    passportNumber: string;
    passportExpiryDate: string;
    dateOfBecomingUBO: string;
    uboDeclaration: string;
    passportCopy: string;
};

export type singleData = {
    _id: string;
    user: string;
    subuser: string;
    companyDetails?: CompanyDetails;
    licence: Licence;
    paymentStatus: string;
    applicationStatus: string;
    totalAmount: number;
    corporateTxnId: number;
    selectedActivities: string[];
    totalCost: number;
    totalShareHolders: number;
    totalVisa: number;
    shareHoldersDetails: ShareHolderData[];
    ultimateBeneficialOwner: UltimateBeneficialOwnerData[];
    createdAt: string;
    updatedAt: string;
    corrections?: string;
    __v: number;
};

export interface SetupDocSection {
    title: string;
    fields: SetupDoc[];
}

export interface SetupDoc {
    label: string;
    name: string;
    placeholder?: string;
    default_value?: any;
    description?: string;
    type: 'text' | 'email' | 'number' | 'date' | 'file';
    validation?: SetupDocValidation;
}

export interface SetupDocValidation {
    required?: boolean;
    min?: number;
    max?: number;
    regex?: string;
    min_length?: number;
    max_length?: number;
    max_file_size?: number;
    future_dates_only?: boolean;
    past_dates_only?: boolean;
}

export type CompanyTypeAttribute = {
    _id?: string;
    label: string;
    value: string;
};

export type CompanyType = {
    key: string;
    label: string;
    description?: string;
    icon?: string;
    freezones: Freezone[];
    _id: string;
    is_active?: boolean;
    allow_direct_apps?: boolean;
    attributes?: CompanyTypeAttribute[];
    required_documents_file?: string;
    required_documents_text?: string;
};

export type Freezone = {
    key: string;
    label: string;
    _id: string;
    is_active?: boolean;
    icon?: string;
    description?: string;
    attributes?: CompanyTypeAttribute[];
    required_documents_file?: string;
    required_documents_text?: string;
};
export type Country = {
    _id: string;
    name: string;
    code: string;
    country_code: string;
    timezone: string;
    currency: string;
    currency_symbol: string;
    exchange_rate: number;
    logo: string;
    is_active: boolean;
    company_types: CompanyType[];
    setup_docs?: SetupDocSection[];
    required_documents_file?: string;
    required_documents_text?: string;
    created_at?: string;
    updated_at?: string;
};

export type CountryDataValues = {
    country: string;
    type: string;
    freezone: string;
};

export interface Provider {
    _id: string;
    description: string;
    logo: string;
    title: string;
    charges: Record<string, any>;
    is_active: boolean;
    // Embedded scope from the vendor `/providers` response — used to fetch
    // per-provider pricing without re-deriving from the form selection.
    country?: { _id: string; name?: string };
    company_type?: string;
    freezone?: string;
}
