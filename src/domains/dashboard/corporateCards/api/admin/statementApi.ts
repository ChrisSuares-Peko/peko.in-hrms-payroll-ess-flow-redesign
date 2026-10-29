import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

/** One row of GET /account/statement — opening/closing markers + in-month movements with running balance. */
export interface StatementApiRow {
    date: string;
    description: string;
    reference: string;
    type: string;
    direction?: string;
    moneyIn: number | null;
    moneyOut: number | null;
    balance: number;
    kind: 'opening' | 'txn' | 'closing';
}

export interface StatementApiResponse {
    month: string;
    /** Whole-month totals — identical on every page, never a per-page recomputation. */
    summary: {
        openingBalance: number;
        moneyIn: number;
        moneyOut: number;
        closingBalance: number;
    };
    /** In-month movements across the whole month — the pager total. Excludes the opening/closing markers. */
    count: number;
    page: number;
    itemsPerPage: number;
    /** The requested page's movements, plus the opening marker on page 1 and the closing marker on the last. */
    rows: StatementApiRow[];
    truncated: boolean;
}

export const getStatement = async (
    userType: string,
    userId: number,
    month: string,
    page?: number,
    itemsPerPage?: number
) => {
    try {
        const res: SuccessGenericResponse<StatementApiResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/account/statement`,
            {
                params: {
                    month,
                    ...(page ? { page } : {}),
                    ...(itemsPerPage ? { itemsPerPage } : {}),
                },
            }
        );
        return res;
    } catch {
        return false;
    }
};

export const exportStatement = async (userType: string, userId: number, month: string) => {
    try {
        const res: Blob = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/account/statement/export`,
            { params: { month }, responseType: 'blob' }
        );
        return res;
    } catch {
        return false;
    }
};

/** The statement as a print-ready PDF, composed by the backend from the same figures as the table. */
export const downloadStatementPdf = async (userType: string, userId: number, month: string) => {
    try {
        const res: Blob = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/account/statement/pdf`,
            { params: { month }, responseType: 'blob' }
        );
        return res;
    } catch {
        return false;
    }
};
