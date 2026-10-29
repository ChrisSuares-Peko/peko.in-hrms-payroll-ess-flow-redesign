import { UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { WebhookFilters, WebhookListResponse } from '../types/subscriptionWebhook';

export const listWebhookEvents = async (
    payload: UserPayload & WebhookFilters
): Promise<WebhookListResponse | false> => {
    try {
        const resp: any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment-gateway/cashfree-payments/webhooks`,
            {
                params: {
                    status: payload.status,
                    webhookContext: payload.webhookContext,
                    vendorSubscriptionId: payload.vendorSubscriptionId,
                    fromDate: payload.fromDate,
                    toDate: payload.toDate,
                    page: payload.page,
                    limit: payload.limit,
                    sortOrder: payload.sortOrder,
                },
            }
        );
        return resp.data as WebhookListResponse;
    } catch {
        return false;
    }
};

export const retryWebhookEvent = async (
    payload: UserPayload & { webhookId: number }
): Promise<{ status: boolean; message: string; responseCode: string } | false> => {
    try {
        const resp: any = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payment-gateway/cashfree-payments/webhooks/${payload.webhookId}/retry`
        );
        return resp as { status: boolean; message: string; responseCode: string };
    } catch {
        return false;
    }
};

export const clearWebhookEvents = async (
    payload: UserPayload & { status: string; olderThanDays?: number }
): Promise<{ status: boolean; message: string; responseCode: string; data: { deleted: number } } | false> => {
    try {
        const resp = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/payment-gateway/cashfree-payments/webhooks`,
            {
                params: {
                    status: payload.status,
                    ...(payload.olderThanDays ? { olderThanDays: payload.olderThanDays } : {}),
                },
            }
        );
        return resp as unknown as { status: boolean; message: string; responseCode: string; data: { deleted: number } };
    } catch {
        return false;
    }
};
