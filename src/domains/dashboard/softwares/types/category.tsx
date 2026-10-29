export interface IsoftwareCategory {
    weburl: string;
    name: string;
    title: string;
    icon: string;
}
export interface ISoftwareCategoryListResponse {
    categoryList: IsoftwareCategory[];
}

export interface IRfpCategory {
    name: string;
    weburl: string;
}
export interface IRfpCategoryListResponse {
    categories: IRfpCategory[];
    generalQuestionsSlug: string;
}

export interface ICategoryProductRequestPayload {
    userId: number;
    userType: string;
    parentCategory: string;
    page: number;
    limit: number;
    filter?: string;
    sortBy?: string;
    search?: string;
}
