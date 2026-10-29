import { ValidatedGroupQuote } from './cartTypes';

/** One row of the ONDC Order History table — one confirmed seller order. */
export interface OndcOrderRow {
    id: number;
    /** ISO timestamp the order was confirmed */
    date: string;
    /** seller/vendor name — null when the BPP never gave us one (render "-") */
    seller: string | null;
    /** comma-joined "Product name × qty" list */
    items: string;
    /** BPP order id, falling back to the transaction id */
    orderId: string;
    amount: number;
    /** real ONDC order state we persist today (e.g. "Created") */
    status: string;
    transactionId: string;
    /** ONDC fulfillment legs (Delivery/Return/Cancel/RTO) — used to derive a
     *  finer-grained delivery status than `status` alone; [] when none persisted yet */
    fulfillments: OndcOrderFulfillment[];
}

export interface OndcOrderHistoryFilters {
    from?: string;
    to?: string;
    search?: string;
    page: number;
    itemsPerPage: number;
}

export interface OndcOrderHistoryRequestPayload extends OndcOrderHistoryFilters {
    userId: number;
    userType: string;
}

export interface OndcOrderHistoryResponse {
    rows: OndcOrderRow[];
    count: number;
}

/** One product line on the Order Details page — derived from quote.rows. */
export interface OndcOrderDetailItem {
    /** ONDC item id (quote breakup @ondc/org/item_id) */
    itemId?: string | null;
    productName: string;
    quantity: number | null;
    price: number;
    /** @ondc/org/returnable, snapshotted at add-to-cart time — null/undefined
     *  on orders placed before this was captured. */
    returnable?: boolean | null;
    /** @ondc/org/cancellable, snapshotted at add-to-cart time — null/undefined
     *  on orders placed before this was captured. */
    cancellable?: boolean | null;
    /** @ondc/org/return_window — ISO-8601 duration, e.g. "P2D" */
    returnWindow?: string | null;
}

/** Buyer billing/delivery address as persisted from the ONDC confirm order. */
export interface OndcOrderBilling {
    name: string;
    address: {
        building?: string;
        locality?: string;
        city?: string;
        state?: string;
        country?: string;
        area_code?: string;
    };
    phone: string;
    email: string;
}

/** One ONDC fulfillment leg of a confirmed order (Delivery/Return/Cancel/RTO).
 *  Captured from on_confirm at order placement time; refreshed from on_status
 *  on later fetches. Fields beyond id/type/state are only as complete as the
 *  seller sends. */
export interface OndcOrderFulfillment {
    id: string;
    type: 'Delivery' | 'Return' | 'Cancel' | 'RTO';
    state: {
        descriptor: {
            code: string;
        };
    };
    start?: {
        location?: {
            gps?: string;
            descriptor?: { name?: string };
            address?: { locality?: string; city?: string; state?: string; area_code?: string };
        };
        /** actual pickup time — only present once pickup has really happened */
        time?: { timestamp?: string; range?: { start?: string; end?: string } };
        contact?: { phone?: string; email?: string };
    };
    end?: {
        location?: {
            gps?: string;
            address?: { locality?: string; city?: string; state?: string; area_code?: string };
        };
        /** actual delivery time — only present once delivery has really happened */
        time?: { timestamp?: string; range?: { start?: string; end?: string } };
        contact?: { phone?: string; email?: string };
    };
    agent?: {
        name: string;
        phone: string;
    };
    tags?: Array<{
        code: string;
        list: Array<{ code: string; value: string }>;
    }>;
}

/** Live shipment tracking snapshot, normalized server-side from ONDC on_track
 *  (+ the Delivery fulfillment's agent/tags). `null` when the seller hasn't
 *  enabled tracking or hasn't responded yet — never a fabricated placeholder. */
export interface OndcOrderTracking {
    url?: string;
    gps?: string;
    status?: 'active' | 'inactive';
    courierName?: string;
    courierPhone?: string;
    updatedAt?: string;
}

export interface OndcOrderStatusHistoryEntry {
    at: string;
    source?: string;
    kind: 'order' | 'fulfillment' | string;
    code: string;
    fulfillmentType?: 'Delivery' | 'Return' | string | null;
}

/** Full detail for one confirmed order — Order Details page (Figma 2390-28297). */
export interface OndcOrderDetail {
    id: number;
    orderId: string | null;
    orderState: string | null;
    transactionId: string;
    /** seller/vendor name — null when the BPP never gave us one (render "-") */
    vendorName: string | null;
    bppId: string | null;
    bppUri: string | null;
    createdAt: string;
    items: OndcOrderDetailItem[];
    quote: ValidatedGroupQuote | null;
    billing: OndcOrderBilling | null;
    paymentRef: string | null;
    paymentStatus: string | null;
    totalAmount: number;
    /** this order's share of the checkout platform fee */
    platformFee: number;
    /** seller quote + allocated platform fee — what the user paid for this order */
    amountPaid: number;
    /** raw ISO-8601 TAT duration from on_confirm (e.g. "P1DT1H"); null on older orders */
    deliveryTat: string | null;
    /** confirmedAt + TAT, resolved server-side; null on older orders */
    expectedDeliveryDate: string | null;
    /** ONDC fulfillment legs (Delivery/Return/Cancel/RTO) — always an array, [] when none persisted yet */
    fulfillments: OndcOrderFulfillment[];
    /** null when no real tracking data is available yet — never a placeholder */
    tracking: OndcOrderTracking | null;
    /** append-only order/fulfillment status flow; [] when nothing recorded yet */
    statusHistory?: OndcOrderStatusHistoryEntry[];
    /** ISO delivery timestamp when known */
    deliveredAt?: string | null;
    /** DigiDukaan return lifecycle status */
    returnStatus?: string | null;
    returnRequestId?: string | null;
    returnReason?: string | null;
    returnedAt?: string | null;
    returnWindow?: string | null;
    returnReasons?: Array<{ id: string; label: string }>;
    /** Seller-issued invoice, once on_status has carried one. A third-party URL. */
    invoiceUrl?: string | null;
}

export interface OndcOrderRefreshResult {
    received: boolean;
    reason?: string | null;
    order: OndcOrderDetail;
}

export interface OndcOrderDetailRequestPayload {
    userId: number;
    userType: string;
    id: string;
}
