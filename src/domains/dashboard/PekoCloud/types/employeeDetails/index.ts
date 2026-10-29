export interface EmployeeDetailsInfoCardProps {
    icon: string;
    title: string;
    value: number | undefined | string;
    bgColor: string;
    isCurrency: boolean;
}
export interface subscriptionProps {
    subscriptions: Subscription[];
}
export interface deviceProps {
    devices: AssetAndFleet[];
}
export type AssetAndFleet = {
    id: number;
    vehicleName: string;
    vehicleType: string;
    vehicleNumber: string;
    purchasedDate: string;
    dateOfRenewal: string;
    amount: string;
    cloudEmployeeId: number;
    assetName?: string;
};

type SubscriptionAssignTo = {
    id: number;
    employeeName: string;
};

export type Subscription = {
    id: number;
    subscriptionName: string;
    planDetails: string;
    billingCycle: string;
    billingStartDate: string;
    numberOfDevices: number;
    amount: number;
    assignTo: SubscriptionAssignTo[];
    status: string | null;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
};

export type Employee = {
    id: number;
    employeeName: string;
    employeeID: string;
    employeeEmail: string;
    department: string;
    joiningDate: string;
    profilePicture: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    assetsAndFleet: AssetAndFleet[];
    subscriptions: Subscription[];
    totalSpent: number;
};
export interface EmployeeListingResponse {
    result: Employee[];
    totalData: number;
}
export interface EmployeesinfoResponse {
    totalEmployees: number;
    assetsUsers: number;
    subscriptionUsers: number;
    totalAmountSpent: number | string;
}
export interface GetEmployeesResponse {
    employeesData: {
        id: number;
        employeeName: string;
        employeeID: string;
        employeeEmail: string;
        department: string;
    }[];
}
export interface userPayload {
    userType: string;
    userId: number;
}
export interface EmployeeListingPayload extends userPayload {
    page?: number;
    limit?: number;
    searchText?: string;
}
export interface EmployeeCreatePayload extends userPayload {
    employeeName: string;
    employeeID: string;
    employeeEmail: string;
    department: string;
    joiningDate: string;
    profileImageBase: string;
    profileImageFormat: string;
}

interface EmployeeDetails {
    id: number;
    employeeName: string;
    employeeID: string;
    employeeEmail: string;
    department: string;
    joiningDate: string;
    updatedAt: string;
    createdAt: string;
}
export interface EmployeeCreateResponse {
    success: boolean;
    data: EmployeeDetails;
}
export interface EmployeeUpdatePayload extends userPayload {
    employeeId: string;
    employeeName: string;
    employeeID: string;
    employeeEmail: string;
    department: string;
    joiningDate: string;
    profileImageBase: string;
    profileImageFormat: string;
}
export interface employeeDeletePayload extends userPayload {
    employeeId: string;
}

export type employeeResponse = {
    employees: employeeTypes[];
};
export type employeeTypes = {
    fullName: string;
    value: string;
    label: string;
    personalEmail: string;
    id: string;
    employeeInformation: {
        employeeId: string;
    };
};
