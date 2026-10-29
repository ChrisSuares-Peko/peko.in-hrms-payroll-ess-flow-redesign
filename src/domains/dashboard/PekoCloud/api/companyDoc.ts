import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CompanyDocCreatePayload,
    CompanyDocCreateResponse,
    CompanyDocDeletePayload,
    CompanyDocInfoResponse,
    CompanyDocListingPayload,
    CompanyDocListingResponse,
    CompanyDocUpdatePayload,
    userPayload,
} from '../types/companyDoc/index';

export const listCompanyDoc = async (payload: CompanyDocListingPayload) => {
    try {
        const res: SuccessGenericResponse<CompanyDocListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/company-docs`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
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

export const listAllCompanyDocs = async (payload: userPayload) => {
    try {
        const res: SuccessGenericResponse<CompanyDocInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/company-docs/info`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createCompanyDoc = async ({
    userType,
    userId,
    ...payload
}: CompanyDocCreatePayload) => {
    try {
        const res: SuccessGenericResponse<CompanyDocCreateResponse> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/peko-cloud/company-docs`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const updateCompanyDoc = async (payload: CompanyDocUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/company-docs/${payload.docId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteCompanyDoc = async (payload: CompanyDocDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/company-docs/${payload.docId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
