import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface LoginState {
    token: string;
    refreshToken: string;
    sessionId: string;
    isAuthenticated?: boolean;
    role: string;
    id: number;
    username: string;
    roleName: string;
    redirectUrl: string;
    packageName: string;
    acs_user_id: string;
    corporateId?: any;
    subCorporateId?: number | null;
    subCorporateRole?: string | null;
    activeSubRole?: string | null;
    subCorporateUsername?: string;
    showPrivacyPolicyModal: boolean;
    // Populated only for a switched-to (or logged-in) employee identity.
    employeeId?: string;
    userAccessService?: any;
    email?: string;
    redirectURI?: string;
    name?: string;
    contactPersonName?: string;
    mobileNo?: string;
    service?: string;
    oauth_refreshToken?: string;
    sessionUUID?: string;
    autoLogin?: boolean;
    // The employee identity: one row, one id, whichever service invited them. Each service reads its own
    // entry out of `serviceMemberships` by its own label, so adding a service adds no field here.
    employeeProfileId?: number | string | null;
    employeeName?: string | null;
    employeeEmail?: string | null;
    employeeMobile?: string | null;
    serviceMemberships?: ServiceMembership[] | null;
}

export interface ServiceMembership {
    label: string;
    hasAccess: boolean;
    role?: string | null;
    status?: string | null;
    ref?: string | null;
    email?: string;
    redirectURI?: string;
    name?: string;
    contactPersonName?: string;
    mobileNo?: string;
    service?: string;
    oauth_refreshToken?: string;
    sessionUUID?: string;
    autoLogin?: boolean;
}

const initialState: LoginState = {
    token: '',
    refreshToken: '',
    sessionId: '',
    isAuthenticated: false,
    role: '',
    id: 0,
    username: '',
    roleName: '',
    redirectUrl: '',
    packageName: '',
    acs_user_id: '',
    corporateId: 0,
    subCorporateId: 0,
    subCorporateRole: null,
    activeSubRole: null,
    employeeProfileId: null,
    employeeName: null,
    employeeEmail: null,
    employeeMobile: null,
    serviceMemberships: null,
    showPrivacyPolicyModal: false,
};

export const loginSlice = createSlice({
    name: 'login',
    initialState,
    reducers: {
        loginSuccess: (state, action: PayloadAction<Partial<LoginState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
        setRedirectUrl: (state, action: PayloadAction<string>) => {
            state.redirectUrl = action.payload;
            return state;
        },
        setPrivacyModalVisible: (state, action: PayloadAction<boolean>) => {
            state.showPrivacyPolicyModal = action.payload;
        },
        setLogout: state => {
            state = initialState;
            return state;
        },
    },
});

export const { loginSuccess, setLogout, setRedirectUrl, setPrivacyModalVisible } =
    loginSlice.actions;

export default loginSlice.reducer;
