// Defines the structure of the role with permissions

export type brandingResponse = {
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
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
