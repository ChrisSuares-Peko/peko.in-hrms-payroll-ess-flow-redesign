import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface CompanyProfileData {
    companyName: string;
    companyAddressLine1: string;
    companyAddressLine2: string;
    city: string;
    state: string;
    pinCode: string;
    contactNumber: string;
    emailAddress: string;
    industry: string;
    companyLogo: string;
}

interface OrganizationTaxDetailsData {
    PAN: string;
    TAN: string;
    TDSCode: string;
    taxPaymentFrequency: string;
}

interface PayrollSettingsData {
    selectWorkingDays: string[];
    calculateSalaryBasedOn: string;
    payrollFrom: string;
    payEmployeeOn: string;
}

interface BankDetailsData {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    ifscCode: string;
    branchAddress: string;
}

interface BasicSalaryData {
    hasBasicSalaryComponent: boolean;
    basicSalaryAmount: number;
}

interface OrganizationSettingsState {
    companyProfile: CompanyProfileData;
    organizationTaxDetails: OrganizationTaxDetailsData;
    payrollSettings: PayrollSettingsData;
    bankDetails: BankDetailsData;
    isLoading: boolean;
    refresh: boolean;
    refreshBasicSalary: boolean;
    hasBasicSalaryComponent: boolean;
    basicSalaryAmount: number;
    refreshSalaryComp: boolean;
}

const initialState: OrganizationSettingsState = {
    companyProfile: {
        companyName: '',
        companyAddressLine1: '',
        companyAddressLine2: '',
        city: '',
        state: '',
        pinCode: '',
        contactNumber: '',
        emailAddress: '',
        industry: '',
        companyLogo: '',
    },
    organizationTaxDetails: {
        PAN: '',
        TAN: '',
        TDSCode: '',
        taxPaymentFrequency: '',
    },
    payrollSettings: {
        selectWorkingDays: [],
        calculateSalaryBasedOn: '',
        payrollFrom: '',
        payEmployeeOn: '',
    },
    bankDetails: {
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        ifscCode: '',
        branchAddress: '',
    },
    isLoading: false,
    refresh: false,
    refreshBasicSalary: false, // Initial state for Basic Salary refresh
    hasBasicSalaryComponent: false,
    basicSalaryAmount: 0,
    refreshSalaryComp: false,
};

export const orgSettingsSlice = createSlice({
    name: 'orgSettings',
    initialState,
    reducers: {
        setCompanyProfile: (state, action: PayloadAction<CompanyProfileData>) => {
            state.companyProfile = { ...state.companyProfile, ...action.payload };
        },
        setOrganizationTaxDetails: (state, action: PayloadAction<OrganizationTaxDetailsData>) => {
            state.organizationTaxDetails = { ...state.organizationTaxDetails, ...action.payload };
        },
        setPayrollSettings: (state, action: PayloadAction<PayrollSettingsData>) => {
            state.payrollSettings = { ...state.payrollSettings, ...action.payload };
        },
        setBankDetails: (state, action: PayloadAction<BankDetailsData>) => {
            state.bankDetails = { ...state.bankDetails, ...action.payload };
        },
        setBasicSalaryData: (state, action: PayloadAction<BasicSalaryData>) => {
            state.hasBasicSalaryComponent = action.payload.hasBasicSalaryComponent;
            state.basicSalaryAmount = action.payload.basicSalaryAmount;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setRefresh: (state, action: PayloadAction<boolean>) => {
            state.refresh = action.payload;
        },
        setRefreshBasicSalary: (state, action: PayloadAction<boolean>) => {
            state.refreshBasicSalary = action.payload; // New action for refreshing Basic Salary
        },
        setRefreshSalaryComp: (state, action: PayloadAction<boolean>) => {
            state.refreshSalaryComp = action.payload;
        },
        setFullData: (state, action: PayloadAction<OrganizationSettingsState>) => {
            state = { ...state, ...action.payload };
        },
        resetState: state => initialState,
    },
});

export const {
    setCompanyProfile,
    setOrganizationTaxDetails,
    setPayrollSettings,
    setBankDetails,
    setBasicSalaryData,
    setLoading,
    setRefresh,
    setRefreshBasicSalary, // Export new action
    setRefreshSalaryComp,
    setFullData,
    resetState,
} = orgSettingsSlice.actions;

export default orgSettingsSlice.reducer;
