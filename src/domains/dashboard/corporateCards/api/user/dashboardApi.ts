import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface DashboardSpendCategory {
    category: string;
    amount: number;
}

export interface DashboardDailyPoint {
    date: string;
    amount: number;
}

export interface DashboardCardUtilisation {
    cardIssuanceId: number;
    holder: string | null;
    nameOnCard?: string | null;
    last4: string | null;
    spent: number;
    limit: number;
}

export interface DashboardRecentTransaction {
    id: number;
    merchant: string;
    member: string | null;
    date: string;
    amount: number;
    status: string;
}

export interface DashboardSummaryResponse {
    scope: 'admin' | 'cardholder';
    month: string;
    kpis: {
        activeCards: number;
        spentThisMonth: number;
        transactionCount: number;
        totalCardLimits: number;
        openRequests: number;
        totalCardsIssued?: number;
        verifiedMembers?: { verified: number; total: number };
        pendingKyc?: number;
    };
    spendByCategory: DashboardSpendCategory[];
    dailySpend: { total: number; points: DashboardDailyPoint[] };
    cardUtilisation: DashboardCardUtilisation[];
    recentTransactions?: DashboardRecentTransaction[];
}

export const getDashboardSummary = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<DashboardSummaryResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/dashboard/summary`
        );
        return res;
    } catch {
        return false;
    }
};
