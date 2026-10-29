import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface ClosureReasonOption {
    value: string;
    label: string;
}

export interface AccountClosureRequest {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    reason: string;
    reasonLabel: string;
    details: string | null;
    requestedByName: string | null;
    requestedAt: string | null;
    decidedAt: string | null;
    decisionNote: string | null;
}

export interface AccountClosureResponse {
    request: AccountClosureRequest | null;
    reasons: ClosureReasonOption[];
    detailsMin: number;
    detailsMax: number;
}

const closurePath = (userType: string, userId: number) =>
    `${userType}/${userId}/corporate-cards/account-closure`;

export const getAccountClosure = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<AccountClosureResponse> = await ApiClient.get(
            closurePath(userType, userId)
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const submitAccountClosure = async (
    userType: string,
    userId: number,
    payload: { reason: string; details?: string }
) => {
    try {
        const res: SuccessGenericResponse<{ request: AccountClosureRequest }> =
            await ApiClient.post(closurePath(userType, userId), payload);
        return res;
    } catch (error) {
        return false;
    }
};
