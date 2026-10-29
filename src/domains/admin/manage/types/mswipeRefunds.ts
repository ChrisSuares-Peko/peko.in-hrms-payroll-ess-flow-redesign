export type MswipeRefundStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';

export type MswipeRefundStatusOption = {
    status: MswipeRefundStatus;
    name: string;
};

export type MswipeRefundHistoryEntry = {
    status: MswipeRefundStatus;
    at: string;
    by?: number | null;
    remarks?: string;
    refundReference?: string;
};

export type MswipeRefundPaymentDetails = {
    paymentTime: string | null;
    paymentGroup: string | null;
    mid: string | null;
    tid: string | null;
    rrn: string | null;
    reference: string | null;
    paymentType: string | null;
    cardType: string | null;
};

export type MswipeRefund = {
    id: number;
    corporateTxnId: string;
    orderId: number | null;
    paymentGatewayOrderId: number | null;
    status: MswipeRefundStatus;
    statusName: string;
    nextStatuses: MswipeRefundStatusOption[];
    refundAmount: number;
    paidAmount: number | null;
    serviceName: string | null;
    reason: string | null;
    gatewayOrderId: string | null;
    gatewayReference: string | null;
    paymentDetails: MswipeRefundPaymentDetails | null;
    refundReference: string | null;
    remarks: string | null;
    history: MswipeRefundHistoryEntry[];
    createdAt: string;
    updatedAt: string;
    customerName: string | null;
    customerEmail: string | null;
    partnerName: string | null;
};

export type MswipeRefundsResponse = {
    recordsTotal: number;
    recordsFiltered: number;
    rows: MswipeRefund[];
    statuses: MswipeRefundStatusOption[];
};

export type MswipeRefundFilters = {
    page: number;
    itemsPerPage: number;
    searchText: string;
    status?: string;
    partnerId?: string | number;
    from?: string;
    to?: string;
};

export type UpdateMswipeRefundPayload = {
    id: number;
    status: MswipeRefundStatus;
    refundReference?: string;
    remarks?: string;
};
