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
export type CategoryListPayload = {
    userId: number;
    userType: string;
};

export type CategoryListResponse = {
    data: Category[];
};
