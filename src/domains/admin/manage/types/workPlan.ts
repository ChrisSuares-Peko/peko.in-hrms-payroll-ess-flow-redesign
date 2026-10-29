export type Vendor = {
    id: number;
    vendorName: string;
    type: string;
};

export type WorkPlanData = {
    id: number;
    name: string;
    description: string;
    price: string;
    billingCycle: string;
    features: string;
    status: number;
    popular: number;
    createdAt?: string;
    updatedAt?: string;
    workId: number;
    vendorId?: number;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType?: 'PERCENTAGE' | 'FLAT';
    commission?: number;
    fixedCommissionPerTransaction?: number;
    isCommissionInclGST?: boolean;
    totalCommission?: number;
    work?: {
        id: number;
        name: string;
        features: string;
        description: string;
        image: string;
        portfolioType: string;
        portfolio: string[];
        status: number;
        contactName: string;
        contactEmail: string;
        contactMobile: string;
        createdAt: string;
        updatedAt: string;
        vendorId: number;
    };
};

export type WorkPlanResponse = {
    count: number;
    rows: WorkPlanData[];
};

export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};
export type updateStatus = {
    planId: string | number;
    status: any;
};
export type activeResponse = {
    data: string;
};
export type getData = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
    sortField?: string;
    partnerId: any;
};
export type newWorkPlan = {
    id?: number;
    name: string;
    description: string;
    price: string;
    billingCycle: string;
    features: string;
    status?: number;
    popular: number;
    workId: number;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType?: 'PERCENTAGE' | 'FLAT';
    commission?: number;
    fixedCommissionPerTransaction?: number;
    isCommissionInclGST?: boolean;
};

export type getWorks = {
    id: number;
    name: string;
};

export type getAllWorksResponse = {
    result: getWorks[];
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
