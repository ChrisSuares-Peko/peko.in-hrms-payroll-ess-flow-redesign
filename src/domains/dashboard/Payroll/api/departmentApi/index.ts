import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    departmentListing,
    createDepartmentSuccess,
    departmentEditPayload,
} from '../../types/departmentTypes/departmentTypes';

export const createDepartmentAPI = async (payload: any) => {
    try {
        const { userType, userId, postData } = payload;
        const resp: SuccessGenericResponse<createDepartmentSuccess> = await ApiClient.post(
            `/${userType}/${userId}/payroll/department`,
            postData
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const editDepartmentAPI = async (payload: departmentEditPayload) => {
    try {
        const resp: SuccessGenericResponse<createDepartmentSuccess> = await ApiClient.put(
            `/${payload.userType}/${payload.userId}/payroll/department/${payload.id}`,
            payload
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const listDepartmentAPI = async (payload: any) => {
    try {
        const { postData, userType, userId } = payload;
        const params = {
            page: postData.page,
            limit: postData.limit,
            searchText: postData.searchKey ?? '',
        };

        const resp: SuccessGenericResponse<departmentListing> = await ApiClient.get(
            `/${userType}/${userId}/payroll/department/`,
            { params }
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
export const listAllDepartmentAPI = async (payload: any) => {
    try {
        const {  userType, userId } = payload;
        const resp: SuccessGenericResponse<departmentListing> = await ApiClient.get(
            `/${userType}/${userId}/payroll/department/?page=${''}&limit=${''}&searchText=${''}`
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const deleteDepartmentAPI = async (payload: any) => {
    try {
        const { departmentId, userType, userId } = payload;
        const resp: SuccessGenericResponse<departmentListing> = await ApiClient.delete(
            `/${userType}/${userId}/payroll/department/${departmentId}`
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
