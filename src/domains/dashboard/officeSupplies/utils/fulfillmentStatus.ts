import { OndcOrderFulfillment } from '../types/ondcOrderHistory';

/** The fulfillment that drives the status stepper and tracking card — the
 *  shipment ("Delivery") leg, not a Return/Cancel/RTO leg. Assumes one Delivery
 *  fulfillment per confirmed order row (true for today's single-seller-group
 *  checkout); a split multi-shipment order is a known follow-up, not solved
 *  here. */
export const getDeliveryFulfillment = (fulfillments: OndcOrderFulfillment[] | null | undefined) =>
    fulfillments?.find(f => f.type === 'Delivery');

/**
 * Maps the Delivery fulfillment's real ONDC state code
 * (fulfillment.state.descriptor.code) to the 0-based index of the Order
 * Details page's 5 fixed status steps it satisfies. `Cancelled` is handled
 * separately as a terminal state rather than slotted into the linear
 * progression. Unrecognized/future codes fall back to "no further progress
 * known" (index 0) instead of guessing.
 */
export const FULFILLMENT_STATE_STEP_INDEX: Record<string, number> = {
    Pending: 1,
    Packed: 2,
    'Agent-assigned': 2,
    'Out-for-pickup': 2,
    'Pickup-failed': 2,
    'Order-picked-up': 3,
    'In-transit': 3,
    'At-destination-hub': 3,
    'Out-for-delivery': 3,
    'Delivery-failed': 3,
    'Order-delivered': 4,
};

/** Codes that mean the parcel has left the seller (cancel no longer allowed). */
export const SHIPPED_OR_BEYOND_CODES = new Set([
    'Order-picked-up',
    'In-transit',
    'At-destination-hub',
    'Out-for-delivery',
    'Delivery-failed',
    'Order-delivered',
]);

/**
 * True while the Delivery fulfillment is still pre-pickup (or has no code yet).
 * Used to gate Cancel on Order Details.
 */
export const isCancellableBeforeShipping = (
    fulfillments: OndcOrderFulfillment[] | null | undefined,
    opts?: { deliveredAt?: string | null; orderState?: string | null }
) => {
    if (opts?.deliveredAt) return false;
    if (opts?.orderState === 'Completed') return false;
    const code = getDeliveryFulfillment(fulfillments)?.state?.descriptor?.code;
    if (!code) return true;
    return !SHIPPED_OR_BEYOND_CODES.has(code);
};

const RETURN_IN_FLIGHT = new Set([
    'Return_Requested',
    'Return_Initiated',
    'Return_Approved',
    'Return_Picked',
    'Return_Pick_Failed',
    'Return_Delivered',
    'Liquidated',
    'Returned',
]);

/** Return finished, goods back with the seller. */
const RETURN_SETTLED = new Set(['Liquidated', 'Returned']);
/** Terminal failures — mirrors RETURN_FAILED_CODES in purchase/utils/ondcReturnEligibility.js. */
const RETURN_FAILED = new Set(['Return_Rejected', 'Return_Failed']);

/**
 * Pill style + label for an order's `returnStatus`, in the same palette as the
 * order-state and fulfilment pills (OndcStatusTag). Null when the order has no
 * return, so a caller can render its own placeholder.
 *
 * Note the underscored codes are the raw ONDC vocabulary — displayed with the
 * underscores spaced out, matching how buyer Order Details already shows them.
 */
export const getReturnStatusTagStyle = (code?: string | null) => {
    if (!code) return null;
    const label = code.replace(/_/g, ' ');
    if (RETURN_SETTLED.has(code)) return { bg: '#ecfdf3', color: '#027a48', label };
    if (RETURN_FAILED.has(code)) return { bg: '#fef2f2', color: '#ef4444', label };
    if (RETURN_IN_FLIGHT.has(code)) return { bg: '#fffbeb', color: '#f59e0b', label };
    return { bg: '#f5f5f5', color: '#595959', label };
};

const parseIsoDurationMs = (iso?: string | null): number | null => {
    if (!iso || typeof iso !== 'string') return null;
    const m = iso.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
    if (!m || (!m[1] && !m[2] && !m[3] && !m[4])) return null;
    const d = Number(m[1] || 0);
    const h = Number(m[2] || 0);
    const mi = Number(m[3] || 0);
    const sec = Number(m[4] || 0);
    return ((d * 24 + h) * 60 + mi) * 60000 + sec * 1000;
};

/** Gate Return CTA on Order Details — delivered + returnable + window open. */
export const isReturnableAfterDelivery = (opts: {
    orderState?: string | null;
    deliveredAt?: string | null;
    fulfillments?: OndcOrderFulfillment[] | null;
    items?: Array<{ returnable?: boolean | null; returnWindow?: string | null }>;
    returnStatus?: string | null;
    returnWindow?: string | null;
    now?: Date;
}) => {
    if (opts.orderState === 'Cancelled' || opts.orderState === 'Returned') return false;
    if (opts.returnStatus && RETURN_IN_FLIGHT.has(opts.returnStatus)) return false;

    const delivered =
        Boolean(opts.deliveredAt) ||
        opts.orderState === 'Completed' ||
        getDeliveryFulfillment(opts.fulfillments)?.state?.descriptor?.code === 'Order-delivered';
    if (!delivered) return false;

    const items = opts.items || [];
    if (items.length && items.every(i => i.returnable === false)) return false;

    const deliveredAt = opts.deliveredAt ? new Date(opts.deliveredAt) : null;
    if (deliveredAt && !Number.isNaN(deliveredAt.getTime())) {
        const windows = [
            opts.returnWindow,
            ...items.map(i => i.returnWindow),
        ].filter(Boolean) as string[];
        const msList = windows.map(parseIsoDurationMs).filter((n): n is number => n != null);
        const windowMs = msList.length ? Math.max(...msList) : parseIsoDurationMs('P2D') || 0;
        if (windowMs > 0 && (opts.now || new Date()).getTime() > deliveredAt.getTime() + windowMs) {
            return false;
        }
    }
    return true;
};

/** Friendly label for a fulfillment state code — shared by the Order Details
 *  page's tracking card and the Order History list's Status column. Unknown
 *  codes are humanized rather than hidden. */
const FULFILLMENT_STATE_LABELS: Record<string, string> = {
    Pending: 'Order confirmed',
    Packed: 'Packed by seller',
    'Agent-assigned': 'Delivery agent assigned',
    'Out-for-pickup': 'Out for pickup',
    'Pickup-failed': 'Pickup attempt failed',
    'Order-picked-up': 'Picked up',
    'In-transit': 'In transit',
    'At-destination-hub': 'Reached destination hub',
    'Out-for-delivery': 'Out for delivery',
    'Delivery-failed': 'Delivery attempt failed',
    'Order-delivered': 'Delivered',
    Cancelled: 'Cancelled',
    Return_Initiated: 'Return initiated',
    Return_Approved: 'Return approved',
    Return_Picked: 'Return picked up',
    Return_Delivered: 'Return delivered',
    Liquidated: 'Return completed',
    Return_Rejected: 'Return rejected',
};

const ORDER_STATE_LABELS: Record<string, string> = {
    Created: 'Order created',
    Accepted: 'Order confirmed',
    'In-progress': 'In progress',
    Completed: 'Delivered',
    Cancelled: 'Cancelled',
    Returned: 'Returned',
};

export const formatFulfillmentStateLabel = (code?: string) =>
    code ? (FULFILLMENT_STATE_LABELS[code] ?? code.replace(/[-_]/g, ' ')) : 'Not available yet';

export const formatOrderStateLabel = (code?: string) =>
    code ? (ORDER_STATE_LABELS[code] ?? code.replace(/-/g, ' ')) : 'Not available yet';

export const formatStatusHistoryLabel = (entry?: { kind?: string; code?: string } | null) => {
    if (!entry?.code) return 'Not available yet';
    if (entry.kind === 'order') return formatOrderStateLabel(entry.code);
    return formatFulfillmentStateLabel(entry.code);
};

/** Tag colors per status step, reusing the exact palette OndcStatusTag already
 *  uses for the order-level states so both tags read as one system. */
const FULFILLMENT_STATE_STEP_STYLE: Record<number, { bg: string; color: string }> = {
    0: { bg: '#f5f5f5', color: '#595959' },
    1: { bg: '#f5f6ff', color: '#3b48d5' },
    2: { bg: '#fffbeb', color: '#f59e0b' },
    3: { bg: '#f5f3ff', color: '#7c3aed' },
    4: { bg: '#ecfdf3', color: '#027a48' },
};

const CANCELLED_STYLE = { bg: '#fef2f2', color: '#ef4444' };

/** Tag color for a fulfillment state code, bucketed by its status step. */
export const getFulfillmentStatusStyle = (code?: string): { bg: string; color: string } => {
    if (code === 'Cancelled') return CANCELLED_STYLE;
    const step = code ? (FULFILLMENT_STATE_STEP_INDEX[code] ?? 0) : 0;
    return FULFILLMENT_STATE_STEP_STYLE[step];
};
