export type getAllFilter = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
    sortField?: string;
};
export type responseData = {
    recordsTotal: number;
    data: Product[];
};
export type Product = {
    id: number;
    brand: string;
    name: string;
    description: string;
    highlights: string;
    SKUCode: string;
    productImage: string;
    price: string;
    vendorPrice: string;
    GST: string;
    gstType: string;
    quantity: number;
    warranty: string;
    status: number;
    discountType: string;
    discount: string;
    actualPrice: string;
    vendors: vendorDetails[];
    features: any;
    createdAt: string;
    updatedAt: string;
    categoryId: number;
    productImage1: string;
    productImage2: string;
    productImage3: string;
    category: {
        id: number;
        categoryName: string;
    };
};
export type NewProduct = {
    id?: number;
    name: string;
    brand: string;
    description: string;
    highlights: string;
    quantity: string;
    price: number;
    SKUCode: string;
    GST: string;
    gstType: string;
    vendorPrice: number;
    categoryId: string;
    categoryName: string;
    warranty: string;
    vendors: vendorDetails[];
    discountType: string;
    discount: string;
    actualPrice: number;
    productImageFormat1: string;
    productImage1: string;
    productImage2: string;
    productImage3: string;
    productImageFormat2: string;
    productImageFormat3: string;
};
export type vendorDetails = {
    id: string;
    name: string;
    price: string;
};
export type activeResponse = {
    data: string;
};
export type updateStatus = {
    prodId: string | number;
    status: any;
};
export type Vendor = {
    id: number;
    vendorName: string;
};

export type Category = {
    id: number;
    categoryName: string;
    categoryImage: string;
    categoryStatus: boolean;
    createdAt: string;
    updatedAt: string;
    vendorId: number;
    vendor: Vendor;
};

export type CategoryData = {
    categoryData: Category[];
};

export type VenderData = {
    result: Vendor[];
};

export type search = {
    searchCategories?: string;
    searchVendors?: string;
};
export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

export type ProductImage = {
    id: number;
    productImageUrl: string;
    imageField: string;
    createdAt: string;
    updatedAt: string;
    productId: number;
};

export type modalImage = {
    productImage1: string;
    productImage2: string;
    productImage3: string;
};

export type productImageResp = {
    data: ProductImage[];
};

export type ProductBulkExcelTemplatePayload = {
    userId?: number;
    userType?: string;
};
export type ProductBulkExcelTemplateResponse = {
    productsTemplateUrl: string;
};

export interface bulkProduct {
    TID: number;
    name: string;
    brand: string;
    categoryName: string;
    description: string;
    highlights: string;
    warranty: string;
    SKUCode: string;
    actualPrice: number;
    quantity: number;
    discountType: string;
    discount: number;
    gstType: string;
    GST: number;
    vendorName: string;
    vendorPrice: number;
    productImage1?: string;
    productImage2?: string;
    productImage3?: string;
    status?: boolean;
    errors?: string[];
    price?: number;
}

export interface BulkProductsUploadResponse {
    productsJsonData: bulkProduct[];
    productsCreated: Boolean;
}

export interface BulkProductsUploadPayload {
    userId?: number;
    userType?: string;
    file?: any;
    uploadType?: string;
    productsJsonData?: bulkProduct[];
}

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
