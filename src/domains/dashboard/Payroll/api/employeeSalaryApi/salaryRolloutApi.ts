import axios from 'axios';

import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    EligibleEmployeeResponse,
    PendingBeneficiaryEmployee,
    PendingVerificationEmployee,
    SalaryBreakupData,
    SalaryBreakupPayload,
    SalaryRolloutListPayload,
    SalaryRolloutListResponse,
    SalaryRolloutPastListResponse,
    UpdateSalaryRolloutEmployeePayload,
} from '../../types/salaryProfileTypes/salaryRolloutTypes';

export const updateSalaryRolloutEmployee = async (payload: UpdateSalaryRolloutEmployeePayload) => {
    try {
        const { userId, userType, employeeId, ...body } = payload;
        const res = await ApiClient.put(
            `${userType}/${userId}/payroll/salary-rollout/employees/${employeeId}`,
            body
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const listSalaryRolloutEmployees = async (payload: SalaryRolloutListPayload) => {
    try {
        const res: SuccessGenericResponse<SalaryRolloutListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary-rollout/employees`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    search: payload.search || undefined,
                    status: 'active',
                },
            }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const listSalaryRolloutPastEmployees = async (payload: SalaryRolloutListPayload) => {
    try {
        const res: SuccessGenericResponse<SalaryRolloutPastListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary-rollout/employees`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    search: payload.search || undefined,
                    status: 'past',
                },
            }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const updatePastEmployeeRemark = async (payload: {
    userId: string;
    userType: string;
    employeeId: string;
    remark: string;
}) => {
    try {
        const res = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payroll/salary-rollout/employees/${payload.employeeId}`,
            { remark: payload.remark }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const verifyBankAccounts = async (payload: {
    userId: string;
    userType: string;
    employeeIds: string[];
}) => {
    try {
        const res = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/beneficiary/bulk-verify-accounts`,
            { employeeIds: payload.employeeIds }
        );
        return res;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
            return error.response.data;
        }
        return { status: false, message: 'Something went wrong. Please try again.' };
    }
};

export const addBeneficiaries = async (payload: {
    userId: string;
    userType: string;
    employeeIds: string[];
}) => {
    try {
        const res = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/salary-rollout/employees/add-beneficiaries`,
            { employeeIds: payload.employeeIds }
        );
        return res;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
            return error.response.data;
        }
        return { status: false, message: 'Something went wrong. Please try again.' };
    }
};

export const listPendingBeneficiaryEmployees = async (payload: { userId: string; userType: string }) => {
    try {
        const res: SuccessGenericResponse<PendingBeneficiaryEmployee[]> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary-rollout/employees/pending-beneficiary`
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const listPendingVerificationEmployees = async (payload: { userId: string; userType: string }) => {
    try {
        const res: SuccessGenericResponse<PendingVerificationEmployee[]> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary-rollout/employees/pending-verification`
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const exportSalaryEmployees = async (payload: {
    userId: string;
    userType: string;
    type: 'active' | 'past';
}) => {
    try {
        const res: SuccessGenericResponse<{
            buffer: { type: string; data: number[] };
            fileType: string;
        }> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary-rollout/employees/export`,
            { params: { type: payload.type } }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

export const getEligibleEmployees = async (corporateId: string | number) => {
    try {
        const res: SuccessGenericResponse<EligibleEmployeeResponse> = await ApiClient.get(
            `corporate/${corporateId}/payroll/salary-rollout/employees/eligible`
        );
        return res.data;
    } catch {
        return false;
    }
};

export const getSalaryBreakup = async (payload: SalaryBreakupPayload) => {
    try {
        const res: SuccessGenericResponse<SalaryBreakupData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary-rollout/employees/${payload.employeeId}/salary-breakup`
        );
        return res.data;
    } catch (error) {
        return false;
    }
};
