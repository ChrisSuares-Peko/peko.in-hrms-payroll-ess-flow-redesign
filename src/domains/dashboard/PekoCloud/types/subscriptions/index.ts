export interface SubscriptionInfoCardProps {
    icon: string;
    title: string;
    value: number | undefined | string;
    bgColor: string;
}
export interface userPayload {
    userType: string;
    userId: number;
}
export interface SubscriptionListingPayload extends userPayload {
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
}
type Subscription = {
    currency: string;
    id: number;
    subscriptionName: string;
    planDetails: string;
    billingCycle: string;
    billingStartDate: string;
    numberOfDevices: number;
    amount: number;
    assignTo: {
        id: number;
        employeeName: string;
    }[];
    status: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
};
type Software = {
    id: number;
    name: string;
    image: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
};

export type SubscriptionListingResponse = {
    result: Subscription[];
    totalData: number;
};
export type SubscriptionInfoResponse = {
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalUsers: number;
    totalSpent: number | string;
};
export type SoftwareListingResponse = {
    result: Software[];
    totalData: number;
};
type EmployeeAssignment = {
    id: number;
    employeeName: string;
};
export interface SubscriptionCreatePayload extends userPayload {
    subscriptionName: string;
    planDetails: string;
    billingCycle: string;
    billingStartDate: string;
    numberOfDevices: number;
    amount: number;
    assignTo: EmployeeAssignment[];
}

type SubscriptionData = {
    id: number;
    subscriptionName: string;
    planDetails: string;
    billingCycle: string;
    billingStartDate: string;
    numberOfDevices: number;
    amount: number;
    assignTo: EmployeeAssignment[];
    credentialId: number;
    updatedAt: string;
    createdAt: string;
};
export interface SubscriptionCreateResponse {
    success: boolean;
    data: SubscriptionData;
}
export interface SubscriptionUpdatePayload extends userPayload {
    subscriptionName: string;
    planDetails: string;
    billingCycle: string;
    billingStartDate: string;
    numberOfDevices: number;
    amount: number;
    assignTo: EmployeeAssignment[];
    subscriptionId: number;
}
export interface SubscriptionDeletePayload extends userPayload {
    subscriptionId: string;
}

export interface SubscriptionAssignPayload extends userPayload {
    subscriptionName: string;
    employeeName: string;
    id: number;
}
