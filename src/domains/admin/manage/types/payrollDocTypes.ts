export type Document = {
    id: number;
    documentName: string;
    documentId: string;
    document: string;
    documentUrl: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    categoryId: number;
    payrollCategory: {
        id: number;
        categoryName: string;
    };
};

export type DocumentData = {
    count: number;
    rows: Document[];
};

export type getPayrollDocs = {
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
    documentFormat?: string;
    documentBase64: string; // Optional if document is updating
    documentBase?: {
        base64: string;
        format: string;
    };
    status?: boolean;
};

export type CategoryUpdatePayload = {
    id: number;
    documentId: number;
    categoryName: string;
    documentName: string;
};
export type CategoryPostType = {
    categoryName: string;
    documentName: string;
};

export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

export type PayrollCategory = {
    id: string;
    categoryName: string;
    documents: document[];
};

export type document = {
    id: number;
    name: string;
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

export type PayrollCategoryData = {
    categoryDataWithDocuments: PayrollCategory[];
};

export type DropDown = {
    label: string;
    value: string;
}[];

export enum DownloadType {
    Excel = 'excel',
    Csv = 'csv',
    Pdf = 'pdf',
}
