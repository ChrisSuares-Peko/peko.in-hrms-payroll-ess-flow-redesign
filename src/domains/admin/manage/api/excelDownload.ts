import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { DownloadExcelResponse } from '../types/common';

export const getExcelLink = async (payload: UserPayload & { apiPath: string }) => {
    try {
        const resp: SuccessGenericResponse<DownloadExcelResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}${payload.apiPath}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
