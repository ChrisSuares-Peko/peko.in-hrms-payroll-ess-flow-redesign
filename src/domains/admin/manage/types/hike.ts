export type getHike = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
    sortField?: string;
    partnerId?: string;
};
type Hike = {
    id: number;
    name: string;
    features: string;
    logo: string;
    partners: string;
    planType: string;
    amount: string;
    salaryAmount: string;
    salaryValidation: string;
    commissionMode: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType: string;
    commission: string;
    fixedCommissionPerTransaction: string;
    isCommissionInclGST: boolean;
    totalCommission?: number;
    status: boolean;
    createdAt: string;
    updatedAt: string;
};

export type HikeData = {
    count: number;
    rows: Hike[];
};

export type newHike = {
    name: string;
    features: string;
    logoBase: string;
    logoFormat: string;
    partnersBase: string;
    partnersFormat: string;
    planType: 'MONTHLY' | 'YEARLY';
    amount: number;
    salaryAmount: number;
    salaryValidation: 'LESS_THAN' | 'GREATER_THAN';
    commissionMode: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType: 'PERCENTAGE' | 'FLAT';
    commission: number;
    fixedCommissionPerTransaction?: number;
    isCommissionInclGST?: boolean;
};

export type HikePayload = {
    id?: number;
    name: string;
    features: string;
    logoBase: string;
    logoFormat: string;
    partnersBase: string;
    partnersFormat: string;
    planType: 'MONTHLY' | 'YEARLY';
    amount: number;
    salaryAmount: number;
    salaryValidation: 'LESS_THAN' | 'GREATER_THAN';
    commissionMode: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType: 'PERCENTAGE' | 'FLAT';
    commission: number;
    fixedCommissionPerTransaction?: number;
    isCommissionInclGST?: boolean;
    imageFormat?: string;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};

export type getReportPayload = {
    searchText: string;
    sort: string;
    sortField: string;
    type: string;
    partnerId?: string;
};
