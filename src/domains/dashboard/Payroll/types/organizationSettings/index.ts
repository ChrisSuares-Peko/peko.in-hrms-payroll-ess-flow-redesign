export interface existingOrganizationSettings {
    companyProfile: {
        companyName: string;
        companyAddressLine1: string;
        companyAddressLine2: string;
        city: string;
        pinCode: string;
        state: string;
        contactNumber: string;
        emailAddress: string;
        industry: string;
        companyLogo: string;
    };
    organizationTaxDetails: {
        PAN: string;
        TAN: string;
        TDSCode: string;
        taxPaymentFrequency: string;
    };
    payrollSettings: {
        selectWorkingDays: string[];
        calculateSalaryBasedOn: string;
        payrollFrom: string;
        payEmployeeOn: string;
    };
    bankDetails: {
        bankName: string;
        accountNumber: string;
        accountHolderName: string;
        ifscCode: string;
        branchAddress: string;
    };
}

export interface CompanyProfileType {
    companyName: string;
    state: string;
    contactNumber: string;
    emailAddress: string;
    industry: string;
    companyLogo?: string;
    companyLogoFormat?: string;
    PAN: string;
    TAN: string;
    TDSCode: string;
    taxPaymentFrequency: string;
}
export interface GetCompanyProfileType {
    companyProfile: {
        companyName: string;
        companyAddressLine1: string;
        companyAddressLine2: string;
        city: string;
        state: string;
        pinCode: string;
        contactNumber: string;
        emailAddress: string;
        industry: string;
        companyLogo?: string;
        companyLogoFormat?: string;
    };
    organizationTaxDetails: {
        PAN: string;
        TAN: string;
        TDSCode: string;
        taxPaymentFrequency: string;
    };
}
export interface PayrollSettingsType {
    selectWorkingDays: string[];
    calculateSalaryBasedOn: string;
    payrollFrom: string;
    payEmployeeOn: number | undefined;
}
export interface GetPayrollSettingsType {
    payrollSettings: {
        selectWorkingDays: string[];
        calculateSalaryBasedOn: string;
        payrollFrom: string;
        payEmployeeOn: string;
    };
}
export interface BankDetailsType {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    ifscCode: string;
    branchAddress: string;
}
export interface GetBankDetailsType {
    bankDetails: {
        bankName: string;
        accountNumber: string;
        accountHolderName: string;
        ifscCode: string;
        branchAddress: string;
    };
}
export interface CompanyUserData {
    companyName: string;
    userEmail: string;
    userState: string;
    mobileNo: string;
}
export type BankListResponse = {
    bankDetails: BankDetail[];
};
export type BankDetail = {
    id: number;
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string | null;
    status: number;
    default: number;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    bankBranch?: string;
};
type ComponentData = {
    corporateUser: string;
    employee: string | null;
    componentName: string;
    category: string;
    calculationType: string;
    calculationBasis?: 'COMPONENT' | 'BASIC_SALARY' | 'GROSS_SALARY' | 'CTC';
    amountPercentage: number;
    calculationFrequency: string;
    calculationBasedOn: string;
    status: string;
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
};

export type SalaryComponentListResponse = {
    totalCount: number;
    componentData: ComponentData[];
};
type SalaryComponent = {
    corporateUser: string;
    componentName: string;
    category: 'SALARY' | 'BONUS' | 'ALLOWANCE';
    calculationType: 'FIXED' | 'PERCENTAGE' | 'BALANCING';
    calculationBasis?: 'COMPONENT' | 'BASIC_SALARY' | 'GROSS_SALARY' | 'CTC';
    amountPercentage: any;
    calculationBasedOn: string;
    status: 'ACTIVE' | 'INACTIVE';
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
    _id: string;
    calculatedAmount?: number;
};

export type AllSalaryComponentListResponse = {
    componentData: SalaryComponent[];
    totalDeduction: string;
};

export type GetSalaryComponent = {
    eId?: string | undefined;
    page?: number;
    limit?: number;
    searchText?: string;
};
export type createSalaryComponentResponse = {
    corporateUser: string;
    employee: string | null;
    componentName: string;
    category: string;
    calculationType: string;
    amount: number;
    calculationBasis: string;
    status: string;
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type createSalaryComponentPayload = {
    componentName: string;
    calculationType: string;
    amount?: string;
    percentage?: string;
    status: string;
};
export type updateSalaryCompoentPayload = {
    componentName: string;
    calculationType: string;
    amount?: string;
    percentage?: string;
    status: string;
    id: string;
};
export type filterState = {
    searchText: string;
    sort?: string;
    page: number;
    filter?: string;
    year?: number;
    month?: string | number;
    limit: number;
};
export type GetDeductionComponent = {
    eId?: string | undefined;
    page: number;
    limit: number;
    searchText: string;
    // Deduction Components (Settings tab) intentionally hides "Provident Fund (PF)" — it's
    // driven by Compliance Settings > EPF, not configured here. CTC-preview consumers
    // (Dashboard Calculator, Add Employee, New Hire) reuse this same endpoint to seed
    // their starting structure and need PF included, or it silently disappears from the
    // preview even though it's still calculated correctly for real employees.
    includePf?: boolean;
};
export interface DeductionComponent {
    corporateUser: string;
    employee: string | null;
    deductionName: string;
    deductionType: string;
    calculationType: string;
    amountPercentage?: string;
    calculationBasis: string;
    status: string;
    applicabilityCriteria: string | null;
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
    salaryDeductionType: string;
}

// Response type for the API response that contains the list of deduction components
export interface DeductionComponentListResponse {
    totalCount: number;
    componentData: DeductionComponent[]; // Array of deduction components
}
export interface createDeductionComponentPayload {
    deductionName: string;
    deductionType: string;
    calculationType: string;
    amount?: string;
    percentage?: string;
    calculationBasis: string;
    status: string;
}
export interface createDeductionComponentResponse {
    corporateUser: string;
    employee: string | null;
    deductionName: string;
    deductionType: string;
    calculationType: string;
    amount?: string;
    percentage?: string;
    calculationBasis: string;
    status: string;
    applicabilityCriteria: string | null;
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
}

export interface updateDeductionComponentPayload {
    deductionName: string;
    deductionType: string;
    calculationType: string;
    amount?: string;
    percentage?: string;
    calculationBasis: string;
    status: string;
    id: string;
}
export type GetLeaveComponent = {
    eId?: string | undefined;
    page: number;
    limit: number;
    searchText: string;
};

export interface LeaveComponent {
    corporateUser: string;
    employee: string | null;
    leaveType: string;
    accrualType: string;
    accrualRate: string;
    maximumAccrual: string;
    leaveBalanceCarryover: string;
    maximumNumberOfLeaves: number;
    isGlobal: boolean;
    applicableGender?: string;
    createdAt: string;
    updatedAt: string;
    id: string;
}

export interface LeaveComponentListResponse {
    totalCount: number;
    leaveComponentData: LeaveComponent[]; // Array of LeaveComponent
}
export interface CreateLeaveComponentPayload {
    leaveType: string;
    accrualType: string;
    accrualRate: string;
    maximumAccrual: string;
    leaveBalanceCarryover: string;
    leaveApprovalRequired: string;
    maximumNumberOfLeaves: number;
    applicableGender?: string;
}
export interface createLeaveComponentResponse {
    corporateUser: string;
    employee: string | null;
    leaveType: string;
    accrualType: string;
    accrualRate: string;
    maximumAccrual: string;
    leaveBalanceCarryover: string;
    maximumNumberOfLeaves: number;
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
}
export interface UpdateLeaveComponentPayload {
    leaveType: string;
    accrualType: string;
    accrualRate: string;
    maximumAccrual?: string;
    leaveBalanceCarryover: string;
    leaveApprovalRequired: string;
    maximumNumberOfLeaves: number;
    id: string;
    employeeId: string;
    applicableGender?: string;
}
