import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export type OnboardingDocument = {
    key: string;
    label: string;
    required: boolean;
};

export type DefaultWorkSchedule = {
    checkInTime: string;
    checkOutTime: string;
};

export const getEssAccess = async () => {
    try {
        const resp: SuccessGenericResponse<{ essAccess: boolean }> = await ApiClient.get(
            `user/ess/access`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateEssAccess = async (essAccess: boolean) => {
    try {
        const resp: SuccessGenericResponse<{ essAccess: boolean }> = await ApiClient.patch(
            `user/ess/access`,
            { essAccess }
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getOnboardingDocuments = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<{ onboardingDocuments: OnboardingDocument[] }> =
            await ApiClient.get(`${userType}/${userId}/payroll/hr-settings/onboarding-documents`);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateOnboardingDocuments = async (
    payload: UserPayload & { onboardingDocuments: { key: string; required: boolean }[] }
) => {
    try {
        const { userId, userType, onboardingDocuments } = payload;
        const resp: SuccessGenericResponse<{ onboardingDocuments: OnboardingDocument[] }> =
            await ApiClient.post(`${userType}/${userId}/payroll/hr-settings/onboarding-documents`, {
                onboardingDocuments,
            });
        return resp;
    } catch (err) {
        return false;
    }
};

export const getGracePeriod = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<{ gracePeriodMinutes: number }> = await ApiClient.get(
            `${userType}/${userId}/payroll/hr-settings/grace-period`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateGracePeriod = async (payload: UserPayload & { gracePeriodMinutes: number }) => {
    try {
        const { userId, userType, gracePeriodMinutes } = payload;
        const resp: SuccessGenericResponse<{ gracePeriodMinutes: number }> = await ApiClient.post(
            `${userType}/${userId}/payroll/hr-settings/grace-period`,
            { gracePeriodMinutes }
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getCheckInOutStatus = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<{ checkInOutEnabled: boolean }> = await ApiClient.get(
            `${userType}/${userId}/payroll/hr-settings/check-in-out`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateCheckInOutStatus = async (
    payload: UserPayload & { checkInOutEnabled: boolean }
) => {
    try {
        const { userId, userType, checkInOutEnabled } = payload;
        const resp: SuccessGenericResponse<{ checkInOutEnabled: boolean }> = await ApiClient.post(
            `${userType}/${userId}/payroll/hr-settings/check-in-out`,
            { checkInOutEnabled }
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getDefaultWorkSchedule = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<{ defaultWorkSchedule: DefaultWorkSchedule }> =
            await ApiClient.get(`${userType}/${userId}/payroll/hr-settings/work-schedule`);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateDefaultWorkSchedule = async (
    payload: UserPayload & DefaultWorkSchedule
) => {
    try {
        const { userId, userType, checkInTime, checkOutTime } = payload;
        const resp: SuccessGenericResponse<{ defaultWorkSchedule: DefaultWorkSchedule }> =
            await ApiClient.post(`${userType}/${userId}/payroll/hr-settings/work-schedule`, {
                checkInTime,
                checkOutTime,
            });
        return resp;
    } catch (err) {
        return false;
    }
};
