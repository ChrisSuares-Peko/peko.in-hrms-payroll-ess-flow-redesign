import { ApiClient } from '@src/services/config';

export interface SalarySummaryData {
    currentMonthDue: number;
    lastMonthRolledOut: number;
}

export const getSalarySummary = async (
    corporateId: string | number
): Promise<SalarySummaryData | false> => {
    try {
        const resp: { data: SalarySummaryData } = await ApiClient.get(
            `corporate/${corporateId}/payroll/dashBoard/salary-summary`
        );
        return resp.data;
    } catch {
        return false;
    }
};
