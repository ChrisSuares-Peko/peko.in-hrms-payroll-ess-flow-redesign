export type salaryTableData = {
    employeeId: string;
    fullName: string;
    department: string;
    designation: string;
    profileImage: string;
    basicSalary: number;
    homeAllowance: number | null;
    travelAllowance: number;
    otherAllowance: number;
    startTime: string;
    endTime: string;
    dateOfJoin: string;
    attendance: number;
    totalAllowance: number;
    totalPay: number;
    year: number;
    month: number;
    salaryStatus: string;
    emailId: string;
    totalIncentive: number;
    totalBonus: number;
    totalOvertime: number;
    totalPayable: number;
    totalOtherDeduction: number;
    schedule: string;
    other: number;
    medicalAllowance: number;
    isEmployeeDeleted: boolean;
};
interface SalaryInfo {
    corporateUser: string;
    employee: string;
    year: number;
    month: number;
    salaryCycleStart: string;
    salaryCycleEnd: string;
    salaryCycleDays: number;
    leaveCount: number;
    leaveDeduction: number;
    attendancePercentage: number;
    totalIncentive: number;
    totalBonus: number;
    totalOvertime: number;
    totalPayable: number;
    totalOtherDeduction: number;
    salaryInformation: {
        basicPay: number;
        travelAllowances: number;
        homeAllowances: number;
        medicalAllowances: number;
        otherAllowances: number;
        other: number;
    };
    workSchedule: {
        days: {
            monday: boolean;
            tuesday: boolean;
            wednesday: boolean;
            thursday: boolean;
            friday: boolean;
            saturday: boolean;
            sunday: boolean;
        };
        startTime: string;
        endTime: string;
        breakTimeHrs: number;
        overTime: string;
    };
    gratuityContribution: number;
    reimbursements: any[]; // You might want to define a type for reimbursements if it follows a specific structure
    totalReimbursement: number;

    status: boolean;
    paySlipEmailSent: boolean;
    message: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    id: string;
    totalAllowance: number;
}

interface EmployeeDetails {
    _id: string;
    corporateUser: string;
    fullName: string;
    profileImage: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    personalEmail: string;
    personalAddress: string;
    employeeInformation: {
        dateOfJoin: string;
        employeeId: string;
        designation: string;
        department: {
            departmentName: string;
            id: string;
        };
        workLocation: string;
        status: string;
        schedule: string;
    };
    salaryInformation: {
        basicPay: number;
        travelAllowances: number;
        homeAllowances: number;
        medicalAllowances: number;
        otherAllowances: number;
        other: number;
    };
    employeeDocuments: any[]; // Define a type for employee documents if needed
    bankDetails: {
        accountName: string;
        accountNumber: string;
        bankName: string;
        bankBranch: string;
        ibanNumber: string;
        accountType: string | null;
    };
    createdAt: string;
    updatedAt: string;
    __v: number;
    workSchedule: {
        days: {
            monday: boolean;
            tuesday: boolean;
            wednesday: boolean;
            thursday: boolean;
            friday: boolean;
            saturday: boolean;
            sunday: boolean;
        };
        startTime: string;
        endTime: string;
        breakTimeHrs: number;
        overTime: string;
        workHrs?: number; // Optional property
    };
    emergencyNo: string;
    isEmployeeDeleted: boolean;
}

interface LeaveSummary {
    leaveCount: number;
    leaveType: string;
}

export type SalaryProfileResponse = {
    salaryInfo: SalaryInfo;
    employee: EmployeeDetails;
    leaveSummary: LeaveSummary[];
};
export type payrollTableType = {
    payrun: string;
    payrunMode: string;
    status: string;
    totalPaid: number;
    action: any;
    slipId: string;
};
interface SalaryData {
    corporateUser: string;
    employee: string;
    year: number;
    month: number;
    salaryCycleStart: string;
    salaryCycleEnd: string;
    salaryCycleDays: number;
    leaveCount: number;
    leaveDeduction: number;
    attendancePercentage: number;
    salaryInformation: {
        basicPay: number;
        travelAllowances: number;
        homeAllowances: number | null;
        medicalAllowances: number;
        otherAllowances: number;
        other: number | null;
    };
    workSchedule: {
        days: {
            monday: boolean;
            tuesday: boolean;
            wednesday: boolean;
            thursday: boolean;
            friday: boolean;
            saturday: boolean;
            sunday: boolean;
        };
        startTime: string;
        endTime: string;
        breakTimeHrs: number;
        overTime: string;
    };
    gratuityContribution: number;
    reimbursements: any[];
    totalReimbursement: number;
    totalPayable: number;
    status: boolean;
    paySlipEmailSent: boolean;
    message: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
    id: string;
}
export type payrollSlipListingResponse = {
    count: number;
    rows: SalaryData[];
    totalEmailed: number;
};
// download payroll slip
export type downloadSlipPayload = {
    userType: string;
    userId: number;
    salaryId: string;
};
export type downloadSlipResponse = {
    pdfData: {
        type: 'Buffer';
        data: [];
    };
};
// email payroll slip
export type emailSlipPayload = {
    userType: string;
    userId: number;
    salaryId: string;
};
export type emailSlipResponse = {
    data: boolean;
};
type employeePayload = {
    userType: string;
    userId: number;
};
export type SalaryProfilePayload = employeePayload & {
    employeeId: string | undefined;
};
export type payrollSlipListingPayload = {
    userId: number;
    userType: string;
    eId: string | undefined;
    page: number;
    limit: number;
    year: number;
};
export type salaryTableRow = {
    basicSalary?: number;
    totalAllowance?: number;
    totalOvertime?: number;
    totalIncentive?: number;
    totalBonus?: number;
    totalOtherDeduction?: number;
    totalPayable?: number;
};

export type getSalaryApprovalPayload = {
    userId?: number;
    userType?: string;
    month: number;
    year: number;
};
