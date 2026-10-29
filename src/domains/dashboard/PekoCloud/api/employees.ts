import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { userPayload } from '../types/dash';
import {
    EmployeeListingResponse,
    EmployeeListingPayload,
    EmployeeCreatePayload,
    EmployeeCreateResponse,
    EmployeeUpdatePayload,
    employeeDeletePayload,
    GetEmployeesResponse,
    employeeResponse,
    EmployeesinfoResponse,
} from '../types/employeeDetails';

export const employeeList = async (payload: EmployeeListingPayload) => {
    try {
        const res: SuccessGenericResponse<EmployeeListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/employees`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const getEmployees = async (payload: EmployeeListingPayload) => {
    try {
        const res: SuccessGenericResponse<GetEmployeesResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/employees/list`,
            {
                params: {
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createEmployee = async (payload: EmployeeCreatePayload) => {
    try {
        const res: SuccessGenericResponse<EmployeeCreateResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/employees`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const employeeUpdate = async (payload: EmployeeUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/employees/${payload.employeeId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const employeeDelete = async (payload: employeeDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/employees/${payload.employeeId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
export const employeeInfoCard = async (payload: EmployeeListingPayload) => {
    try {
        const res: SuccessGenericResponse<EmployeesinfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/employees/info`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getPayrollEmployees = async (payload: userPayload) => {
    try {
        const resp: SuccessGenericResponse<employeeResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/employee/current-employees?searchText=`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
