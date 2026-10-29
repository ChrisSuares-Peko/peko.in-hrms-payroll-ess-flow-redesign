import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface SalaryHistoryPayload {
    userType: string;
    userId: string | number;
    year: string;
    page: number;
    limit: number;
}

export interface SalaryHistoryItem {
    month: number;
    year: number;
    totalEmployees: number;
    salariesProcessed: number;
    totalPayroll: number;
    salaryStatus: string;
    processedOn: { $date: string };
}

export interface SalaryHistoryApiResponse {
    count: number;
    page: number;
    limit: number;
    rows: SalaryHistoryItem[];
}

export const getSalaryHistory = async (payload: SalaryHistoryPayload) => {
    try {
        const res: SuccessGenericResponse<SalaryHistoryApiResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/salary-history`,
            {
                params: { year: payload.year, page: payload.page, limit: payload.limit },
            }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};
