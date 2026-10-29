export type WebhookEvent = {
    id: number;
    eventType: string;
    webhookContext: string;
    webhookSource: string;
    status: 'PENDING' | 'PROCESSED' | 'FAILED';
    retryCount: number;
    vendorSubscriptionId: string | null;
    merchantPaymentId: string | null;
    processingError: string | null;
    lastProcessedAt: string | null;
    createdAt: string;
    payload: Record<string, any>;
};

export type WebhookListResponse = {
    total: number;
    page: number;
    limit: number;
    data: WebhookEvent[];
};

export type WebhookFilters = {
    status?: string;
    webhookContext?: string;
    vendorSubscriptionId?: string;
    fromDate?: string;
    toDate?: string;
    page: number;
    limit: number;
    sortOrder?: 'asc' | 'desc';
};
