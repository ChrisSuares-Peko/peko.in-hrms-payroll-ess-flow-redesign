import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ApprovalDecisionPayload,
    ApprovalDecisionResult,
    ApprovalGate,
    ApprovalPartnersResponse,
    ApprovalReview,
    ApprovalRowsFilters,
    ApprovalRowsResponse,
} from '../types/approvals';

const base = ({ userType, userId }: UserPayload) =>
    `${userType}/${userId}/others/accounting/approvals`;

export const getApprovalPartners = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ApprovalPartnersResponse> = await ApiClient.get(
            `${base(payload)}/partners`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getPartnerApprovals = async (
    payload: UserPayload & { partnerPermissionId: number } & ApprovalRowsFilters
) => {
    try {
        const { userId, userType, partnerPermissionId, status, searchText } = payload;
        const resp: SuccessGenericResponse<ApprovalRowsResponse> = await ApiClient.get(
            `${base({ userId, userType })}/partners/${partnerPermissionId}`,
            { params: { status, searchText: searchText || undefined } }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getApprovalReview = async (
    payload: UserPayload & { partnerPermissionId: number; nodeKey: string }
) => {
    try {
        const { userId, userType, partnerPermissionId, nodeKey } = payload;
        const resp: SuccessGenericResponse<ApprovalReview> = await ApiClient.get(
            `${base({ userId, userType })}/partners/${partnerPermissionId}/node`,
            { params: { nodeKey } }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const decideApprovals = async (payload: UserPayload & ApprovalDecisionPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<ApprovalDecisionResult> = await ApiClient.put(
            `${base({ userId, userType })}/decide`,
            body,
            { headers: { 'x-suppress-error-toast': 'true' } }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getApprovalGate = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ApprovalGate> = await ApiClient.get(
            `${base(payload)}/gate`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const updateApprovalGate = async (payload: UserPayload & { enabled: boolean }) => {
    try {
        const { userId, userType, enabled } = payload;
        const resp: SuccessGenericResponse<ApprovalGate> = await ApiClient.put(
            `${base({ userId, userType })}/gate`,
            { enabled }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
