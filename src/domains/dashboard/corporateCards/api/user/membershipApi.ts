import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export type MembershipRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface MembershipRequest {
    id: string;
    requestId: string;
    status: MembershipRequestStatus;
    requestedAt: string;
    decidedAt: string | null;
    decisionNote: string | null;
}

const base = (userType: string, userId: number) =>
    `${userType}/${userId}/corporate-cards/membership`;

export const getCardOnboardingState = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<{ kybComplete: boolean }> = await ApiClient.get(
            `${base(userType, userId)}/kyb-state`
        );
        return res.data;
    } catch {
        return false;
    }
};

export const getMembershipRequest = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<{ request: MembershipRequest | null }> =
            await ApiClient.get(`${base(userType, userId)}/request`);
        return res.data;
    } catch {
        return false;
    }
};

export const createMembershipRequest = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<{ request: MembershipRequest }> = await ApiClient.post(
            `${base(userType, userId)}/request`,
            {}
        );
        return res.data;
    } catch {
        return false;
    }
};
