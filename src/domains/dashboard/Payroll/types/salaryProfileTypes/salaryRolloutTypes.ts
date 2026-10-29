export interface SalaryRolloutEmployeeRow {
    id: string;
    fullName: string | null;
    email: string | null;
    employeeId: string | null;
    employeeStatus: string | null;
    salary: number | null;
    accountName: string | null;
    accountNumber: string | null;
    bankName: string | null;
    ifscCode: string | null;
    upiId: string | null;
    transactionType: 'NEFT' | 'UPI' | 'IMPS' | 'RTGS' | null;
    bankAccountStatus: 'Approved' | 'Pending Verification' | 'Missing Information';
    beneficiaryStatus: 'Added' | 'Pending' | 'Failed';
    remark: string | null;
    profileImage: string | null;
}

export interface SalaryRolloutListResponse {
    rows: SalaryRolloutEmployeeRow[];
    count: number;
}

export interface SalaryRolloutListPayload {
    userId: string;
    userType: string;
    page: number;
    limit: number;
    search?: string;
    status?: string;
}

export interface SalaryRolloutPastEmployeeRow {
    id: string;
    fullName: string | null;
    email: string | null;
    employeeId: string | null;
    dateOfJoin: string | null;
    offBoardingDate: string | null;
    fullAndFinalSettlement: number | null;
    remark: string | null;
}

export interface SalaryRolloutPastListResponse {
    rows: SalaryRolloutPastEmployeeRow[];
    count: number;
}

export interface SalaryBreakupPayload {
    userId: string;
    userType: string;
    employeeId: string;
}

export interface SalaryBreakupLineItem {
    componentName: string;
    calculatedAmount: number;
}

export interface SalaryBreakupData {
    month: number;
    year: number;
    grossSalary: number;
    totalDeductions: number;
    totalPayable: number;
    earnings: SalaryBreakupLineItem[];
    deductions: SalaryBreakupLineItem[];
}

export interface PendingVerificationRow {
    key: string;
    initials: string;
    avatarBg: string;
    name: string;
    profileImage: string | null;
    beneficiaryStatus: string;
    bankAccountStatus: string;
}

export interface PendingBeneficiaryEmployee {
    id: string;
    fullName: string | null;
    email: string | null;
    employeeStatus: string | null;
    bankAccountStatus: string;
    beneficiaryStatus: string;
    profileImage: string | null;
}

export interface PendingVerificationEmployee {
    id: string;
    fullName: string | null;
    email: string | null;
    employeeStatus: string | null;
    bankAccountStatus: string;
    beneficiaryStatus: string;
    profileImage: string | null;
}

export interface EligibleEmployee {
    id: string;
    fullName: string | null;
    email: string | null;
    employeeId: string;
    employeeStatus: string | null;
    salary: number;
    bankAccountStatus: string;
    beneficiaryStatus: string;
    accountNumber: string | null;
    accountName: string | null;
    bankName: string | null;
    ifscCode: string | null;
    transactionType: string | null;
    upiId: string | null;
}

export interface EligibleEmployeeResponse {
    count: number;
    rows: EligibleEmployee[];
}

export interface UpdateSalaryRolloutEmployeePayload {
    userId: string;
    userType: string;
    employeeId: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    transactionType: string;
    upiId: string;
    ifscCode: string;
    remark: string;
}
