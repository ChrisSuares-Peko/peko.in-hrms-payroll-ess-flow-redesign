import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface SalaryHistoryDetailPayload {
    userType: string;
    userId: string | number;
    month: number;
    year: number;
    page?: number;
    limit?: number;
}

export interface OneTimePayment {
    amount: number;
    paymentStatus: string;
    referenceId: string | null;
    decentroTxnId: string | null;
    remark: string | null;
    initiatedAt: string | null;
    completedAt: string | null;
    failedAt: string | null;
}

export interface SalaryHistoryDetailItem {
    empId: string;
    name: string;
    email: string;
    accountDetail: string;
    transType: string;
    grossSalary: number;
    deduction: number;
    netPayable: number;
    paymentStatus: string;
    remark: string;
    oneTimePayments: OneTimePayment[];
}

export interface SalaryHistoryDetailSummary {
    totalProcessed: number;
    totalEmployees: number;
    totalPaid: number;
}

export interface SalaryHistoryDetailApiResponse {
    rows: SalaryHistoryDetailItem[];
    count: number;
    summary: SalaryHistoryDetailSummary;
}

export const downloadPayrollHistoryReport = async (corporateId: string | number, month: number, year: number): Promise<boolean> => {
    try {
        const res: { data: { buffer: string; filename: string; fileType: string } } = await ApiClient.get(
            `corporate/${corporateId}/payroll/salary-history/report/simple`,
            { params: { month, year } }
        );
        const { buffer, filename, fileType } = res.data;
        const byteArray = Uint8Array.from(atob(buffer), c => c.charCodeAt(0));
        const blob = new Blob([byteArray], { type: fileType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        return false;
    }
};

export const downloadSalaryHistoryReport = async (corporateId: string | number, month: number, year: number): Promise<boolean> => {
    try {
        const res: { data: { buffer: string; filename: string; fileType: string } } = await ApiClient.get(
            `corporate/${corporateId}/payroll/salary-history/report`,
            { params: { month, year } }
        );
        const { buffer, filename, fileType } = res.data;
        const byteArray = Uint8Array.from(atob(buffer), c => c.charCodeAt(0));
        const blob = new Blob([byteArray], { type: fileType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        return false;
    }
};

export const getSalaryHistoryDetail = async (payload: SalaryHistoryDetailPayload) => {
    try {
        const { userType, userId, month, year, page = 1, limit = 10 } = payload;
        const res: SuccessGenericResponse<SalaryHistoryDetailApiResponse> = await ApiClient.get(
            `${userType}/${userId}/payroll/salary-history/detail`,
            { params: { month, year, page, limit } }
        );
        return res.data;
    } catch (error) {
        return false;
    }
};
