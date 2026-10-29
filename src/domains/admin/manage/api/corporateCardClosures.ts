import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ClosureAppliedResult,
    ClosureRequestsListPayload,
    ClosureRequestsListResponse,
} from '../types/corporateCardClosures';

const base = (userType: string, userId: number) =>
    `${userType}/${userId}/corporate-cards/account-closure-requests`;

export const getClosureRequests = async (payload: UserPayload & ClosureRequestsListPayload) => {
    try {
        const resp: SuccessGenericResponse<ClosureRequestsListResponse> = await ApiClient.get(
            base(payload.userType, payload.userId),
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    ...(payload.status ? { status: payload.status } : {}),
                },
            }
        );
        return { data: resp.data.rows, recordsTotal: resp.data.count };
    } catch {
        return false;
    }
};

export const decideClosureRequest = async (
    userType: string,
    userId: number,
    id: string,
    decision: 'approve' | 'reject',
    decisionNote?: string
) => {
    try {
        const resp: SuccessGenericResponse<{
            requestId: string;
            status: string;
            applied?: ClosureAppliedResult;
        }> = await ApiClient.put(`${base(userType, userId)}/${id}/${decision}`, {
            ...(decisionNote ? { decisionNote } : {}),
        });
        return resp;
    } catch {
        return false;
    }
};
