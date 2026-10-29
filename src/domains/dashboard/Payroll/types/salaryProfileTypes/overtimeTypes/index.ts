// over time listing
export type overtimePayload = {
    userId: number;
    userType: string;
    eId: string | undefined;
    page: number;
    limit: number;
    year: number;
    month: number | string;
};
interface OverTimeData {
    corporateUser: string;
    employee: string;
    overTimeDate: string;
    totalWorkingHours: number;
    extraHours: number;
    overTimeAmount: number;
    overTimeRate: number;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    id: string;
    hourlyRate: number;
}

export type overtimeListingResponse = {
    totalCount: number;
    overTimeData: OverTimeData[];
};
export type overtimeTable = {
    dateAdded: string;
    salaryMonth: string;
    totalWorkingHours: number;
    overTimeRate: number;
    extraHours: number;
    overTimeAmount: number;
    status: string;
    action: any;
    id: string;
    hourlyRate: number;
    effectiveDate?: string;
};
export type createOvertimePayload = {
    employeeId: string | undefined;
    totalWorkingHours: number;
    overTimeDate: string;
    extraHours: number;
    overTimeAmount: number;
    overTimeRate: number;
};
export type updateOvertimePayload = createOvertimePayload & {
    overtimeId: string;
};
export type createOvertimeResponse = {
    corporateUser: string;
    employee: string;
    overTimeDate: string;
    totalWorkingHours: number;
    extraHours: number;
    overTimeAmount: number;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type overtimeAmountCalculatePayload = {
    userId: number;
    userType: string;
    eId: string | undefined;
    extraHours: number;
    overtimeRate: number;
};
export type overtimeAmountCalculateResponse = {
    overtimeAmount: number;
    totalWorkingHours: number;
    hourlyRate: number;
};

export type overtimeDeletePayload = {
    userId: number;
    userType: string;
    rId: string | undefined;
};
export type overtimeDeletedResponse = {
    corporateUser: string;
    employee: string;
    incentiveDate: string;
    monthlyTarget: string;
    achievedTarget: string;
    achievedSaleInPercent: string;
    amount: number;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    id: string;
};
