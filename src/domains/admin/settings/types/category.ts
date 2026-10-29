export type Vendor = {
    id: number;
    vendorName: string;
    type: string;
};

export type CategoryData = {
    id: number;
    categoryName: string;
    categoryImage: string;
    categoryStatus: number;
    createdAt: string;
    updatedAt: string;
    vendorId: number;
    vendor: Vendor;
};

export type CategoryResponse = {
    recordsTotal: number;
    data: CategoryData[];
};

export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};
export type updateStatus = {
    categoryId: string | number;
    categoryStatus: any;
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
};
export type newCategory = {
    id?: number;
    categoryName: string;
    categoryStatus: boolean;
    vendorId: string;
    categoryImage: string;
    categoryImageFormat: string;
};

export type getVendors = {
    id: number;
    vendorName: string;
};

export type getVendorsResponse = {
    data: getVendors[];
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
