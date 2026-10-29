import { PayloadAction, createSlice } from '@reduxjs/toolkit';

// Define interfaces for employee data
interface PersonalInformation {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    email: string;
    workEmailId: string;
    country: string;
    state: string;
    emergencyContactNo: string;
    emergencyContactName: string;
    emergencyContactRelation: string;
    addressLine1: string;
    addressLine2: string;
    pinCode: string;
    isDiffrentlyAbled: boolean;
}

interface ProfileImageData {
    base64: string;
    format: string;
}

interface SalaryComponent {
    component: string;
    type: string;
    _id: string;
}

interface EmployeeDocument {
    name: string;
    url: string;
    expiryDate: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
}

interface EmployeeInformation {
    dateOfJoin: string;
    employeeId: string;
    department: {
        _id: string;
        departmentName: string;
    };
    designation: string;
    reportingStaff: string | null;
    workingDays: number | null;
    timeSchedule: string;
    workingHours: number;
    contractType: string;
    employeeStatus: string;
    probationPeriod: number;
    workEmailId: string;
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

interface EmployeeState {
    id: string;
    corporateUser: string;
    profileImage: ProfileImageData;
    personalInformation: PersonalInformation;
    isCompleted: boolean;
    salaryComponents: SalaryComponent[];
    employeeDocuments: EmployeeDocument[];
    employeeInformation: EmployeeInformation;
    otherConfigurations: OtherConfigurations;
    bankDetails: BankDetails;
    isLoading: boolean;
    refresh: boolean;
}

const initialState: EmployeeState = {
    id: '',
    corporateUser: '',
    profileImage: {
        base64: '',
        format: '',
    },
    personalInformation: {
        fullName: '',
        dateOfBirth: '',
        gender: '',
        mobileNo: '',
        email: '',
        country: '',
        state: '',
        emergencyContactNo: '',
        emergencyContactName: '',
        emergencyContactRelation: '',
        addressLine1: '',
        addressLine2: '',
        pinCode: '',
        isDiffrentlyAbled: false,
        workEmailId: '',
    },
    isCompleted: false,
    salaryComponents: [],
    employeeDocuments: [],
    employeeInformation: {
        dateOfJoin: '',
        employeeId: '',
        department: {
            _id: '',
            departmentName: '',
        },
        designation: '',
        reportingStaff: '',
        workingDays: 0,
        timeSchedule: '',
        workingHours: 0,
        contractType: '',
        employeeStatus: '',
        // Default probation for Add Employee (DEFAULT_PROBATION_MONTHS).
        probationPeriod: 3,
        workEmailId: '',
    },
    otherConfigurations: {
        enableEPF: false,
        epfUAN: '',
        enableESI: false,
        esiNumber: '',
        professionalTax: false,
        laborWelfareFund: false,
        tds: '',
        tdsRegime: false,
    },
    bankDetails: {
        accountName: '',
        accountNumber: '',
        bankName: '',
        ifscCode: '',
    },
    isLoading: false,
    refresh: false,
};

export const employeeSettingsSlice = createSlice({
    name: 'employeeSettings',
    initialState,
    reducers: {
        setFullData: (state, action: PayloadAction<EmployeeState>) => {
            state = { ...state, ...action.payload };
        },
        setEmployeeId: (state, action: PayloadAction<string>) => {
            state.id = action.payload;
        },
        setPersonalInformation: (state, action: PayloadAction<PersonalInformation>) => {
            state.personalInformation = { ...state.personalInformation, ...action.payload };
        },
        setSalaryComponents: (state, action: PayloadAction<SalaryComponent[]>) => {
            state.salaryComponents = action.payload;
        },
        setEmployeeDocuments: (state, action: PayloadAction<EmployeeDocument[]>) => {
            state.employeeDocuments = action.payload;
        },
        setEmployeeInformation: (state, action: PayloadAction<EmployeeInformation>) => {
            state.employeeInformation = { ...state.employeeInformation, ...action.payload };
        },
        setOtherConfigurations: (state, action: PayloadAction<OtherConfigurations>) => {
            state.otherConfigurations = { ...state.otherConfigurations, ...action.payload };
        },
        setBankDetails: (state, action: PayloadAction<BankDetails>) => {
            state.bankDetails = { ...state.bankDetails, ...action.payload };
        },
        setProfileImage: (state, action: PayloadAction<ProfileImageData>) => {
            state.profileImage = action.payload;
        },
        setIsLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setRefresh: (state, action: PayloadAction<boolean>) => {
            state.refresh = action.payload;
        },
        resetEmployeeState: () => initialState,
    },
});

export const {
    setFullData,
    setPersonalInformation,
    setSalaryComponents,
    setEmployeeDocuments,
    setEmployeeInformation,
    setOtherConfigurations,
    setBankDetails,
    setProfileImage,
    setIsLoading,
    setRefresh,
    setEmployeeId,
    resetEmployeeState,
} = employeeSettingsSlice.actions;

export default employeeSettingsSlice.reducer;
