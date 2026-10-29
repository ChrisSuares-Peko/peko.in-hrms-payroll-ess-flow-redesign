import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { AgingAnalysisResponse, FetchAgingAnalysisPayload } from '../types/aging';

export const fetchAgingAnalysis = async (
    payload: FetchAgingAnalysisPayload
): Promise<AgingAnalysisResponse | false> => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<AgingAnalysisResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/agingAnalysis`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};
