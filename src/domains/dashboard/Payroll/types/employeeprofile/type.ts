import type { EmploymentStage } from '../types';

type EmployeeDocument = {
    name: string;
    url: string;
    expiryDate: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
};

type SalaryComponent = {
    component: string;
    type: string;
    _id: string;
};

type PersonalInformation = {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    email: string;
    country: string;
    state: string;
    pinCode: string;
    emergencyContactNo: string;
    emergencyContactName: string;
    emergencyContactRelation: string;
    addressLine1: string;
    addressLine2: string;
    passportNo?: string;
    passportIssuedCountry?: string;
    passportIssuedDate?: string;
    passportExpiryDate?: string;
};

type EmployeeInformation = {
    dateOfJoin: string;
    employeeId: string;
    department: {
        _id: string;
        departmentName: string;
    };
    designation: string;
    reportingStaff: string;
    reportingStaffName: string;
    workingDays: number;
    timeSchedule: string;
    workingHours: number;
    contractType: string;
    taxRegime?: string;
    employeeStatus: string;
    probationPeriod: number;
    employeeGrade: string;
    workEmail: string;
    workEmailId: string;
};

type OtherConfigurations = {
    enableEPF: boolean;
    epfUAN: string;
    enableESI: boolean;
    esiNumber: string;
    professionalTax: boolean;
    laborWelfareFund: boolean;
    tds: boolean;
};

type BankDetails = {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
};

type offBoardingInformation = {
    lastWorkingDay: string;
    resignationLetter: string;
    noticePeriod: number;
    offBoardingType: string;
    reasonForOffBoarding: string;
};

export type EmployeeProfile = {
    id: string;
    corporateUser: string;
    profileImage: string;
    personalInformation: PersonalInformation;
    isCompleted: boolean;
    salaryComponents: SalaryComponent[];
    employeeDocuments: EmployeeDocument[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    employeeInformation: EmployeeInformation;
    otherConfigurations: OtherConfigurations;
    offBoardingInformation: offBoardingInformation;
    /** Set by the API: NOTICE_PERIOD through the last working day, PAST after it. */
    offBoardingStage?: 'NOTICE_PERIOD' | 'PAST' | null;
    employmentStage?: EmploymentStage;
    /** Each Extend probation from the profile, oldest first. */
    probationExtensions?: {
        months: number;
        reason: string;
        previousEndDate: string;
        newEndDate: string;
        extendedAt: string;
        extendedBy?: string;
    }[];
    bankDetails: BankDetails;
    panNumber?:string;
    panVerified?: boolean;
    aadhaarNumber?:string;
    aadhaarVerified?: boolean;
    isEss?: boolean;
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

export type getEmployeeLeavePolicyPayload = {
    employeeId: string | undefined;
    userId: number;
    userType: string;
    page: number;
    limit: number;
    searchText: string;
};
export type getFullEmployeeLeavePolicyPayload = {
    employeeId: string | undefined;
    userId: number;
    userType: string;

    searchText: string;
};

export type getBankDetailsPayload = {
    eId: string | undefined;
    userId: number;
    userType: string;
};

export type UpdateDeductionComponentPyaload = {
    eId: string | undefined;
    compId?: string;
    userId: number;
    userType: string;
    page: number;
    limit: number;
    year: number;
    month: number | string;
};

export type DeductionComponent = {
    deductionName: string;
    deductionType: string;
    calculationType: string;
    amount: number | string; // Depending on how you're handling amounts (number or string)
    calculationBasis: string;
    status: string;
};

export interface CreateEmployeeLeaveComponentPayload {
    leaveType: string;
    accrualType: string;
    accrualRate: string;
    maximumAccrual: string;
    leaveBalanceCarryover: string;
    leaveApprovalRequired: string;
    maximumNumberOfLeaves: number;
    employeeId: string;
}

export type getEmployeeSalaryCompPayload = {
    employeeId: string | undefined;
    userId: number;
    userType: string;
    page: number;
    limit: number;
};
