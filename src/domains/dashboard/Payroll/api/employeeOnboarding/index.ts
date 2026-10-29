import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    Employee,
    EmployeeBankInfoData,
    EmployeeDocInfoData,
    EmployeeInfoData,
    EmployeePersonalData,
    EmployeeResponse,
    EmployeeSalaryInfoData,
} from '../../types/employeeOnboarding';

export const getEmployeeListingApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<EmployeeResponse> = await ApiClient.get(
            `${userType}/${userId}/payroll/organization-settings`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        console.error(err, 'error');
        return false;
    }
};
export const getOneEmployee = async (payload: UserPayload & { employeeId: string }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `/${payload.userType}/${payload.userId}/payroll/employee/${payload?.employeeId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const updatePersonalInfo = async (
    payload: EmployeePersonalData & { userId: number; userType: string; employeeId: string }
) => {
    try {
        const { userId, userType, employeeId, ...restPayload } = payload;
        const resp: SuccessGenericResponse<Employee> = await ApiClient.post(
            `${userType}/${userId}/payroll/employee/personal-info?employeeId=${employeeId}`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const updateEmployeeInfo = async (
    payload: EmployeeInfoData & { userId: number; userType: string; employeeId: string }
) => {
    try {
        const { userId, userType, employeeId, ...restPayload } = payload;
        const resp: SuccessGenericResponse<Employee> = await ApiClient.put(
            `${userType}/${userId}/payroll/employee/employee-info/${employeeId}`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const updateSalaryInfo = async (
    payload: EmployeeSalaryInfoData & { userId: number; userType: string; employeeId: string }
) => {
    try {
        const { userId, userType, employeeId, ...restPayload } = payload;
        const resp: SuccessGenericResponse<Employee> = await ApiClient.put(
            `${userType}/${userId}/payroll/employee/salary-info/${employeeId}`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const updateDocumentInfo = async (
    payload: EmployeeDocInfoData & { userId: number; userType: string; employeeId: string }
) => {
    try {
        const { userId, userType, employeeId, ...restPayload } = payload;
        const resp: SuccessGenericResponse<Employee> = await ApiClient.put(
            `${userType}/${userId}/payroll/employee/document-info/${employeeId}`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const updateBankInfo = async (
    payload: EmployeeBankInfoData & { userId: number; userType: string; employeeId: string }
) => {
    try {
        const { userId, userType, employeeId, ...restPayload } = payload;
        const resp: SuccessGenericResponse<Employee> = await ApiClient.put(
            `${userType}/${userId}/payroll/employee/bank-info/${employeeId}`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const createEmployeeInfo = async (payload: any & { userId: number; userType: string }) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/payroll/employee/alldata`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err: any) {
        // No `id`, so callers still treat it as a failure; the message says why (e.g. a duplicate).
        return { errorMessage: err.response?.data?.message as string | undefined };
    }
};

export const getPanVerify = async (payload: UserPayload & { panNumber: string ,employeeId: string }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `/${payload.userType}/${payload.userId}/payroll/employee/${payload.employeeId}/pan`,
            { pan: payload.panNumber }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
}

export const sendAadharOtpEmployee = async (payload: UserPayload & { aadhaarNumber: string ,employeeId: string }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `/${payload.userType}/${payload.userId}/payroll/employee/${payload.employeeId}/aadhaar-otp`,
            { aadhaarNumber: payload.aadhaarNumber }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
}


export const verifyOtp = async (payload: UserPayload & { employeeId: string,otp:string,ref_id:string,aadhaarNumber:string }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `/${payload.userType}/${payload.userId}/payroll/employee/${payload.employeeId}/aadhaar-verify`,
            {otp:payload.otp,ref_id:payload.ref_id,aadhaarNumber:payload.aadhaarNumber }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
}