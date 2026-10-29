import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { FundingAccountDetails } from '../../utils/types';

export interface WalletResponse {
    balance: number;
    totalCardLimits: number;
    cardCount: number;
    /** Masked funding account (last-4 + IFSC) for the balance card, or null until provisioned. */
    fundingAccount: { maskedAccountNumber: string; ifsc: string } | null;
}

interface FundingAccountApiShape {
    beneficiaryName: string | null;
    accountNumber: string;
    ifsc: string;
    bankName: string | null;
    bankAddress: string | null;
    paymentReference: string | null;
}

/** A row from GET /wallet/top-ups (money-in ledger movements). */
export interface TopUpApiItem {
    id: number;
    date: string;
    reference: string;
    method: string;
    status: string;
    amount: number;
}

interface TopUpsResponse {
    count: number;
    rows: TopUpApiItem[];
}

export const getWallet = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<WalletResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/wallet`
        );
        return res;
    } catch {
        return false;
    }
};

/**
 * Full virtual bank account the corporate transfers into to top up the wallet. Fetched on demand when the
 * "Top up wallet" modal opens. Returns null when the account hasn't been provisioned by the admin yet.
 */
export const getFundingAccount = async (
    userType: string,
    userId: number
): Promise<FundingAccountDetails | null> => {
    try {
        const res: SuccessGenericResponse<{ fundingAccount: FundingAccountApiShape | null }> =
            await ApiClient.get(`${userType}/${userId}/corporate-cards/wallet/funding-account`);
        const fa = res?.data?.fundingAccount;
        if (!fa) return null;
        return {
            beneficiaryName: fa.beneficiaryName ?? '',
            accountNumber: fa.accountNumber ?? '',
            ifscCode: fa.ifsc ?? '',
            bankName: fa.bankName ?? '',
            bankAddress: fa.bankAddress ?? '',
            paymentReference: fa.paymentReference ?? '',
        };
    } catch {
        return null;
    }
};

export const getWalletTopUps = async (
    userType: string,
    userId: number,
    params?: { page?: number; itemsPerPage?: number }
) => {
    try {
        const res: SuccessGenericResponse<TopUpsResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/wallet/top-ups`,
            { params: { page: params?.page ?? 1, itemsPerPage: params?.itemsPerPage ?? 100 } }
        );
        return res;
    } catch {
        return false;
    }
};
