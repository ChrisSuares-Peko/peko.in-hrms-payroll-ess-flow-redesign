

type InitialStateDataType = {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    email: string;
    country: string;
    state: string | null;
    addressLine1: string;
    addressLine2: string;
    pinCode: string;
    emergencyContactNumber: string | null;
    emergencyContactName: string | null;
    emergencyContactRelation: string | null;
    employeeId: string;
    department: string;
    workingHours: number;
    dateOfJoin: string;
    designation: string;
    workEmailId: string;
    workingDays: string;
    contractType: string;
    reportingStaff: string | null;
    timeSchedule: string;
    employeeStatus: string;
    probationPeriod: string | null;
    pan?: string | null;
    taxRegime?: string | null;
    uan?: string | null;
    esiNumber?: string | null;
    workState?: string | null;
    annualCTC?: number | string | null;
    accountHolderName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    ifscCode?: string | null;
    validated: boolean;
    errors: string[];
    corporateUser?: string;
};

export type OffBoardRequestFormType = {
    lastWorkingDay: string;
    noticePeriod: string;
    offBoardingType: string;
    reasonForOffBoarding: string;
    resignationLetter: string;

    offBoardingDate: string;
};

export type ValidationResponse = {
    // data: {
    //     jsonData: InitialStateDataType[];
    // };
    status: boolean;
    responseCode: string;
    message: string;
    data: {
        jsonData: InitialStateDataType[];
    };
};

export type ApproveSalary = {
    userType?: string;
    userId?: number;
    payingDate: string;
};

export type ApproveSalaryResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data: {};
};

export type validateEmployeeInformationPayload = {
    userId?: number;
    userType?: string;
    personalEmail?: string;
    mobileNo?: string;
    employeeId?: string;
    dateOfJoin?: string;
};

export type getEmployeeDocsPayload = {
    userId?: number;
    userType?: string;
    employeeId: string;
    page: number;
    limit: number;
    search?: string;
};
export type getEmployeeAssetPayload = {
    userId?: number;
    userType?: string;
    employeeId: string;
    assetType:string;
    assetStatus:string;
    searchText:string;
    page: number;
    limit: number;
};

export type EmployeeDocument = {
    name: string;
    url: string;
    _doc?: { url: string };
    expiryDate: string;
    _id: string;
    employeeId?: string;
};

export type FetchDocumentsByEmployeeIdResponse = {
    status: boolean;
    message: string;
    data: EmployeeDocument[];
    responseCode: string;
};

export type ValidationLimitSubscriptionResponse = {
    status: boolean;
    responseCode?: string;
    message?: string;
    data?: any;
};