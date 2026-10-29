import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { UserPayload } from '../../accounts/types/SelfTransferTypes';
import { StatusPayload, taxPayload, taxResponse } from '../types/corporateTaxTypes';

export const getCorporateTaxData = async (payload: UserPayload & taxPayload) => {
    try {
        const resp: SuccessGenericResponse<taxResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/corporate-tax-registration/find-all`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.pageSize,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    from: payload.from,
                    to: payload.to,
                },
            }
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & taxPayload) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/corporate-tax-registration/${payload.type}`,
            {
                params: {
                    searchText: payload.searchText,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    from: payload.from,
                    to: payload.to,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateStatus = async (payload: UserPayload & StatusPayload) => {
    let reqbody;
    if (payload.status === 'RE UPLOAD') {
        reqbody = { status: payload.status, remarks: payload.remarks };
    } else if (payload.status === 'COMPLETED') {
        reqbody = { status: payload.status, taxCertificateDoc: payload.corporateTax };
    }
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/corporate-tax-registration/update-status/${payload.registrationId}`,
            reqbody
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
