export type EmailDomainPayload = {
    userId: number;
    userType: string;
    searchText: string;
    page: number;
    itemsPerPage: number;
};

export type EmailDomainPlansPayload = {
    productId: number;
};

export type EmailDomainListResponse = {
    data: EmailDomain[];
    recordsTotal: number;
};

export type EmailDomainPlansResponse = {
    planDatas: EmailDomainPlans[];
    productData: EmailDomain;
};

export type EmailDomainPlans = {
    id: number;
    name: string;
    features: {
        label: string;
        value: string;
    }[];
    monthlyPrice: string;
    yearlyPrice: string;
    descriptions: {
        label: string;
        value: string;
    }[];
    image_url: string | null;
    softwaresSubscriptionId: number;
    status: boolean;
};

export type EmailDomain = {
    id: number;
    name: string;
    offersText: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
    image: string | null;
    peko_key: string;
};

export type EmailDomainTableData = {
    id: number;
    name: string;
    offersText: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
    image: string | null;
}[];

export type EmailDomainFormData = {
    companyName: string;
    currentEmailProvider?: string;
    numberOfUsers: number;
    name: string;
    domainName: string;
    emailId: string;
    alternativeEmailId?: string;
    mobileNumber: string;
    companyAddress?: string;
    emirates?: string;
    city?: string;
    zipcode?: string;
    selectedProductId?: number | null;
};
