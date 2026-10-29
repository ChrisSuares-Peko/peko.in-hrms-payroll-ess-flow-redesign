/** "Deduction for" — one-time recoveries from earned pay (backend utils/oneTimeDeductionTypes.js). */
export const ONE_TIME_DEDUCTION_TYPES = [
    'Salary advance recovery',
    'Loan instalment',
    'Overpayment adjustment',
    'Fine',
    'Damage or loss recovery',
    'Notice period recovery',
    'Court order',
    'Other',
] as const;
export type OneTimeDeductionType = (typeof ONE_TIME_DEDUCTION_TYPES)[number];

export type addDeductionPayload = {
    employeeId: string;
    userId: number;
    userType: string;
    deductionFor: string;
    note: string;
    /** Whole rupees, above zero. */
    amount: number;
    /** The salary month the deduction belongs to — the month selected on Salary Details. */
    month: number;
    year: number;
};
export type getDeductionPayload = {
    eId: string | undefined;
    userId: number;
    userType: string;
    page: number;
    limit: number;
    year: number;
    month: number | string;
};
export type updateDeductionPayload = {
    id: string;
    employeeId: string;
    userId: number;
    userType: string;
    deductionFor: string;
    note: string;
    amount: number;
};
export type singleDeductionPayload = {
    eId?: string;
    userId: number;
    userType: string;
    deductionId: string;
};
export type getDeductionResponse = {
    totalCount: number;
    deductions: deductionList[];
};
type deductionList = {
    corporateUser: string;
    employee: string;
    deductionDate: string;
    deductionType: string;
    deductionAmount: number;
    deductionStatus: string;
    deductionFor?: string;
    note?: string;
    createdAt: string; // ISO 8601 formatted date string
    updatedAt: string; // ISO 8601 formatted date string
    id: string;
    description?: string;
};

export type deductionTableType = {
    employeeId: string;
    employeeName: string;
    deductionDate: string;
    deductionType: string;
    deductionAmount: number;
    deductionStatus: string;
    id: string;
    description?: string;
    deductionFor?: string;
    note?: string;
};
export interface DeductionFormType {
    employeeId: string;
    deductionFor: string;
    note: string;
    amount: string | number;
}
export type DeductionEditFormType = Omit<DeductionFormType, 'employeeId'>;
export type deduction = {
    deductionDate: string;
    deductionType: string;
    deductionAmount: number;
    deductionStatus: string;
    employeeId: string;
};
