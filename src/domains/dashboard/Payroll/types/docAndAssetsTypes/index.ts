export type documentPayload = {
    userId: number;
    userType: string;
    page: number;
    limit: number;
    year?: number;
    month?: number | string;
    searchText?: string;
    employee?: string;
};

export type employeeDocumentPayload = {
    userId: number;
    userType: string;
    page: number;
    limit: number;
    year?: number;
    month?: number | string;
    searchText?: string;
    employeeId: string;
};
type Document = {
    name: string;
    url: string;
    expiryDate: string;
    holderName: string;
    _id: string;
    createdAt: string;
    fullName: string;
    employeeId: string;
};

export type DocumentsListingResponse = {
    documents: Document[];
    total: number;
};
export type documentTable = {
    dateAdded: string;
    employeeName: string;
    documentName: string;
    name?: string;
    expiryDate: string;
    action: string;
    docuementId?: string;
    employeeId?: string;
    url: string;
    holderName: string;
};
export interface UserPayload {
    userId: number;
    userType: string;
}
export type createDocPayload = {
    name: string;
    url: {
        base64: string;
        format: string;
    };
    expiryDate: string;
    holderName: string;
    employee: string;
    attachmentFormat: string;
};
export type updateDocPayload = {
    name: string;
    url: {
        base64: string;
        format: string;
    };
    expiryDate: string;
    holderName: string;
    employee: string;
    attachmentFormat: string;
    employeeId?: string;
    documentId?: string;
};
interface BankDetails {
    accountNumber: string;
    swiftCode: string;
    bankName: string;
    ibanNumber: string;
    beneficiaryName: string;
    routingCode: string;
    accountType: string;
}

interface EmployeeDocument {
    name: string;
    url: string;
    expiryDate: string;
    holderName: string;
    _id: string;
}

interface EmployeeInformation {
    dateOfJoin: string;
    employeeId: string;
    designation: string;
    department: string;
    reportingStaff: string;
    workingDays: number;
    schedule: string;
    workingHours: number;
    status: string;
    jobType: string;
}

interface OffBoardingInformation {
    lastWorkingDay: string;
    resignationLetter: string;
    noticePeriod: number;
    offBoardingType: string;
    reasonForOffBoarding: string;
}

interface SalaryInformation {
    basicPay: number;
    travelAllowances: number;
    homeAllowances: number;
    medicalAllowances: number;
    otherAllowances: number | null;
    other: any;
}

export interface DocResponse {
    corporateUser: string;
    fullName: string;
    profileImage: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    emergencyNo: string;
    personalEmail: string;
    emergencyContactName: string;
    emergencyContactRelation: string;
    nationality: string;
    employeeInformation: EmployeeInformation;
    salaryInformation: SalaryInformation;
    employeeDocuments: EmployeeDocument[];
    isEmployeeDeleted: boolean;
    bankDetails: BankDetails;
    createdAt: string;
    updatedAt: string;
    offBoardingInformation: OffBoardingInformation;
    experience: string;
    maritialStatus: string;
    qualification: string;
    id: string;
}

export type docDeletePayload = {
    employeeId?: string;
    documentId?: string;
};

export type createAssetPayload = {
    assetName: string;
    assetType: string;
    purchasedDate: string;
    status: string;
    assetId: string;
    employee: string;
    batchNo: string;
};

export type updateAssetPayload = {
    assetName: string;
    assetType: string;
    purchasedDate: string;
    status: string;
    assetId: string;
    employee: string;
    batchNo: string;
    employeeId?: string;
    aId?: string;
};

export type assetResponse = {
    corporateUser: string;
    assetName: string;
    assetId: string;
    purchasedDate: string;
    assetType: string;
    status: string;
    employee: string;
    batchNo: string;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type assetPayload = {
    userId: number;
    userType: string;
    page: number;
    limit: number;
    year?: number;
    month?: number | string;
    searchText?: string;
    assetStatus?: string;
    assetType?: string;
};

interface Asset {
    corporateUser: string;
    assetName: string;
    assetId: string;
    purchasedDate: string;
    assetType: string;
    status: string;
    employee: {
        fullName: string;
        id: string;
    };
    batchNo: string;
    createdAt: string;
    updatedAt: string;
    id: string;
}
export type assetsListingResponse = {
    totalCount: number;
    assetData: Asset[];
};

export type assetDeletePayload = {
    assetId?: string;
};
export type assetDeleteResponse = {
    corporateUser: string;
    assetName: string;
    assetId: string;
    purchasedDate: string;
    assetType: string;
    status: string;
    employee: string;
    batchNo: string;
    createdAt: string;
    updatedAt: string;
    id: string;
};
export type assetTable = {
    dateAdded: string;
    assetType: string;
    assetName: string;
    assetId: string;
    batchNo: string;
    purchasedDate: string;
    user: string;
    status: string;
    action: string;
    id?: string;
    aId?: string;
    employeeId?: string;
    employee?: string;
};
export interface AssetType {
    label: string;
    value: string;
}

export interface AssetTypesResponse {
    assetTypes: AssetType[];
}
export type employeePayload = {
    userId: number;
    userType: string;
};
export type employeeListResponse = {
    employees: employeeTypes[];
};

export type employeeResponse = {
    employees: employeeTypes[];
};
export type employeeTypes = {
    fullName: string;
    value: string;
    label: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    personalEmail: string;
    nationality?: string;
    passportNo?: string;
    passportIssuedCountry?: string;
    passportIssuedDate?: string;
    passportExpiryDate?: string;
    employeeDocuments: EmployeeDocument[];
    employeeInformation: {
        dateOfJoin: string;
        employeeId: string;
        designation: string;
        department: string;
        workLocation: string;
        schedule: string;
        status: string;
    };
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
        workHrs: number;
    };
    id: string;
};
interface EmployeeDocument {
    name: string;
    url: string;
    expiryDate: string;
    _id: string;
}
