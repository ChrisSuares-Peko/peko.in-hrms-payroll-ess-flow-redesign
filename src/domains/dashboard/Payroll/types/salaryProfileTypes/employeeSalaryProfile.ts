import { Dayjs } from 'dayjs';

// gratuity calculator
export type gratuityCalculatePayload = {
    userId?: number;
    userType?: string;
    fromDate: string | Dayjs;
    toDate: string | Dayjs;
    basicSalary: number;
};
export type gratuityCalculateResponse = {
    gratuity: string;
    yearsOfExperience: number;
};
// increment

export type getDeductionResponse = {
    count: number;
    deductions: deductions[];
};

export type deductions = {
    corporateUser: number;
    employee: string;
    deductionDate: string;
    deductionType: string;
    deductionAmount: number;
    deductionStatus: string;
    id: string;
};
type EmployeeInformation = {
    dateOfJoin: string;
    employeeId: string;
    designation: string;
    department: string;
    reportingStaff: string | null;
    workingDays: number;
    schedule: string;
    workingHours: number;
    status: string;
    jobType: string;
    probation: number;
};
type Employee = {
    corporateUser: string;
    fullName: string;
    profileImage: string | null;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    emergencyNo: string;
    personalEmail: string;
    emergencyContactName: string;
    emergencyContactRelation: string;
    nationality: string;
    employeeInformation: EmployeeInformation;
    isEmployeeDeleted: boolean;
    experienceInMonth: string;
    experienceInYear: string;
    maritialStatus: string;
    qualification: string;
    id: string;
};

type SalaryInformation = {
    basicPay: number;
    travelAllowances: number;
    homeAllowances: number;
    medicalAllowances: number;
    otherAllowances: number | null;
    other: number | null;
};

type Department = {
    _id: string;
    departmentName: string;
};

type Row = {
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
    totalOtherDeduction: number;
    totalIncentive: number;
    totalBonus: number;
    totalOvertime: number;
    totalPayable: number;
    status: boolean;
    paySlipEmailSent: boolean;
    message: string;
    paymentStatus: string;
    salaryInformation: SalaryInformation;
    payingDate: string;
    department: Department;
    others: number;
    monthlySalary: number;
    id: string;
};

type SalaryCycle = {
    salaryCycleStart: string;
    salaryCycleEnd: string;
    salaryCycleDays: number;
};

type Data = {
    count: number;
    salaryCycle: SalaryCycle;
    totalPayableSum: number;
    rows: Row[];
};

export type SalaryStatementApiResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data: Data;
};
