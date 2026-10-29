import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface OnboardingScope {
    userType: string;
    userId: number;
}

export interface RequiredOnboardingDocument {
    key: string;
    label: string;
}

export interface EmployeeDocumentUpload {
    key: string;
    name: string;
    url: { base64: string; format: string };
    expiryDate?: string;
}

export interface OnboardingBankPayload {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId?: string;
}

export interface OnboardingEmergencyPayload {
    emergencyContactName: string;
    emergencyContactNo: string;
    emergencyContactRelation?: string;
}

export interface EmployeeDepartment {
    id?: string;
    departmentName?: string;
    departmentCode?: string;
}

export interface EmployeeInformation {
    employeeId?: string;
    designation?: string;
    department?: EmployeeDepartment | string;
    reportingStaff?: string;
    reportingStaffName?: string;
    dateOfJoin?: string;
    employeeStatus?: string;
    workEmailId?: string;
    timeSchedule?: string;
}

export interface EmployeeBankDetails {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
}

export interface EmployeeProfile {
    id?: string;
    isCompleted?: boolean;
    profileImage?: string;
    personalInformation?: {
        fullName?: string;
        mobileNo?: string;
        email?: string;
        addressLine1?: string;
        addressLine2?: string;
        state?: string;
        country?: string;
        pinCode?: string;
        emergencyContactName?: string;
        emergencyContactNo?: string;
        emergencyContactRelation?: string;
    };
    employeeInformation?: EmployeeInformation;
    corporateUser?: { companyName?: string };
    bankDetails?: EmployeeBankDetails | null;
    profileUpdateRequestPending?: boolean;
    bankUpdateRequestPending?: boolean;
    employeeDocuments?: {
        _id?: string;
        key?: string;
        name: string;
        url: string;
        expiryDate?: string;
        holderName?: string;
    }[];
    [key: string]: unknown;
}

const base = ({ userType, userId }: OnboardingScope) => `${userType}/${userId}/payroll`;

export const getEmployeeProfile = async (scope: OnboardingScope) => {
    const resp: SuccessGenericResponse<{ employee: EmployeeProfile }> = await ApiClient.get(
        `${base(scope)}/user-profile/profile`
    );
    return resp.data.employee;
};

export const getRequiredOnboardingDocuments = async (scope: OnboardingScope) => {
    const resp: SuccessGenericResponse<{ requiredDocuments: RequiredOnboardingDocument[] }> =
        await ApiClient.get(`${base(scope)}/onboarding/required-documents`);
    return resp.data.requiredDocuments;
};

export const submitOnboardingDocuments = async (
    scope: OnboardingScope,
    employeeDocuments: EmployeeDocumentUpload[]
) => {
    const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
        `${base(scope)}/onboarding/documents`,
        { employeeDocuments }
    );
    return resp.data;
};

export const submitOnboardingBank = async (scope: OnboardingScope, body: OnboardingBankPayload) => {
    const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
        `${base(scope)}/onboarding/bank`,
        body
    );
    return resp.data;
};

export const submitOnboardingEmergency = async (
    scope: OnboardingScope,
    body: OnboardingEmergencyPayload
) => {
    const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
        `${base(scope)}/onboarding/emergency`,
        body
    );
    return resp.data;
};
