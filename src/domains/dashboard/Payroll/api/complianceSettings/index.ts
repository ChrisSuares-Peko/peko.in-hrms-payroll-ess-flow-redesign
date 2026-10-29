import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ComplianceSettingsResponse,
    EpfApplicabilityResponse,
    EpfPayload,
    EsiPayload,
    LabWelfarePayload,
    saveEpfResponse,
    TaxPayload,
    TdsSettingsPayload,
    UpdateComplianceSettingsPayload,
} from '../../types/complianceSettings/complianceSettingsType';

export const saveEpfSettingsApi = async (payload: EpfPayload & UserPayload) => {
    try {
        const { userId, userType, ...epfPayload } = payload;
        const res: SuccessGenericResponse<saveEpfResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/compliance-settings/epf-settings`,
            epfPayload
        );

        return { success: true, data: res };
    } catch (err) {
        return { success: false, errorMessage: err?.response?.data?.message || 'Failed to save EPF settings' };
    }
};

export const getEpfApplicabilityApi = async (payload: UserPayload) => {
    try {
        const res: EpfApplicabilityResponse = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/compliance-settings/epf-applicability`
        );
        return { success: true, data: res.data };
    } catch (err) {
        return { success: false, errorMessage: err?.response?.data?.message || 'Failed to load EPF applicability' };
    }
};

export const updateEpfApplicabilityApi = async (payload: { isApplicable: boolean } & UserPayload) => {
    try {
        const { userId, userType, isApplicable } = payload;
        const res: EpfApplicabilityResponse = await ApiClient.put(
            `${userType}/${userId}/payroll/compliance-settings/epf-applicability`,
            { isApplicable }
        );
        return { success: true, data: res.data, message: res.message };
    } catch (err) {
        return { success: false, errorMessage: err?.response?.data?.message || 'Failed to update EPF applicability' };
    }
};

export const updateEpfEarningsLineApi = async (payload: { showInEarnings: boolean } & UserPayload) => {
    try {
        const { userId, userType, showInEarnings } = payload;
        const res: EpfApplicabilityResponse = await ApiClient.put(
            `${userType}/${userId}/payroll/compliance-settings/epf-earnings-line`,
            { showInEarnings }
        );
        return { success: true, data: res.data, message: res.message };
    } catch (err) {
        return { success: false, errorMessage: err?.response?.data?.message || 'Failed to update the PF earnings setting' };
    }
};

export const saveEsiSettings = async (payload: EsiPayload & UserPayload) => {
    try {
        const { userId, userType, ...esiPayload } = payload;
        const res: SuccessGenericResponse<saveEpfResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/compliance-settings/esi-settings`,
            esiPayload
        );

        return { success: true, data: res };
    } catch (err) {
        return { success: false, errorMessage: err?.response?.data?.message || 'Failed to save ESI settings' };
    }
};

export const saveProfessionalTaxSettingsApi = async (payload: TaxPayload & UserPayload) => {
    try {
        const { userId, userType, ...taxPayload } = payload;
        const res: SuccessGenericResponse<saveEpfResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/compliance-settings/tax-settings`,
            taxPayload
        );

        return { success: true, data: res };
    } catch (err) {
        return { success: false, errorMessage: err?.response?.data?.message || 'Failed to save Professional Tax settings' };
    }
};

export const saveLabWelfareFundApi = async (payload: LabWelfarePayload & UserPayload) => {
    try {
        const { userId, userType, ...labWelfarePayload } = payload;
        const res: SuccessGenericResponse<saveEpfResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/compliance-settings/welfare-settings`,
            labWelfarePayload
        );

        return { success: true, data: res };
    } catch (err) {
        return { success: false, errorMessage: err.response.data.message };
    }
};

export const getComplianceSettingsApi = async (payload: UserPayload) => {
    try {
        const res: SuccessGenericResponse<ComplianceSettingsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/compliance-settings`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const updateComplianceSettingsApi = async (
    payload: UpdateComplianceSettingsPayload & UserPayload
) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payroll/compliance-settings`,
            payload
        );
        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};

export const saveTdsSettingsApi = async (payload: TdsSettingsPayload & UserPayload) => {
    try {
        const { userId, userType, ...tdsSettingsPayload } = payload;
        const res: SuccessGenericResponse<saveEpfResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/compliance-settings/tds`,
            tdsSettingsPayload
        );

        return { success: true, data: res };
    } catch (err) {
        return { success: false, errorMessage: err.response.data.message };
    }
};
