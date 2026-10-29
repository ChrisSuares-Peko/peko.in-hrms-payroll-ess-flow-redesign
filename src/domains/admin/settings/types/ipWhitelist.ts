export type ipWhitelistResponse = {
    count: number;
    rows: any[];
};

export type activeResponse = {
    data: string;
};

export type updateStatus = {
    brandingId?: string | number;
    status: any;
};

export type categoryResponse = {
    data: categoryData[];
};
export type categoryData = {
    id: number | string;
    username: string;
    name: string;
};
export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
