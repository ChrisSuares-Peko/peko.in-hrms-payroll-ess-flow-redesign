export interface workData {
    id: number;
    workTitle: string;
    workImg: string;
    workDescription: string;
}
export interface WorkDetail {
    id: number;
    workTitle: string;
    portfolioImages: string[];
    workDescription: string;
    plans: PlanType[];
}

export interface PlanType {
    title: string;
    amount: number;
    monthlyCost: string;
    features: string[];
    offer?: string;
}

export interface Works {
    id: number;
    name: string;
    features: string;
    description: string;
    image: string;
    portfolioType: 'TEXT' | 'IMAGE'; // Assuming it's either 'TEXT' or 'IMAGE'
    portfolio: string[]; // Assuming it's an array of strings
    status: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    vendorId: number;
    contactName: string;
    contactEmail: string;
    contactMobile: string;
}

export type ListingPayload = {
    userId: number;
    userType: string;
    page: number;
    itemsPerPage: number;
};

export type ListingResponse = {
    data: { rows: Works[]; count: number };
};

export type DetailsPayload = {
    userId: number;
    userType: string;
    workId: string | undefined;
};

export interface WorkPlan {
    id: number;
    name: string;
    description: string;
    price: string;
    billingCycle: string;
    features: string;
    status: boolean;
    popular?: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    workId: number;
    work: any;
}

export type PlansResponse = {
    data: WorkPlan[];
};

export type PlanDetailsPayload = {
    userId: number;
    userType: string;
    planId: string | undefined;
};

export type WorksFormData = {
    pocName: string | undefined;
    email: string | undefined;
    mobile: string | undefined;
    requirement: string | undefined;
    planId: string | undefined;
    workId: number | undefined;
    planName: string | undefined;
    price: string | undefined;
    workName: string;
};
