export interface Employee {
    id: string;
    corporateUser: string;
    profileImage: string | null;
    personalInformation: PersonalInformation;
    employeeInformation: EmployeeInformation;
    isCompleted: boolean;
    isEmployeeDeleted: boolean;
    salaryComponents: any[];
    employeeDocuments: any[];
    createdAt: string;
    updatedAt: string;
    __v: number;
}
interface PersonalInformation {
    fullName: string;
    gender: string;
    dateOfBirth: string; // Date in ISO 8601 format
    mobileNo: string;
    email: string;
    country: string;
    state: string;
    addressLine1: string;
    addressLine2: string;
    pinCode: string;
    emergencyContactName: string;
    emergencyContactNo: string;
    emergencyContactRelation: string;
    isDiffrentlyAbled: boolean;
}

interface Department {
    _id: string;
    departmentName: string;
}

interface EmployeeInformation {
    dateOfJoin: string; // Date in ISO 8601 format
    employeeId: string;
    department: Department;
    designation: string;
    reportingStaff: string | null;
    workingDays: number | null;
    timeSchedule: string;
    workingHours: number;
    contractType: string;
    employeeStatus: string;
    probationPeriod: number;
}
interface SalaryComponent {
    component: string;
    type: 'CUSTOM' | 'DEFAULT';
    _id: string;
}

interface OtherConfigurations {
    enableEPF: boolean;
    epfUAN: string;
    enableESI: boolean;
    esiNumber: string;
    professionalTax: boolean;
    laborWelfareFund: boolean;
    tds: string;
    tdsRegime: boolean;
}

interface BankDetails {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
}

export interface EmployeeResponse {
    count: number;
    rows: Employee[];
}

interface ProfileImage {
    base64: string;
    format: string;
}

export interface EmployeePersonalData {
    profileImage: ProfileImage | string | null;
    personalInformation?: PersonalInformation;
}

export interface EmployeeInfoData {
    profileImage: ProfileImage | string | null;
    employeeInformation: EmployeeInformation;
}
interface SalaryComponent {
    component: string; // Assuming component is an ID or a string
    type: 'CUSTOM' | 'DEFAULT'; // Assuming there are two types: CUSTOM and DEFAULT
}

interface OtherConfigurations {
    enableEPF: boolean;
    epfUAN: string;
    enableESI: boolean;
    esiNumber: string;
    professionalTax: boolean;
    laborWelfareFund: boolean;
    tds: string;
}

export interface EmployeeSalaryInfoData {
    profileImage: ProfileImage;
    salaryComponents: SalaryComponent[];
    otherConfigurations: OtherConfigurations;
}
interface DocumentUrl {
    base64: string;
    format: string; // For example, "pdf", "img", etc.
}

interface EmployeeDoc {
    name: string;
    url: DocumentUrl;
    expiryDate: string;
}

interface ProfileImage {
    base64: string;
    format: string;
}

export interface EmployeeDocInfoData {
    profileImage: ProfileImage | string | null;
    employeeDocuments: EmployeeDoc[];
}
interface ProfileImage {
    base64: string;
    format: string; // For example, "img"
}

interface BankDetails {
    accountNumber: string;
    bankName: string;
    accountName: string;
    ifscCode: string;
}

export interface EmployeeBankInfoData {
    profileImage: ProfileImage | string | null;
    bankDetails: BankDetails;
}
export type EmployeeDisplayType = {
    fullName: string;
    errors: string[];
    id: string;
    status: boolean;
    role: string;
    department: string;
    joinDate: string;
    annualCTC: number | string | null;
    employeeId:string;
};
export type ProcessSalaryType = {
    id: number;
    name: string;
    role: string;
    employeeId: number;
    monthlySalary: string;
    bonus: string;
    incentives: string;
    overtime: string;
    deduction: string;
    netPay: string;
    totalPayable: string;
};
