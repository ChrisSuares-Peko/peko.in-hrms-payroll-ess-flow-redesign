export type SalaryDetailsRow = {
    key: string;
    componentName: string;
    category: string;
    amount: number;
};

export type SalaryDetailsTotals = {
    totalEarnings: number;
    totalDeductions: number;
    netSalary: number;
};

export type employeeSalaryListingPayload = {
    userId: number;
    userType: string;
    year: string | number;
    month: string | number;
    searchText: string;
    sort: string;
    page: number;
    limit: number;
    filter: string;
};
export type employeePayrollHistory = {
    userId: number;
    userType: string;
    year: string | number;
    page: number;
    limit: number;
    id: string;
};

export type SalaryProfileLineItem = {
    componentName: string;
    badge?: string;
    amount: number;
    /** Present on one-time recoveries (Add Deduction) — lets the row be edited or deleted. */
    oneTimeDeduction?: {
        deductionId: string | null;
        deductionFor: string;
        note: string;
        /** The deduction as entered; `amount` above is what this month recovered. */
        fullAmount: number;
        /** Balance moving to next month because of the 50% limit. */
        carriedForward: number;
        /** Recovered this month for an earlier month's deduction. */
        isCarriedIn: boolean;
    };
};

export type SalaryProfileEmployerContribution = {
    label: string;
    badge?: string;
    amount: number;
};

export type SalaryProfileLwf = {
    amount: number;
    fires: boolean | null;
    scheduleLabel: string | null;
    workState: string | null;
    nextFireMonth: number | null;
    nextFireYear: number | null;
};

export type SalaryProfileTaxSlab = {
    from: number;
    to: number | null;
    rate: number;
    taxableAmount: number;
    tax: number;
};

export type SalaryProfileTdsDetails = {
    employeeName: string;
    employeeEmail: string;
    taxRegime: string;
    tdsFrequency: string;
    dateOfJoin: string | null;
    fy: string;
    monthlySalary: number;
    grossThisMonth: number;
    standardDeduction: number;
    exemptions: number;
    grossAnnual: number;
    taxableIncome: number;
    slabBreakdown: SalaryProfileTaxSlab[];
    taxBeforeRebate: number;
    rebate: number;
    marginalRelief: number;
    rebateLimit: number;
    totalRebate: number;
    surcharge: number;
    surchargeRate: number;
    surchargeThreshold: number;
    surchargeBeforeRelief: number;
    cess: number;
    totalTax: number;
    tdsMonthly: number;
};

export type SalaryDetailsResponse = {
    status: boolean;
    salaryRows: {
        componentName: string;
        category: string;
        amount: number;
    }[];
    totals: {
        totalEarnings: number;
        totalDeductions: number;
        netSalary: number;
    };
    salaryStatus?: string;
    monthlyGrossSalary?: number | null;
    monthlyCTC?: number | null;
    annualCTC?: number | null;
    earnings?: SalaryProfileLineItem[];
    deductions?: SalaryProfileLineItem[];
    employerContributions?: SalaryProfileEmployerContribution[];
    lwf?: SalaryProfileLwf | null;
    netSalary?: number;
    tdsDetails?: SalaryProfileTdsDetails | null;
    tdsEdit?: SalaryProfileTdsEdit;
    lossOfPay?: SalaryProfileLossOfPay | null;
};

/** Loss of Pay applied to the month — earnings above are already reduced by it. */
export type SalaryProfileLossOfPay = {
    days: number;
    amount: number;
    isAmountOverridden: boolean;
    grossBeforeLop: number;
};

// Old Tax Regime employees only: HR enters the monthly TDS (computed outside the
// platform). `allowed` is false for New Tax Regime employees and for approved/paid months;
// `effectiveFrom` is the month the amount in force was entered from, if any, and
// `applyToFutureMonths` whether that entry carries forward (false = that month only).
export type SalaryProfileTdsEdit = {
    allowed: boolean;
    effectiveFrom: { month: number; year: number } | null;
    applyToFutureMonths: boolean | null;
};

export type TdsOverrideInfo = {
    isOldRegime: boolean;
    amount: number | null;
    effectiveFrom: { month: number; year: number } | null;
    applyToFutureMonths: boolean | null;
};

export type TdsOverridePayload = {
    userId: number;
    userType: string;
    employeeId: string;
    month: number;
    year: number;
    amount: number;
    applyToFutureMonths: boolean;
};

export type PayrollHistoryResponse = {
    status: boolean;
    salaryRows: {
        createdDate: string;
        month: number;
        year: number;
        processedOn: string | null;
        totalEmployees: number;
        totalAmount: number;
        salaryStatus: string;
    }[];
};



export type payrollHistory = {
    userId: number;
    userType: string;
    year: string | number;
};

export type payrollHistoryExcelPayload = {
    userId: number;
    userType: string;
    year: string | number;
};

export type payrollHistoryExcelData = {
    buffer: {
        type: 'Buffer';
        data: number[];
    };
    fileType: string;
};

export type payrollHistoryExcelResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data?: payrollHistoryExcelData;
};

export type employeeSalaryDetails = {
    userId: number;
    userType: string;
    year: string | number;
    month:string | number;
    id: string;
};

export type SalaryItem = SalaryDetailsRow & {
    amount: string;
};

export type SalaryProfileTabProps = {
    salaryRows: SalaryDetailsRow[];
    totals: SalaryDetailsTotals;
    tableLoading?: boolean;
    month?: number;
    year?: number;
    status?: string;
    monthlyGrossSalary?: number | null;
    monthlyCTC?: number | null;
    annualCTC?: number | null;
    earnings?: SalaryProfileLineItem[];
    deductions?: SalaryProfileLineItem[];
    employerContributions?: SalaryProfileEmployerContribution[];
    lwf?: SalaryProfileLwf | null;
    netSalary?: number;
    tdsDetails?: SalaryProfileTdsDetails | null;
    tdsEdit?: SalaryProfileTdsEdit | null;
    onSaveTds?: (amount: number, applyToFutureMonths: boolean) => Promise<boolean>;
    lossOfPay?: SalaryProfileLossOfPay | null;
    notRecorded?: boolean;
    /** Employee whose profile this is — needed to edit/delete one-time deductions. */
    employeeId?: string;
    /** Re-fetches the profile after a one-time deduction is edited or deleted. */
    onDeductionsChanged?: () => void;
    onMonthChange?: (month: number) => void;
    onYearChange?: (year: number) => void;
};
export type approveSalaryPayload = {
    payingDate: string;
    month:number;
    year:number;
    sendPayslip:boolean;
    userType:string;
    userId:number;
};

export type employeeSalaryListingResponse = {
    count: number;
    salaryCycle: SalaryCycle;
    totalPayableSum: number;
    rows: employeeDetails[];
};
export type SalaryCycle = {
    SalaryCycleStart: string;
    SalaryCycleEnd: string;
    SalaryCycleDays: number;
    salaryCycleStart: string;
    salaryCycleEnd: string;
    salaryCycleDays: number;
    workingDays:number;
};
type employeeDetails = {
    totalDeduction: number;
    corporateUser: string;
    employee: Employee;
    year: number;
    month: number;
    salaryCycleStart: string;
    salaryCycleEnd: string;
    salaryCycleDays: number;
    leaveCount: number;
    leaveDeduction: number;
    attendancePercentage: number;
    salaryInformation: SalaryInformation;
    workSchedule: WorkSchedule;
    gratuityContribution: number;
    reimbursements: any[];
    totalReimbursement: number;
    totalPayable: number;
    others: number;
    department: {
        _id: string;
        departmentName: string;
    };
    status: boolean;
    paySlipEmailSent: boolean;
    message: string;
    paymentStatus: string;
    paidViaRollout: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
    totalOtherDeduction: number;
    totalBonus: number;
    totalOvertime: number;
    totalIncentive: number;
    totalArrears: number;
    monthlySalary: number;
    bankDetails:any[];
    /** Loss of Pay for the month — earnings in salaryInformation are already reduced by it. */
    lossOfPay?: { days: number; amount: number; isAmountOverridden: boolean; grossBeforeLop: number };
};

type EmployeeInformation = {
    dateOfJoin: string;
    employeeId: string;
    designation: string;
    workLocation: string;
    status: string;
    employeeStatus: string;
};

type offBoardingInformation = {
    lastWorkingDay: string;
    resignationLetter: string;
    noticePeriod: number;
    offBoardingType: string;
    reasonForOffBoarding: string;
};

type WorkSchedule = {
    startTime: string;
    endTime: string;
    breakTimeHrs: number;
    days: {
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
        saturday: boolean;
        sunday: boolean;
    };
};

type SalaryInformation = {
    deductionAmount: number | 0;
    leavesAmount: number | 0;
    tdsAmount?: number;
    basicPay: number | 0;
    travelAllowances: number;
    homeAllowances: number;
    medicalAllowances: number;
    otherAllowances: number;
    other: number;
};

type Employee = {
    corporateUser: string;
    profileImage: string;
    personalInformation: {
        fullName: string;
        dateOfBirth: string;
        gender: string;
        mobileNo: string;
        email: string;
        personalAddress: string;
    };
    employeeInformation: EmployeeInformation;
    offBoardingInformation?: offBoardingInformation;
    emergencyNo?: string;
    id: string;
};

export type salarytableType = {
    id: string;
    name: string;
    employeeId: string;
    role: string;
    basicSalary: string | number;
    others: string | number;
    totalSalary?: string;
    totalDeduction?: string | number;
    status: string;
    action: string;
    email: string;
    image: string;
    department: string;
    salaryId: string;
    eId: string;
    employeeStatus?: string;
    lastWorkingDay?: string;
    monthlySalary?: string | number;
    totalPayable?: string | number;
    tds?: string | number;
    netSalaryBeforeTax?: string | number;
    oneTimeAmount?: number;
    lossOfPayDays?: number;
    lossOfPayAmount?: number;
};

export interface SalaryCycleType {
    salaryCycleStart: string;
    salaryCycleEnd: string;
    salaryCycleDays: number;
}
export type filterState = {
    searchText: string;
    sort: string;
    page: number;
    filter: string;
    year: number;
    month: string | number;
    limit: number;
};
export type filteredState = {
    sort: string;
    page: number;
    itemsPerPage: number;
    filter: string;
    from: string;
    to: string;
};
interface SalaryProfileInfo {
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
}

interface LeaveSummary {
    leaveCount: number;
    leaveType: string;
}

export type SalaryProfileResponse = {
    salaryInfo: SalaryProfileInfo;
    employee: EmployeeDetails;
    leaveSummary: LeaveSummary[];
};
type employeePayload = {
    userType: string;
    userId: number;
};
export type SalaryProfilePayload = employeePayload & {
    employeeId: string | undefined;
};

// export salary data payslip
export type exportSalaryDatapPayload = {
    userType: string;
    userId: number;
    month: number | string;
    year: number | string;
    filter?: string;
};
export type exportSalaryDataResponse = {
    buffer: {
        type: 'Buffer';
        data: [];
    };
};



export type PayslipApiRow = {
    // null for a scaffolded month with no Salary doc yet — see allPayrollSlips,
    // controller/salary.js.
    id: string | null;
    year: number;
    month: number;
    totalPayable: number;
    paymentStatus: string | null;
    salaryCycleStart:string;
    payingDate?: string | null;
    grossEarnings?: number;
    totalDeductions?: number;
    netPaid?: number;
    arrearsAmount?: number;
};

export type PayslipTableRow = {
    key: string;
    monthNum: number;
    yearNum: number;
    paymentStatus: string;
    payingDate: string | null;
    grossEarnings: number;
    totalDeductions: number;
    netPaid: number;
    arrearsAmount: number;
};

export type PayrollSlipTabProps = {
    payslipData: PayslipTableRow[];
    tableLoading?: boolean;
    eid:string;
    year: number;
    onYearChange: (year: number) => void;
};

export type PayslipResponse = {
    count: number;
    rows: PayslipApiRow[];
    totalEmailed: number;
};



export interface EmployeeDataType {
    key: string;
    name: string;
    employeeId: string;
    designation: string;
    department: string;
    basicSalary: string;
    totalAllowance: string;
    totalDeductions: string;
    netSalary: string;
    initials: string;
}

export type SalaryInfo = {
    basicPay?: number;
    hraAmount?: number;
    daAmount?: number;
    bonus?: number;
    incentiveAmount?: number;
    increamentAmount?: number;
    overtimeAmount?: number;
    deductionAmount?: number;
    leavesAmount?: number;
    tdsAmount?: number;
    other?: number;
};


export type PayrollHistoryTableRow = {
    id: string;
    createdDate: string;
    month: string;
    monthNumber: number;
    year: number;
    processedOn: string;
    totalEmployees: number;
    totalAmount: string;
    status: string;
};
