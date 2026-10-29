export type bonusPayload = {
    userId: number;
    userType: string;
    eId: string | undefined;
    page: number;
    limit: number;
    year: number;
    month: number | string;
};
export type bonusListingResponse = {
    totalCount: number;
    bonusData: BonusData[];
};
type BonusData = {
    corporateUser: string;
    employee: string;
    bonusDate: string;
    bonusPercentage: number;
    bonusAmount: number;
    type: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type BonusTableRow = {
    id: string;
    bonusDate: string;
    bonusPercentage: number;
    bonusAmount: number;
    type: string;
    paymentStatus: string;
    action: any;
    employeeId: string;
    employeeName: string;
};
export type bonusTable = {
    dateAdded: string;
    effectiveMonth: string;

    bonusAmount: number;

    action: any;
    id: string;
    employeeId: string;
    effectiveDate?: string;
};
export type bonusAmountCalculatePayload = {
    userId: number;
    userType: string;
    eId: string | undefined;
    bonusPercentage?: string;
    bonusAmount?: string;
    type: string;
};
export type bonusAmountResponse = {
    bonusAmount: string;
    bonusPercentage: string;
};
export type createBonusPayload = {
    userId: number;
    userType: string;
    employeeId: string | undefined;
    bonusDate: string;
    bonusPercentage?: string;
    bonusAmount: string;
    type: string;
};
export type createBonusResponse = {
    corporateUser: string;
    employee: string;
    bonusDate: string;
    bonusPercentage: number;
    bonusAmount: number;
    type: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type singleBonusPayload = {
    userId: number;
    userType: string;
    bonusId?: string;
};
export type singleBonusResponse = {
    corporateUser: string;
    employee: string;
    bonusDate: string;
    bonusPercentage: number;
    bonusAmount: number;
    type: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type updateBonusPayload = {
    userId?: number;
    userType?: string;
    bId?: string | undefined;
    bonusDate?: string;
    bonusPercentage?: string;
    bonusAmount?: string;
    type?: string;
};
export type bonusDeletePayload = {
    userId: number;
    userType: string;
    rId: string | undefined;
};
export type bonusDeleteResponse = {
    corporateUser: string;
    employee: string;
    bonusDate: Date;
    bonusPercentage: number;
    bonusAmount: number;
    type: string;
    paymentStatus: string;
    createdAt: Date;
    updatedAt: Date;
    id: string;
};
