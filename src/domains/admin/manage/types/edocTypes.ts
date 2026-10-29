export type Document = {
    id: number;
    documentName: string;
    description: string;
    documentUrl: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    categoryId: number;
    category: {
        id: number;
        categoryName: string;
    };
};

export type DocumentData = {
    recordsTotal: number;
    data: Document[];
};

export type getEDocs = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
    sortField?: string;
};

export type updateStatus = {
    docId: string | number;
    status: any;
};
export type activeResponse = {
    data: string;
};

export type Category = {
    id: number;
    categoryName: string;
    categoryImage: string;
    categoryStatus: boolean;
    createdAt: string;
    updatedAt: string;
    vendorId: number;
    vendor: {
        id: number;
        vendorName: string;
    };
};

export type CategoryData = {
    categoryData: Category[];
};

export type DocumentUpdateRequest = {
    id?: number;
    categoryId: string;
    categoryName: string;
    documentName: string;
    description: string;
    documentFormat?: string; // Optional if document is updating
    documentBase?: string; // Optional if document is updating
    status?: boolean;
};

export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
