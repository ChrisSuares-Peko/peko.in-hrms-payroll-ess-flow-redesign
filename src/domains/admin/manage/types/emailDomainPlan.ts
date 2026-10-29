export type EmailDomainPlans = {
    id?: number;
    name: string;
    softwareSubscriptionId: number;
    image_url: string | null;
    status: boolean;
    monthlyPrice: number;
    yearlyPrice: number;
    features: [];
    descriptions: string;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType?: 'PERCENTAGE' | 'FLAT';
    commission?: number;
    fixedCommissionPerTransaction?: number;
    isCommissionInclGST?: boolean;
    monthlyTotalCommission?: number;
    yearlyTotalCommission?: number;
};

export type EmailDomainPlansData = {
    count: number;
    rows: EmailDomainPlans[];
};

export type featureDetails = {
    id: string;
    label: string;
    value: string;
};

export type descriptionDetails = {
    id: string;
    label: string;
    value: string;
};

type ProductResponse = {
    id: number;
    name: string;
};

export type ProductApiResponse = {
    data: ProductResponse[];
};

export type DropDown = {
    value: number | string;
    label: string;
}[];

export type EmailDomainPlansPayload = {
    id?: number;
    name: string;
    type: string;
    offersText: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: [{}];
    descriptions: string;
    status: boolean;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType?: 'PERCENTAGE' | 'FLAT';
    commission?: number;
    fixedCommissionPerTransaction?: number;
    isCommissionInclGST?: boolean;
};

export type getEmailDomainPlan = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
    sortField?: string;
};

export type updateEmailDomainPlanStatusPayload = {
    status: boolean;
    id: string | number;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
