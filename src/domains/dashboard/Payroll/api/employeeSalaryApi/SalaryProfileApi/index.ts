import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    SalaryProfilePayload,
    SalaryProfileResponse,
    downloadSlipPayload,
    downloadSlipResponse,
    emailSlipPayload,
    getSalaryApprovalPayload,
    payrollSlipListingPayload,
    payrollSlipListingResponse,
} from '../../../types/salaryProfileTypes/ProfileTypes';
import { ApproveSalary, ApproveSalaryResponse } from '../../../types/type';

export const employeeSalaryProfile = async (payload: SalaryProfilePayload) => {
    try {
        const res: SuccessGenericResponse<SalaryProfileResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary/profile/${payload.employeeId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const employeePayrollSlipListing = async (payload: payrollSlipListingPayload) => {
    try {
        const res: SuccessGenericResponse<payrollSlipListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary/all-payroll-slips/${payload.eId}`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    year: payload.year,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const downloadPayslip = async (payload: downloadSlipPayload) => {
    try {
        const resp: SuccessGenericResponse<downloadSlipResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary/payroll-slips/download/${payload.salaryId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const downloadPayslipByEmployee = async (payload: {
    userId: number;
    userType: string;
    employeeId: string;
    year: number | string;
    month: number | string;
}) => {
    try {
        const resp: SuccessGenericResponse<downloadSlipResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary/payroll-slips/download/${payload.employeeId}`,
            { params: { year: payload.year, month: payload.month, sendEmail: false } }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const emailPayslip = async (payload: emailSlipPayload) => {
    try {
        const resp: SuccessGenericResponse<boolean> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary/payroll-slips/email/${payload.salaryId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateApproveSalary = async (payload: ApproveSalary) => {
    try {
        const resp: SuccessGenericResponse<ApproveSalaryResponse> = await ApiClient.put(
            `/${payload.userType}/${payload.userId}/payroll/salary/approve-salary`,
            payload
        );

        // return resp;
        return { success: true, data: resp };
    } catch (err) {
        // return false;
        return { success: false, errorMessage: err.response.data.message };
    }
};

export const getApproveSalaryDetails = async (payload: getSalaryApprovalPayload) => {
    try {
        const url = `${payload.userType}/${payload.userId}/payroll/salary/salary-details?month=${payload.month}&year=${payload.year}`;
        const resp: SuccessGenericResponse<boolean> = await ApiClient.get(url);

        return resp;
    } catch (err) {
        console.error('Error fetching salary details', err);
        return false;
    }
};

export const geProcessSalaryExcelDetails = async (payload: getSalaryApprovalPayload) => {
    try {
        const url = `${payload.userType}/${payload.userId}/payroll/salary/statement/excel?month=${payload.month}&year=${payload.year}`;
        const response = await ApiClient.get(url);
        if (response.status && response.data && response.data.buffer && response.data.buffer.data) {
            return new Uint8Array(response.data.buffer.data); // Convert buffer data to Uint8Array
        }
        throw new Error('No valid data received');
    } catch (err) {
        console.error('Error fetching salary details', err);
        return null;
    }
};
