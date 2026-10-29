export type incrementAmountCalculatePayload = {
    userId: number;
    userType: string;
    eId: string | undefined;
    bonusPercentage?: string;
    bonusAmount?: string;
    type: string;
    basicSalary: any;
};
export type incrementAmountResponse = {
    incrementAmount: string;
    incrementPercentage: string;
    newBasicSalary: number;
};
export type incrementListingPayload = {
    userId: number;
    userType: string;
    eId: string | undefined;
    page: number;
    limit: number;
    year: number;
    month: number | string;
};
type IncrementRecord = {
    corporateUser: string;
    employee: string;
    basicSalary: number;
    amount: string;
    newBasicSalary: number;
    effectiveDate: string;
    attachment: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    id: string;
    incrementType: string;
};

export type incrementListingResponse = {
    totalCount: number;
    incrementData: IncrementRecord[];
};
export type incrementTable = {
    dateAdded: string;
    previousBasicSalary: number;
    incrementAmount: string;
    newBasicSalary: number;
    effectiveDate: string;
    incrementPercentage: string;
    status: string;
    document: string;
    action: any;
    id: string;
    url: string;
    employeeId: string;
    incrementType: string;
};
// delete increment
export type incrementDeletePayload = {
    userId: number;
    userType: string;
    rId: string | undefined;
};
export type IncrementDeleteResponse = {
    corporateUser: string;
    employee: string;
    basicSalary: number;
    incrementPercentage: number;
    incrementAmount: number;
    newBasicSalary: number;
    effectiveDate: string;
    attachment: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type createIncrementPayload = {
    userId: number;
    userType: string;
    employeeId: string | undefined;
    basicSalary: number;
    amount: number;
    newBasicSalary: number;
    effectiveDate: string;
    attachment: {
        base64: string;
        format: string;
    } | null;
};
export type createIncrementResponse = {
    corporateUser: string;
    employee: string;
    basicSalary: number;
    incrementPercentage: number;
    incrementAmount: number;
    newBasicSalary: number;
    effectiveDate: string;
    attachment: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type singleIncrementPayload = {
    userId: number;
    userType: string;
    incrementId?: string;
};
export type singleIncrementResponse = {
    corporateUser: string;
    employee: string;
    basicSalary: number;
    incrementPercentage: number;
    incrementAmount: number;
    newBasicSalary: number;
    effectiveDate: string;
    attachment: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type updateIncrementPayload = {
    userId?: number;
    employeeId: string;
    userType?: string;
    incrementId?: string | undefined;
    basicSalary?: number;
    incrementPercentage?: string;
    incrementAmount?: number;
    newBasicSalary?: number;
    effectiveDate?: string;
    incrementType?: string;
    attachment: attachment | null | string;
    attachmentFormat?: string;
};
type attachment = {
    base64: string;
    format: string;
};

export type incrementBasicSalaryType = {
    userId: number;
    userType: string;
    employeeId: string;
    year: number;
    month: number;
};
