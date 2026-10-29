import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    TerminationRequestsListPayload,
    TerminationRequestsListResponse,
} from '../types/corporateCardTerminations';

const base = (userType: string, userId: number) =>
    `${userType}/${userId}/corporate-cards/termination-requests`;

export const getTerminationRequests = async (
    payload: UserPayload & TerminationRequestsListPayload
) => {
    try {
        const resp: SuccessGenericResponse<TerminationRequestsListResponse> = await ApiClient.get(
            base(payload.userType, payload.userId),
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    ...(payload.status ? { status: payload.status } : {}),
                },
            }
        );
        // Backend returns { count, rows }; adapt to the table's { data, recordsTotal } shape.
        return { data: resp.data.rows, recordsTotal: resp.data.count };
    } catch {
        return false;
    }
};

// Marks a termination as completed once the external, manual vendor-side closure is done. One-way —
// there is no un-complete/reject action.
export const completeTermination = async (userType: string, userId: number, id: number) => {
    try {
        const resp: SuccessGenericResponse<{ requestId: number; status: string }> =
            await ApiClient.put(`${base(userType, userId)}/${id}/complete`);
        return resp;
    } catch {
        return false;
    }
};
