import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getOperators } from '../../settings/types/serviceOperator';
import {
    ApiResponseWorkspace,
    ApiResponseWorkspacePlans,
    WorkspaceBody,
    WorkspaceID,
    WorkspaceWithoutID,
    updateWorkspaceStatusPayload,
} from '../types/workspace';

export const getWorkspaceData = async (payload: UserPayload & getOperators) => {
    try {
        const resp: SuccessGenericResponse<ApiResponseWorkspace> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/workspaces`,
            {
                params: {
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    sort: payload.sort,
                    sortField: payload.sortField,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & getOperators) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/workspaces/${payload.type}`,
            {
                params: {
                    searchText: payload.searchText,
                    sort: payload.sort,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateWorkspaceStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updateWorkspaceStatusPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/workspaces/update-status/${payload.workspaceId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const putUpdateWorkspace = async ({
    userId,
    userType,
    ...payload
}: UserPayload & WorkspaceBody) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/workspaces/${payload.id}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createWorkspace = async ({
    userId,
    userType,
    ...payload
}: UserPayload & WorkspaceWithoutID) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<WorkspaceBody> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/workspaces`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteWorkspace = async (payload: UserPayload & WorkspaceID) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/workspaces/${payload.workspaceId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getWorkspacePlans = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ApiResponseWorkspacePlans> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/workspaces/plans?q=`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
