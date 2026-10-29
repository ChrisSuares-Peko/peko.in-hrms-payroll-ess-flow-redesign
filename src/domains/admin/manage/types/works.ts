export type WorkData = {
    id: number;
    name: string;
    features: string;
    description: string;
    image: string;
    portfolioType: string;
    portfolio: object[];
    status?: boolean;
    contactName: string;
    contactEmail: string;
    contactMobile: string;
    createdAt: string;
    updatedAt: string;
    vendorId: number;
    credentialId: string;
    credential: any;
};

export type WorkResponse = {
    count: number;
    rows: WorkData[];
};

export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};
export type updateStatus = {
    workId: string | number;
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
    partnerId?: string;
};
export type newWork = {
    id?: number;
    name: string;
    features: string;
    description: string;
    portfolioType?: string;
    portfolio: object[];
    status?: boolean;
    contactName: string;
    contactEmail: string;
    contactMobile: string;
    vendorId: number | string;
    imageBase?: string;
    imageFormat: string | null;
    workId?: number | undefined;
};

export type getVendors = {
    id: number;
    vendorName: string;
};

export type getVendorsResponse = {
    result: getVendors[];
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
