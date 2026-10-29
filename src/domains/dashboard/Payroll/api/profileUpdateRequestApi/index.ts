import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export type ProfileUpdateRequestStatus = 'requestedByEmployee' | 'approved' | 'rejected';
export type ProfileUpdateRequestType = 'profileDetails' | 'bankDetails';

export interface ProfileUpdateRequestItem {
    id: string;
    type: ProfileUpdateRequestType;
    typeLabel: string;
    status: ProfileUpdateRequestStatus;
    requestedData: Record<string, string | number | null>;
    currentData: Record<string, string | number | null>;
    remarks?: string;
    employee?: {
        id?: string;
        fullName?: string;
        employeeId?: string;
        designation?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface ProfileUpdateRequestsListResponse {
    records: ProfileUpdateRequestItem[];
    total: number;
    pendingCount: number;
    page: number;
    limit: number;
}

interface ListPayload {
    userType: string;
    userId: number;
    page: number;
    limit: number;
    status?: string;
    type?: string;
    searchText?: string;
}

interface ActionPayload {
    userType: string;
    userId: number;
    requestId: string;
    remarks?: string;
}

const base = (userType: string, userId: number) => `/${userType}/${userId}/payroll/profile-update-requests`;

export const getProfileUpdateRequests = async (payload: ListPayload) => {
    try {
        const params = new URLSearchParams({
            page: String(payload.page),
            limit: String(payload.limit),
            ...(payload.status ? { status: payload.status } : {}),
            ...(payload.type ? { type: payload.type } : {}),
            ...(payload.searchText ? { searchText: payload.searchText } : {}),
        });
        const resp: SuccessGenericResponse<ProfileUpdateRequestsListResponse> = await ApiClient.get(
            `${base(payload.userType, payload.userId)}?${params.toString()}`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const approveProfileUpdateRequest = async ({ userType, userId, requestId, remarks }: ActionPayload) => {
    try {
        const resp: SuccessGenericResponse<ProfileUpdateRequestItem> = await ApiClient.patch(
            `${base(userType, userId)}/${requestId}/approve`,
            { remarks }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const rejectProfileUpdateRequest = async ({ userType, userId, requestId, remarks }: ActionPayload) => {
    try {
        const resp: SuccessGenericResponse<ProfileUpdateRequestItem> = await ApiClient.patch(
            `${base(userType, userId)}/${requestId}/reject`,
            { remarks }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
