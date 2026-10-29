export type ConnectBody = {
    id?: number;
    serviceProvider: string;
    tagline: string;
    address: string;
    category: string;
    description: string;
    offerings: string;
    email: string;
    website: string;
    mobileNo: string;
    rewards: string;
    logo: string;
    logoFormat?: string;
    status: boolean;
    services: string[] | null;
};

export type ConnectWithoutID = {
    id?: number;
    serviceProvider: string;
    tagline: string;
    address: string;
    category: string;
    description: string;
    offerings: string;
    email: string;
    website: string;
    mobileNo: string;
    rewards: string;
    logo: string;
    logoFormat?: string;
    status: boolean;
    services: string[] | null;
};

export type ApiResponseConnect = {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: ConnectBody[];
};

export type getConnect = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: 'ASC' | 'DESC';
    sortField?: string;
};

export type updateConnectStatusPayload = {
    status: boolean;
    connectId?: string | number;
};

export type ConnectID = Omit<updateConnectStatusPayload, 'status'>;

export type ConnectCategory = {
    value: string;
    label: string;
};

export type ApiResponseConnectCategory = {
    connectCategory: ConnectCategory[];
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
