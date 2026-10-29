export type Template = {
    id: number;
    type: string;
    subject: string | null;
    body: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    imageUrl?: string;
};

export type Data = {
    recordsTotal: number;
    data: Template[];
};

export type ApiResponse = {
    data: Data;
};

export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

export type newTemplate = {
    id: number;
    type: string;
    subject: string | null;
    body: string;
    status: number;
};

export type getData = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
    sortField?: string;
};

export type activeResponse = {
    data: string;
};

export type updateStatus = {
    templateId?: string | number;
    status: any;
};

export type formInputs = {
    id: string;
    type: string;
    subject: string;
    body: string;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
