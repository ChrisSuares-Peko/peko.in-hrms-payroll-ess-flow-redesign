import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type InitialStateDataType = {
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
    validated: boolean;
    errors: string[];
    corporateUser?: string;
};

const initialStateData: InitialStateDataType[] = [
    {
        fullName: '',
        dateOfBirth: '',
        gender: '',
        mobileNo: '',
        email: '',
        country: '',
        state: null,
        addressLine1: '',
        addressLine2: '',
        pinCode: '',
        emergencyContactNumber: null,
        emergencyContactName: null,
        emergencyContactRelation: null,
        employeeId: '',
        department: '',
        workingHours: 0, // number
        dateOfJoin: '',
        designation: '',
        workEmailId: '',
        workingDays: '',
        contractType: '',
        reportingStaff: null,
        timeSchedule: '',
        employeeStatus: '',
        probationPeriod: null,
        accountHolderName: null,
        accountNumber: null,
        bankName: null,
        ifscCode: null,
        validated: false,
        errors: [],
        corporateUser: '',
    },
];

const dataSlice = createSlice({
    name: 'EmployeeBulkData',
    initialState: initialStateData,
    reducers: {
        setBulkEmployeeData: (state, action: PayloadAction<InitialStateDataType[]>) =>
            action.payload,
        resetData: state => {
            // Reset logic
        },
        updateEmployeeDetails: (
            state,
            action: PayloadAction<{ index: number; data: InitialStateDataType }>
        ) => {
            const { index, data } = action.payload;
            // No need to find the employee by ID, directly access it by index
            if (index >= 0 && index < state.length) {
                state[index] = { ...state[index], ...data };
            }
        },
    },
});

export const { setBulkEmployeeData, updateEmployeeDetails } = dataSlice.actions;

export default dataSlice.reducer;
