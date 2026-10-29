import { Scope } from '@src/enums/enums';

export type LoginRequest = {
    username: string;
    password: string;
};

export type PasswordPolicy = {
    id?: number;
    level: number;
    minLength: number;
    minPasswordAge: number;
    maxPasswordAge: number;
    minChangeChars: number;
    prohibitPasswordReuse?: boolean;
    prohibitPasswordReuseTimes?: number | null;
    maxInvalidLoginAttempts?: number;
    lockEffectivePeriod?: number;
    lockoutTimespan?: number;
    enableBannedPasswords?: boolean;
    customBannedPasswords?: string;
    preventPersonalDataInPassword?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type LoginResponse = {
    token: string;
    refreshToken: string;
    firebaseToken: string;
    role: string;
    id: number;
    username: string;
    roleName: string;
    email: string;
    sessionId: string;
    packageName: string;
    subCorporateId?: number | null;
    subCorporateRole?: string | null;
    maxPasswordAge?: boolean;
    subCorporateUsername?: string;
    corporateId?: number;
    employeeId?: string;
    userAccessService?: any;
    branding?: string;
};

export type SocialRegisterCompletionPayload = {
    name: string;
    contactPersonName: string;
    mobileNo: string;
    isSocialRegUpdate: true;
    userId: number;
    userType: string;
    otp?: string;
    scope?: string;
};

export type SocialLoginPayload = Partial<LoginResponse> & {
    midPending?: boolean;
    isRegistration?: boolean;
    name?: string;
    contactPersonName?: string;
    mobileNo?: string;
    service?: string;
    oauth_refreshToken?: string;
    sessionUUID?: string;
};

export type PasswordExpryReset = {
    password: string;
    newPassword: string;
    username: string;
};

export type passwordUserData = {
    password: string;
    userName: string;
};

export type RegisterUserState = {
    name?: string;
    contactPersonName?: string;
    phonenumber?: string;
    email?: string;
    state?: string;
    password?: string;
    confirmpassword?: string;
    referralCode?: string;
    accountType?: string;
    signupType?: 'NEW_COMPANY' | 'EXISTING_COMPANY' | 'FREELANCER' | 'COMPLIANCE_HEALTH';
    marketingConsent?: boolean;
    policyIds?: Record<number, boolean>;
};

export type RegistrationRequest = {
    name: string;
    countryCode: number;
    mobileNo: string;
    email: string;
    state?: string;
    contactPersonName: string;
    password: string;
    emailOtp?: string;
    phoneOtp?: string;
    scope: Scope;
    referralCode?: string;
    accountType?: string;
    signupType?: 'NEW_COMPANY' | 'EXISTING_COMPANY' | 'FREELANCER' | 'COMPLIANCE_HEALTH';
    marketingConsent?: boolean;
    policyIds?: Record<number, boolean>;
};

export type ResgistrationResponse = {
    kycStatus: string;
    isActive: boolean;
    isMFA: boolean;
    sendMfaCodeToEmail: boolean;
    sendMfaCodeToPhone: boolean;
    sendMfaCodeToAuthApp: boolean;
    id: number;
    name: string;
    countryCode: string;
    mobileNo: string;
    email: string;
    companyName: string;
    credentialId: number;
    registeredBy: any;
    packageId: number;
    updatedAt: string;
    createdAt: string;
};

export type OtpRequest = {
    name: string;
    mobileNo: string;
    email: string;
    scope: Scope;
    resend: boolean;
    channel?: 'whatsapp';
};
export type EmailOtpVerifyPayload = {
    mobileNo: string;
    email: string;
    emailOtp: string;
};
export type ForgotPasswordRequest = {
    username: string;
};

export type ResetPasswordRequest = {
    password: string;
    token: string;
    username: string;
    isForgot: string;
};

export type ValidateUserRequest = {
    mobileNo: string;
    email: string;
    referralCode?: string;
    name: string;
    contactPersonName: string;
};

export type ValidateUserValues = {
    name: string;
    contactPersonName: string;
    phonenumber: string;
    email: string;
    state: string;
    referralCode?: string;
};

export type OtpResponse = {
    otp: 'string';
};
type CorporateUserData = {
    id: number;
    role: string;
    username: string;
    name: string;
    email: string;
    password: string;
    passwordResetToken: string | null;
    passwordResetExpires: string | null;
    registeredBy: string;
    createdAt: string;
    updatedAt: string;
};

export type ResponseData = {
    data: {
        corporateUserDetails: CorporateUserData;
        emailVerified: boolean;
    };
};

export type EmailVerifyPayload = {
    email: string;
    corpoateId?: string;
};
export type EmailVerifyStatusPayload = {
    token: string | null;
};

export type TokenvalidityRequest = {
    token: string | null;
    username: string | null;
};

export type PanGstPayload = {
    type: 'pan' | 'gst';
    value: string; // PAN number or GST number (based on type)
    contactPersonName: string;
    name: string;
    email: string;
    signupType?: string;
};
