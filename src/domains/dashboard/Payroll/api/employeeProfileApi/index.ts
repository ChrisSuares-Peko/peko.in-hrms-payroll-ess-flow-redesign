import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CreateEmployeeLeaveComponentPayload,
    getBankDetailsPayload,
    getDeductionPayload,
    getEmployeeLeavePolicyPayload,
    getEmployeeSalaryCompPayload,
    getFullEmployeeLeavePolicyPayload,
} from '../../types/employeeprofile/type';
import {
    CreateBankDetailsPayload,
    createDeductionComponentPayload,
    CreateDeductionComponentResponse,
    UpdateBankDetailsPayload,
    updateDeductionComponentPayload,
} from '../../types/employeeprofile/types';

export const getDeduction = async (payload: getDeductionPayload) => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/deduction-component/allDeductions/${payload.eId}`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    year: payload.year,
                    month: payload.month,
                },
            }
        );
        const { data, totalCount, totalDeductions } = resp;

        return { data, totalCount, totalDeductions };
    } catch (err) {
        return false;
    }
};

export const createEmployeeDeductionComponent = async (
    payload: createDeductionComponentPayload & UserPayload
) => {
    try {
        const { userId, userType, eId, ...restPayload } = payload;

        const res: SuccessGenericResponse<CreateDeductionComponentResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/deduction-component/${eId}`,
            restPayload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const updateEmployeeDeductionComponent = async (
    payload: updateDeductionComponentPayload & UserPayload
) => {
    try {
        const { userId, userType, id, ...restPayload } = payload;
        const res: SuccessGenericResponse<CreateDeductionComponentResponse> = await ApiClient.put(
            `${userType}/${userId}/payroll/deduction-component/${id}`,
            restPayload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const deleteEmployeeDeductionComponent = async (payload: UserPayload & { id: string }) => {
    try {
        const { userId, userType } = payload;
        const res: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${userType}/${userId}/payroll/deduction-component/${payload.id}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const createEmployeeBankDetails = async (
    payload: CreateBankDetailsPayload & UserPayload
) => {
    try {
        const { userId, userType, employeeId, ...restPayload } = payload;

        const res: SuccessGenericResponse<CreateDeductionComponentResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/bank-details/${employeeId}`,
            restPayload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getBankDetails = async (payload: getBankDetailsPayload) => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/bank-details/${payload.eId}`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const updateEmployeeBankDetails = async (
    payload: UpdateBankDetailsPayload & UserPayload
) => {
    try {
        const { userId, userType, bankId, ...restPayload } = payload;

        const res: SuccessGenericResponse<CreateDeductionComponentResponse> = await ApiClient.put(
            `${userType}/${userId}/payroll/bank-details/${bankId}`,
            restPayload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const deleteEmployeeBankDetails = async (payload: UserPayload & { id: string }) => {
    try {
        const { userId, userType } = payload;
        const res: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${userType}/${userId}/payroll/bank-details/${payload.id}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getEmployeeLeavePolicies = async (payload: getEmployeeLeavePolicyPayload) => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/leave-component/${payload.employeeId}`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    searchText: payload.searchText,
                },
            }
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const createEmployeeLeaveComponent = async (
    payload: CreateEmployeeLeaveComponentPayload & UserPayload
) => {
    try {
        const { userId, userType, employeeId, ...restPayload } = payload;
        const res = await ApiClient.post(
            `${userType}/${userId}/payroll/leave-component/${employeeId}`,
            restPayload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getFullEmployeeLeavePolicies = async (payload: getFullEmployeeLeavePolicyPayload) => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/leave-component/all/${payload.employeeId}`,
            {
                params: {
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getEmployeeSalaryComp = async (payload: getEmployeeSalaryCompPayload) => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary-component/employeeComponents/${payload.employeeId}`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getStatutoryComponent = async (
    employeeId: string,
    userId: number,
    userType: string
) => {
    try {
        const resp: any = await ApiClient.get(
            `${userType}/${userId}/payroll/employee/statutory/${employeeId}`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const updateStatutorystatus = async (
    employeeId: string,
    userId: number,
    userType: string,
    otherConfigurationsSchema: {
        [key: string]: boolean | string | object;
    }
) => {
    try {
        const res: any = await ApiClient.post(
            `${userType}/${userId}/payroll/employee/statutory/${employeeId}`,
            { otherConfigurationsSchema }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};
