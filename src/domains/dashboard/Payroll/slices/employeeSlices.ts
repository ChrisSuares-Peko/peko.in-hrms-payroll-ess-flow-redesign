import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PersonalData {
    fullName: string;
    dob: string;
    gender: string;
    mobileNo: string;
    personalEmail: string;
    emergencyContactNo: string;
    emergencyContactName: string;
    emergencyContactRelation: string;
    gccNational: string;
    nationality: string;
    state: string;
    passportNo?: string;
    passportIssuedCountry?: string;
    passportIssuedDate?: string;
    passportExpiryDate?: string;
}

interface EmployeeData {
    dateOfJoin: string;
    employeeId: string;
    reportingStaff: string;
    department: string;
    workingDays: string;
    workingHours: number;
    status: string;
    designation: string;
    jobType: string;
    schedule: string;
    probation: string;
    employeeGrade: string;
}

interface SalaryData {
    basicPay: string;
    homeAllowances: string;
    travelAllowances: string;
    medicalAllowances: string;
    otherAllowances: string;
    other: string;
}

interface EmployeeDocument {
    name: string;
    url: {
        base64: string;
        format: string;
    };
    expiryDate?: string;
}

export interface ProfileImage {
    base64: string;
    format: string;
}

interface ImageData {
    profileImage: ProfileImage | null;
}

interface BankData {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankBranch: string;
    ibanNumber: string;
    accountType: string;
}

// Specify the type for the employeeDocuments property
interface EmployeeState {
    personalDetails: PersonalData;
    employeeDetails: EmployeeData;
    salaryDetails: SalaryData;
    employeeDocuments: EmployeeDocument[];
    bankDetails: BankData;
    imageDetails: ImageData;
    fileNameData: string; // New field for storing the file name
}

const initialState: EmployeeState = {
    personalDetails: {
        fullName: '',
        dob: '',
        gender: '',
        mobileNo: '',
        personalEmail: '',
        emergencyContactNo: '',
        emergencyContactName: '',
        emergencyContactRelation: '',
        gccNational: '',
        nationality: '',
        state: '',
        passportNo: '',
        passportIssuedCountry: '',
        passportIssuedDate: '',
        passportExpiryDate: '',
    },
    employeeDetails: {
        dateOfJoin: '',
        employeeId: '',
        department: '',
        reportingStaff: '',
        workingDays: ' 0',
        workingHours: 0,
        status: '',
        designation: '',
        jobType: '',
        schedule: '',
        probation: '',
        employeeGrade: '',
    },
    salaryDetails: {
        basicPay: '',
        homeAllowances: '',
        travelAllowances: '',
        medicalAllowances: '',
        otherAllowances: '',
        other: '',
    },
    imageDetails: {
        profileImage: {
            base64: '',
            format: '',
        },
    },

    // Initialize employeeDocuments as an empty array
    employeeDocuments: [],

    bankDetails: {
        accountName: '',
        accountNumber: '',
        bankName: '',
        bankBranch: '',
        ibanNumber: '',
        accountType: '',
    },
    fileNameData: '',
};

const employeeSlices = createSlice({
    name: 'employeeDetails',
    initialState,
    reducers: {
        setPersonalData: (state, action: PayloadAction<PersonalData>) => {
            state.personalDetails = { ...state.personalDetails, ...action.payload };
        },
        setEmployeeData: (state, action: PayloadAction<EmployeeData>) => {
            state.employeeDetails = { ...state.employeeDetails, ...action.payload };
        },
        setSalaryData: (state, action: PayloadAction<SalaryData>) => {
            state.salaryDetails = { ...state.salaryDetails, ...action.payload };
        },
        // Correctly set the type for the payload
        setEmployeeDocuments: (state, action: PayloadAction<EmployeeDocument[]>) => {
            state.employeeDocuments = action.payload;
        },

        setBankData: (state, action: PayloadAction<BankData>) => {
            state.bankDetails = { ...state.bankDetails, ...action.payload };
        },

        // setImageData: (state, action: PayloadAction<ProfileImage>) => {
        //     state.imageDetails.profileImage = action.payload;
        // },

        setImageData: (state, action: PayloadAction<ProfileImage | null>) => {
            state.imageDetails = {
                ...state.imageDetails,
                profileImage: action.payload,
            };
        },

        setFileData: (state, action: PayloadAction<string>) => {
            state.fileNameData = action.payload;
        },
    },
});

export const {
    setPersonalData,
    setEmployeeData,
    setSalaryData,
    setEmployeeDocuments,
    setBankData,
    setImageData,
    setFileData,
} = employeeSlices.actions;
export default employeeSlices.reducer;
