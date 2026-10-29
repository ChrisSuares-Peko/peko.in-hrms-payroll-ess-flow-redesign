import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { UserRole } from '@customtypes/general';

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

// PROTOTYPE-SETUP: the app boots as this corporate user with no login and no real token.
// Single source of truth for identity: userSlice derives from it and store.ts re-applies it on rehydration.
export const MOCK_AUTHENTICATED_USER: LoginState = {
    token: '',
    refreshToken: '',
    sessionId: '',
    isAuthenticated: true,
    role: UserRole.CORPORATE,
    id: 1,
    username: 'demo@acmecorp.example',
    roleName: 'corporate',
    redirectUrl: '',
    packageName: 'Prototype',
    acs_user_id: '',
    corporateId: 1,
    subCorporateId: 0,
    subCorporateRole: null,
    activeSubRole: null,
    email: 'demo@acmecorp.example',
    name: 'Acme Corp Pvt Ltd',
    contactPersonName: 'Priya Sharma',
    mobileNo: '9876543210',
    employeeProfileId: null,
    employeeName: null,
    employeeEmail: null,
    employeeMobile: null,
    serviceMemberships: null,
    showPrivacyPolicyModal: false,
};

const initialState: LoginState = MOCK_AUTHENTICATED_USER;

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
