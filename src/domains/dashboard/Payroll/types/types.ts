import { DropDown } from '@customtypes/general';

import { ProfileImage } from '../slices/employeeSlices';

export interface InfoCardProps {
    icon: string;
    title: string;
    value: number | undefined | string;
    isCurrency: boolean;
    bgColor: string;
    reference?: React.MutableRefObject<null>;
    outOf?: number;
}

export type TDSReportItem = {
    employeeId: string;
    name: string;
    email: string;
    taxRegime: string;
    tdsFrequency: string;
    taxableIncome: number;
    exemptions: number;
    tdsDeduction: number;
    profileImage?: string;
};

export type TDSReportbyEmployee = {
    employeeDetails: {
        name: string;
        email: string;
    };
    taxRegime?: string;
    texRegime?: string;
    fy?: string;
    grossAnnual?: number;
    taxableIncome: number;
    exemptions: number;
    slabBreakdown?: {
        from: number | null;
        to: number | null;
        rate: number | null;
        taxableAmount: number | null;
        tax: number | null;
    }[];
    taxBeforeRebate?: number;
    rebate?: number;
    totalTax: number;
    monthlyTds: number;
    tdsFrequency: string;
    cess: number;
};

export interface CardProps {
    icon: string;
    title: string;
    link: string;
    isActive: boolean;
    reference?: React.MutableRefObject<null>;
    onClick?: () => void;
    // Overrides the default desktop icon width (40) — for icons whose artwork is
    // wider than tall, a larger width keeps its rendered height comparable to
    // sibling icons instead of looking undersized. Mobile scales at half this value.
    iconWidth?: number;
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

export interface ActivityData {
    title: string;
    description: string;
    date: string;
    type: string;
    isLoading?: boolean;
}

export interface AnnouncementDataType {
    id: string;
    key: string;
    date: string;
    subject: string;
    excludedEmployees: {
        personalInformation: {
            fullName: string;
            email: string;
        };
        id: string;
    }[];
    status: string;
    details?: string;
}

export interface EmployeePayload {
    userId: number;
    userType: string;
    searchText: string;
    page: number;
    limit: number;
    status: 'active' | 'past';
    sortField?: string;
    sortOrder?: string;
    stage?: EmploymentStageFilter;
}

/** An offboarded employee's stage, worked out by the API from the last working day. */
export type OffBoardingStage = 'NOTICE_PERIOD' | 'PAST';

/** The employee's status, worked out by the API from joining date, probation months, confirmation and offboarding. */
export type EmploymentStageKey = 'ON_PROBATION' | 'PROBATION_REVIEW_DUE' | 'CONFIRMED' | 'NOTICE_PERIOD' | 'EXITED';
export type EmploymentStage = {
    stage: EmploymentStageKey;
    probationEndDate?: string;
    daysLeft?: number;
    confirmationDate?: string | null;
    lastWorkingDay?: string | null;
};
/** The Active Employees filter chips. */
export type EmploymentStageFilter = 'ON_PROBATION_ALL' | 'ENDING_IN_30_DAYS' | 'PROBATION_REVIEW_DUE' | 'CONFIRMED';
export type EmploymentStageCounts = Record<'ALL' | EmploymentStageFilter, number>;

export interface Employee {
    profileImage: string;
    personalInformation: {
        corporateUser: string;
        fullName: string;

        dateOfBirth: string;
        gender: string;
        mobileNo: string;
        email: string;
        personalAddress: string;
        nationality: string;
        isGccNationality: string | boolean;
        emergencyContactName: string;
        emergencyContactRelation: string;
        emergencyContactNo: string;
        qualification?: string;
        experienceInYear?: string;
        experienceInMonth?: string;
        maritialStatus?: string;
    };

    employeeInformation: {
        probation: string;
        designation: any;
        dateOfJoin: string;
        employeeId: string;
        workingHours: number;
        department: { departmentName: string; id: string };
        workingDays: number;
        employeeStatus: string;
        reportingStaff: string;
        schedule?: string;
        jobType: string;
        employeeType?: string;
    };
    salaryInformation: {
        basicPay: number;
        travelAllowances: number | null;
        homeAllowances: number | null;
        medicalAllowances: number | null;
        otherAllowances: number | null;
        other: number | null;
    };
    employeeDocuments: {
        name: string;
        url: string;
        expiryDate: string;
    }[];
    bankDetails: {
        beneficiaryName: string;
        accountNumber: string;
        swiftCode?: string; // Optional if needed
        bankName: string;
        ibanNumber: string;
        bankBranch?: string; // Optional if needed
        accountType?: string | null; // Optional if needed
    };
    isCompleted: boolean;

    createdAt: string;
    updatedAt: string;
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
        overTime?: string; // Optional if needed
    };
    offBoardingInformation?: {
        lastWorkingDay: string;
        resignationLetter: string;
        noticePeriod: number;
        offBoardingType: string;
        reasonForOffBoarding: string;
    };
    /** Set by the API: NOTICE_PERIOD through the last working day, PAST after it. */
    offBoardingStage?: OffBoardingStage | null;
    employmentStage?: EmploymentStage;
    emergencyNo: string;
    id: string;
    isEss?: boolean;
}
export interface UpdateEmployee {
    corporateUser: string;
    fullName: string;
    profileImage: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    personalEmail: string;
    email: string;
    personalAddress: string;
    nationality: string;
    isGccNationality: string | boolean;
    emergencyContactName: string;
    emergencyContactRelation: string;
    emergencyContactNo: string;
    qualification?: string;
    experienceInYear?: string;
    experienceInMonth?: string;
    maritialStatus?: string;
    employeeInformation: {
        probation: string;
        designation: any;
        dateOfJoin: string;
        employeeId: string;
        workingHours: number;
        department: { departmentName: string; _id: string };
        workingDays: number;
        status: string;
        reportingStaff: string;
        schedule?: string;
        jobType: string;
        employeeType?: string;
    };
    salaryInformation: {
        basicPay: number;
        travelAllowances: number | null;
        homeAllowances: number | null;
        medicalAllowances: number | null;
        otherAllowances: number | null;
        other: number | null;
        totalIncrements: number | null;
    };
    employeeDocuments: {
        name: string;
        url: string;
        expiryDate: string;
    }[];
    bankDetails: {
        beneficiaryName: string;
        accountNumber: string;
        swiftCode?: string; // Optional if needed
        bankName: string;
        ibanNumber: string;
        bankBranch?: string; // Optional if needed
        accountType?: string | null; // Optional if needed
        routingCode?: string;
    };

    createdAt: string;
    updatedAt: string;
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
        overTime?: string; // Optional if needed
    };
    offBoardingInformation?: {
        lastWorkingDay: string;
        resignationLetter: string;
        noticePeriod: number;
        offBoardingType: string;
        reasonForOffBoarding: string;
    };
    passportNo?: string;
    passportIssuedCountry?: string;
    passportExpiryDate?: string;
    passportIssuedDate?: string;
    emergencyNo: string;
    _id: string;
}
export interface EmployeeListResponse {
    count: number;
    rows: Employee[];
    /** Active tab only: how many employees each filter chip matches. */
    stageCounts?: EmploymentStageCounts;
}

export interface ListResponse {
    data: Employee[];
}

export type EmployeeTableData = {
    name: string;
    employeeId: string;
    employeeMail: string;
    image: string;
    designation: string;
    joinDate: string;
    status: string;
    phone: string;
    department: string;
    // department: string;
    id: string;
    isSelected?: boolean;
    lastWorkingDay?: string;
    isCompleted?: boolean;
    offBoardingType?: string;
};

export type DeletePayload = {
    userId: number;
    userType: string;
    idToDelete: string;
};

export type DeleteResponse = {
    message: string;
    data: Employee;
};

export type CreateResponse = {
    message: string;
    data: Employee;
    status: boolean;
};

export type CreatePayload = {
    profileImage?: ProfileImage | null;

    fullName: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    personalEmail: string;
    emergencyNo: number | string;
    emergencyContactName: string;
    emergencyContactRelation: string;
    isGccNationality: string | boolean;
    nationality?: string;
    passportNo?: string;
    passportIssuedCountry?: string;
    passportIssuedDate?: string;
    passportExpiryDate?: string;
    employeeInformation: {
        dateOfJoin: string;
        employeeId: string;
        department: string;
        reportingStaff: string;
        workingHours: number;
        workingDays?: string;
        designation: string;
        jobType: string;
    };
    salaryInformation: {
        basicPay: string;
        travelAllowances: string;
        homeAllowances: string;
        medicalAllowances: string;
        otherAllowances: string;
        other: string;
    };
    employeeDocuments: {
        name: string;
        url: {
            base64: string;
            format: string;
        };
        expiryDate?: string;
    }[];
    bankDetails: {
        beneficiaryName: string;
        accountNumber: string;
        bankName: string;
        swiftCode: string;
        ibanNumber: string;
    };

    userType?: string;
    userId?: number;
};

export type FetchEmployeePayload = {
    sortField?: string;
    sortOrder?: string;
    userType: string;
    userId: number;
    employeeID: string;
};

export type EmployeeGetResponse = {
    status: string;
    message: string;
    data: Employee;
};

export type CountriesResponse = {
    countries: DropDown;
};

export type UpdatePayload = {
    profileImage?: ProfileImage | null;
    id: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    personalEmail: string;
    emergencyNo: number | string;
    emergencyContactName: string;
    emergencyContactRelation: string;
    isGccNationality: string | boolean;
    nationality?: string;
    employeeInformation: {
        dateOfJoin: string;
        employeeId: string;
        department: string;
        reportingStaff: string;
        workingHours: number;
        workingDays: string;
    };
    salaryInformation: {
        basicPay: string;
        travelAllowances: string;
        homeAllowances: string;
        medicalAllowances: string;
        otherAllowances: string;
        other: string;
    };
    employeeDocuments?: {
        name: string;
        url: {
            base64: string;
            format: string;
        };
        expiryDate?: string;
    }[];
    bankDetails: {
        beneficiaryName: string;
        accountNumber: string;
        bankName: string;
        swiftCode: string;
        ibanNumber: string;
    };

    userType?: string;
    userId?: number;
};

type PersonalInformation = {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    email: string;
    country: string;
    state: string;
    emergencyContactNo: string;
    emergencyContactName: string;
    emergencyContactRelation: string;
    qualification: string;
    experienceInYear: string;
    experienceInMonth: string;
    maritialStatus: string;
};
export type UpdatePayloadNew = {
    id?: string;
    personalInformation?: PersonalInformation;

    employeeInformation?: {
        dateOfJoin?: string;
        employeeId?: string;
        department?: string;
        reportingStaff?: string;
        workingHours?: number;
        workingDays?: string;
    };
    salaryInformation?: {
        basicPay?: string;
        travelAllowances?: string;
        homeAllowances?: string;
        medicalAllowances?: string;
        otherAllowances?: string;
        other?: string;
    };
    employeeDocuments?: {
        name?: string;
        url?: {
            base64?: string;
            format?: string;
        };
        expiryDate?: string;
    }[];
    bankDetails?: {
        beneficiaryName?: string;
        accountNumber?: string;
        bankName?: string;
        swiftCode?: string;
        ibanNumber?: string;
    };

    userType?: string;
    userId?: number;
};

export type UpdateResponse = {
    status: boolean;
    responseCode: string;
    message: string;
    data: {
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
            department: string;
            reportingStaff: string;
            workingDays: number;
            workingHours: number;
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
        employeeDocuments: {
            name: string;
            url: string;
            expiryDate: string;
        }[];
        bankDetails: {
            accountNumber: string;
            swiftCode: string;
            bankName: string;
            ibanNumber: string;
            beneficiaryName: string;
        };
        createdAt: string;
        updatedAt: string;
        workSchedule: {
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
            overTime: string;
        };
        emergencyContactName: string;
        emergencyContactRelation: string;
        emergencyNo: string;
        isGccNationality: boolean;
        nationality: string;
        id: string;
    };
};

export type GetReportingStaffPayload = {
    userId: number;
    userType: string;
    searchText: String;
};

interface ReportingStaff {
    fullName: string;
    _id: string;
}

export interface EmployeesResponse {
    employees: ReportingStaff[];
}

export type staffSelect = {
    key: number;
    value: string;
    label: string;
};

export type DocumentUpload = {
    name: string;
    url: {
        base64: string;
        format: string;
    };
    expiryDate?: string;
};

export type exportEmployeeDataPayload = {
    userId: number;
    userType: string;
    employeeStatus: string;
};

export type exportEmployeeDataResponse = {
    buffer: {
        type: string;
        data: number[]; // Assuming data is an array of numbers
    };
    fileType: string;
};

export type filterStates = {
    search: string;
    start: number;
    length: number;
    year: number;
    month: number;
};

export interface BulkUploadPayload {
    userId?: number;
    userType?: string;
    file: any;
}

export interface EmployeeData {
    jsonData: {
        fullName: string;
        dateOfBirth: string;
        gender: string;
        mobileNo: number;
        emergencyNo: number;
        personalEmail: string;
        emergencyContactName: string;
        emergencyContactRelation: string;
        isGccNationality: boolean;
        nationality: string;
        dateOfJoin: string;
        employeeId: number;
        designation: string;
        department: string;
        reportingStaff: string;
        workingDays: number;
        workingHours: number;
        workLocation: string;
        // status: string;
        basicPay: number;
        accountName: string;
        accountNumber: number;
        swiftCode: string;
        bankName: string;
        bankBranch: string;
        ibanNumber: number;
        accountType: string;
        beneficiaryName: string;
        corporateUser: string;
        validated: boolean;
        errors: string[];
    }[];
}

interface InitialStateDataType {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    email: string;
    country: string;
    state: string | null;
    addressLine1: string;
    addressLine2: string;
    pinCode: string;
    emergencyContactNumber: string | null;
    emergencyContactName: string | null;
    emergencyContactRelation: string | null;
    employeeId: string;
    department: string;
    workingHours: number;
    dateOfJoin: string;
    designation: string;
    workEmailId: string;
    workingDays: string;
    contractType: string;
    reportingStaff: string | null;
    timeSchedule: string;
    employeeStatus: string;
    probationPeriod: string | null;
    pan?: string | null;
    taxRegime?: string | null;
    uan?: string | null;
    esiNumber?: string | null;
    workState?: string | null;
    annualCTC?: number | string | null;
    accountHolderName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    ifscCode?: string | null;
    corporateUser: string;
    validated: boolean;
    errors: string[];
}

export interface BulkEmployeeUploadResponse {
    status: boolean;
    CountOfDocs: string;
    responseCode: string;
    message: string;
    jsonData: InitialStateDataType[];
}

export type BulkUploadCreatePayload = {
    userId?: number;
    userType?: string;
    jsonData: {
        fullName: string;
        dateOfBirth: string;
        gender: string;
        mobileNo: string;
        email: string;
        country: string;
        state: string | null;
        addressLine1: string;
        addressLine2: string;
        pinCode: string;
        emergencyContactNumber: string | null;
        emergencyContactName: string | null;
        emergencyContactRelation: string | null;
        employeeId: string;
        department: string;
        workingHours: number;
        dateOfJoin: string;
        designation: string;
        workEmailId: string;
        workingDays: string;
        contractType: string;
        reportingStaff: string | null;
        timeSchedule: string;
        // timeSchedule: string;
        employeeStatus: string;
        probationPeriod: string | null;
        pan?: string | null;
        taxRegime?: string | null;
        uan?: string | null;
        esiNumber?: string | null;
        workState?: string | null;
        annualCTC?: number | string | null;
        accountHolderName?: string | null;
        accountNumber?: string | null;
        bankName?: string | null;
        ifscCode?: string | null;
    }[];
};

export type excelTemplatePayload = {
    userId?: number;
    userType?: string;
};

export type TDSPayload = {
    userId?: number;
    userType?: string;
    month?: number | string;
    year?: number | string;
    eid?: string;
};
export type Form16DownloadPayload = {
    userId?: number;
    userType?: string;
    year?: number | string;
    eid?: string;
    formtype: 'form16b' | 'form16a';
};

export type TDSReportExcelPayload = {
    userId?: number;
    userType?: string;
    month?: string;
    year: string;
    regimeType: string;
};
export type GetExcelTemplateResponse = {
    status: boolean;
    responseCode: string;
    message: string;

    buffer: {
        type: string;
        data: number[];
    };
};
type ResignationLetterPayload = {
    base64: string;
    format: string;
};
export type OffBoardEmployeePayload = {
    userId?: number;
    userType?: string;
    employeeId?: number;
    id?: number;
    lastWorkingDay?: string;
    noticePeriod?: string;
    offBoardingType?: string;
    offBoardingDate?: string;
    reasonForOffBoarding?: string;
    resignationLetter?: ResignationLetterPayload;
};

export interface userPayload {
    userType: string;
    userId: number;
}

export type employeeResponse = {
    employees: employeeTypes[];
};
export type employeeTypes = {
    fullName: string;
    value: string;
    label: string;
    personalEmail: string;
    id: string;
    employeeInformation: {
        employeeId: string;
    };
};

export type validateLimitSubscription = {
    userId?: number;
    userType?: string;
};
