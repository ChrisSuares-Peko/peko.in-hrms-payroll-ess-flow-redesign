export type categoryCard = {
    icon: string;
    category: string;
    size: number;
    loading?: boolean;
};

export interface filterOption {
    value: string;
    label: string;
}

export type getBussinesDocsCategory = {
    userId: number;
    userType: string;
};
export type bussinesDocsCategoryListing = {
    userId: number;
    userType: string;
    searchKey: string;
    category: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortType: string;
};

export interface ICategory {
    id: number;
    categoryName: string;
    categoryImage: string;
    documentCount: number;
}

export type ICategoryResponse = {
    categoryDataWithCounts: ICategory[];
};

type ICategoryListing = {
    id: number;
    documentName: string;
    description: string;
    documentUrl: string;
};

export type ICategoryListingResponse = {
    documents: ICategoryListing[];
    totalCount: number;
};

export type ICategoryListingCard = {
    title: string;
    documentUrl: string;
};
