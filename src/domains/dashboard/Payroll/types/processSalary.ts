export type ProcessSalaryEmployeesPayload = {
    userId: number;
    userType: string;
    month: number | string;
    year: number | string;
    page: number;
    limit: number;
    searchText?: string;
};

export type ProcessSalaryBankDetails = {
    id?: string;
    accountName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    ifscCode?: string | null;
    isDefaultAccount?: boolean;
    transactionType?: 'NEFT' | 'UPI' | 'IMPS' | 'RTGS' | null;
};

export type ProcessSalaryEmployeeRow = {
    salaryId: string;
    employeeId: string;
    employeeCode?: string | null;
    employeeName?: string | null;
    employeeEmail?: string | null;
    designation?: string | null;
    department?: string | null;
    monthlySalary: number;
    totalBonus: number;
    totalIncentive: number;
    totalOvertime: number;
    totalReimbursement: number;
    totalDeduction: number;
    totalPayable: number;
    bankDetails: ProcessSalaryBankDetails | null;
    isPayoutReady: boolean;
    payoutBlockReason?: string | null;
    salaryPaymentStatus?: string | null;
    latestPayoutStatus?: string | null;
    latestBatchReferenceId?: string | null;
};

export type ProcessSalaryEmployeesResponse = {
    count: number;
    page: number;
    limit: number;
    salaryCycle?: unknown;
    totalPayableSum?: number | string;
    rows: ProcessSalaryEmployeeRow[];
};

export type ProcessSalaryPayload = {
    userId: number;
    userType: string;
    month: number;
    year: number;
    salaryIds: string[];
    remarks?: string;
};

export type ProcessSalaryResultRow = {
    salaryId: string;
    employeeId: string;
    status: 'INITIATED' | 'SUCCESS' | 'SKIPPED' | 'FAILED';
    referenceId?: string;
    decentroTxnId?: string;
    message?: string;
};

export type ProcessSalaryResponse = {
    batchReferenceId: string;
    totalRequestedCount: number;
    initiatedCount: number;
    skippedCount: number;
    failedCount: number;
    successCount: number;
    totalRequestedAmount: number;
    totalInitiatedAmount: number;
    status: string;
    results: ProcessSalaryResultRow[];
};

export interface SalaryRecord {
    key: string;
    salaryId: string;
    employeeId: string;
    empId: string;
    name: string;
    email: string;
    initials: string;
    avatarBg: string;
    accountNumber: string;
    bankName: string;
    transactionType: 'NEFT' | 'UPI' | 'IMPS' | 'RTGS' | null;
    grossSalary: number;
    deduction: number;
    netSalary: number;
    remark: string;
    status: 'Paid' | 'Pending' | 'Failed';
    payoutBlockReason?: string | null;
    disabled?: boolean;
}
