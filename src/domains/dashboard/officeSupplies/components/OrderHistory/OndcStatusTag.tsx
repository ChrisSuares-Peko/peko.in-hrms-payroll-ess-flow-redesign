import type { FC } from 'react';

import { Tag } from 'antd';

import { formatFulfillmentStateLabel, getFulfillmentStatusStyle } from '../../utils/fulfillmentStatus';

/**
 * Order-status pill (Figma 2381-27160). Keyed on the real ONDC `order.state`
 * vocabulary (Created | Accepted | In-progress | Completed | Cancelled) now
 * that on_status keeps this live — previously this map only ever needed to
 * match "Created" since nothing else was persisted, which hid a mismatch
 * ('In progress' with a space vs ONDC's hyphenated 'In-progress', and no
 * entries at all for 'Accepted'/'Completed').
 */
export const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    Created: { bg: '#f5f6ff', color: '#3b48d5', label: 'Order created' },
    Accepted: { bg: '#f5f6ff', color: '#3b48d5', label: 'Order confirmed' },
    'In-progress': { bg: '#fffbeb', color: '#f59e0b', label: 'In progress' },
    Completed: { bg: '#ecfdf3', color: '#027a48', label: 'Delivered' },
    Cancelled: { bg: '#fef2f2', color: '#ef4444', label: 'Cancelled' },
    Returned: { bg: '#fff7ed', color: '#c2410c', label: 'Returned' },
};

const FALLBACK = { bg: '#f5f5f5', color: '#595959' };

/** Order-state-only style/label (no fulfillment override) — used where Order
 *  State and Fulfilment render as two separate pills, e.g. the admin All
 *  orders tab, instead of OndcStatusTag's single customer-facing pill. */
export const getOrderStateTagStyle = (status: string) => {
    const style = STATUS_STYLES[status];
    return style ? { bg: style.bg, color: style.color, label: style.label } : { ...FALLBACK, label: status };
};

/**
 * `deliveryStatusCode` (the confirmed order's Delivery fulfillment state, e.g.
 * "Out-for-delivery") takes priority over the coarse order-level `status` —
 * it's a much more useful signal once an order is Accepted, since orderState
 * barely changes after that point. A `Cancelled`/`Returned` order always wins
 * regardless, since that's the more important fact for the buyer to see (the
 * stale Delivery leg would otherwise still read e.g. "Delivered").
 */
const OndcStatusTag: FC<{ status: string; deliveryStatusCode?: string }> = ({ status, deliveryStatusCode }) => {
    if (status !== 'Cancelled' && status !== 'Returned' && deliveryStatusCode) {
        const { bg, color } = getFulfillmentStatusStyle(deliveryStatusCode);
        return (
            <Tag
                style={{
                    background: bg,
                    color,
                    border: 'none',
                    borderRadius: 999,
                    padding: '2px 12px',
                    fontWeight: 500,
                }}
            >
                {formatFulfillmentStateLabel(deliveryStatusCode)}
            </Tag>
        );
    }

    const style = STATUS_STYLES[status];
    const { bg, color } = style || FALLBACK;
    const label = style?.label || status;

    return (
        <Tag
            style={{
                background: bg,
                color,
                border: 'none',
                borderRadius: 999,
                padding: '2px 12px',
                fontWeight: 500,
            }}
        >
            {label}
        </Tag>
    );
};

export default OndcStatusTag;
