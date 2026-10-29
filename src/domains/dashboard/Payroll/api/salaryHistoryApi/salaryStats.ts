import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { SalaryStatsPayload, SalaryStatsResponse } from '../../types/salaryStats';

export const exportSalaryStatsApi = async (
    corporateId: string | number,
    year: string | number
): Promise<{ buffer: { type: 'Buffer'; data: number[] }; fileType: string } | false> => {
    try {
        const res: { data: { buffer: { type: 'Buffer'; data: number[] }; fileType: string } } = await ApiClient.get(
            `corporate/${corporateId}/payroll/salary-history/stats/export`,
            { params: { year } }
        );
        return res.data;
    } catch {
        return false;
    }
};

export const getSalaryStats = async (payload: SalaryStatsPayload): Promise<SalaryStatsResponse | false> => {
    try {
        const res: SuccessGenericResponse<SalaryStatsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary-history/stats`,
            {
                params: {
                    year: payload.year,
                    status: payload.status,
                    page: payload.page,
                    limit: payload.limit,
                    ...(payload.searchText ? { searchText: payload.searchText } : {}),
                },
            }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};
