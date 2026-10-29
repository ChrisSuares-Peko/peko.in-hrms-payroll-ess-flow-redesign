import { CartItem, InitializedSellerGroup, ValidatedSellerGroup } from '../types/cartTypes';

export const STOCK_UNAVAILABLE_REASON =
    'This item is out of stock or no longer listed by the seller, so it cannot be ordered.';

export type UnavailableCartItem = {
    productId: number | null;
    ondcProductId: string | null;
    productName: string;
    image: string;
    vendorName: string;
    reason: string;
    /** listing gone / out of stock — remove via clearUnavailable */
    stockUnavailable: boolean;
};

type FailedGroup = Pick<
    ValidatedSellerGroup | InitializedSellerGroup,
    'status' | 'reason' | 'error' | 'vendorName' | 'cartItems'
>;

export function sellerErrorMessage(error: unknown): string | null {
    if (!error) return null;
    if (typeof error === 'string' && error.trim()) return error.trim();
    if (typeof error === 'object') {
        const e = error as { message?: unknown; ondcMessage?: unknown; error?: { message?: unknown } };
        const msg = e.message || e.ondcMessage || e.error?.message;
        if (typeof msg === 'string' && msg.trim()) return msg.trim();
    }
    return null;
}

export function reasonLabel(reason: string | null | undefined, error?: unknown): string {
    const sellerMsg = sellerErrorMessage(error);
    switch (reason) {
        case 'not_serviceable':
            return 'The seller cannot deliver this to your pincode.';
        case 'quote_unpriced':
            return 'The seller did not return a price for this item, so it cannot be checked out.';
        case 'missing_seller_data':
            return 'Seller details are missing for this item, so it cannot be checked out.';
        case 'nack':
        case 'error':
            return sellerMsg || 'The seller could not confirm this item.';
        default:
            return sellerMsg || 'The seller could not confirm this item, so it cannot be ordered.';
    }
}

export function fromStockItems(items: CartItem[]): UnavailableCartItem[] {
    return (items || [])
        .filter(item => item && item.available === false)
        .map(item => ({
            productId: item.productId,
            ondcProductId: item.ondcProductId,
            productName: item.productName,
            image: item.image || '',
            vendorName: item.vendorName || 'Seller',
            reason: STOCK_UNAVAILABLE_REASON,
            stockUnavailable: true,
        }));
}

const itemKey = (productId: number | null | undefined, ondcProductId: string | null | undefined) =>
    `${productId ?? ''}|${ondcProductId ?? ''}`;

export function fromFailedGroups(
    groups: FailedGroup[] | undefined,
    cartItems: CartItem[] = []
): UnavailableCartItem[] {
    const byKey = new Map<string, CartItem>();
    cartItems.forEach(item => {
        byKey.set(itemKey(item.productId, item.ondcProductId), item);
        if (item.ondcProductId) byKey.set(`|${item.ondcProductId}`, item);
        if (item.productId != null) byKey.set(`${item.productId}|`, item);
    });

    const failedGroups = (groups || []).filter(group => group.status === 'failed');
    const out: UnavailableCartItem[] = [];
    const seen = new Set<string>();

    const pushRow = (
        group: FailedGroup,
        row: { productId?: number | null; ondcProductId?: string | null; productName?: string }
    ) => {
        const key = itemKey(row.productId, row.ondcProductId);
        if (seen.has(key)) return;
        seen.add(key);
        const cartRow =
            byKey.get(key) ||
            (row.ondcProductId ? byKey.get(`|${row.ondcProductId}`) : undefined) ||
            (row.productId != null ? byKey.get(`${row.productId}|`) : undefined);
        out.push({
            productId: row.productId ?? cartRow?.productId ?? null,
            ondcProductId: row.ondcProductId ?? cartRow?.ondcProductId ?? null,
            productName: row.productName || cartRow?.productName || 'Item',
            image: cartRow?.image || '',
            vendorName: group.vendorName || cartRow?.vendorName || 'Seller',
            reason: reasonLabel(group.reason, group.error),
            stockUnavailable: cartRow?.available === false,
        });
    };

    failedGroups.forEach(group => {
        let source = group.cartItems || [];
        if (!source.length) {
            const byVendor = cartItems.filter(
                item => group.vendorName && item.vendorName === group.vendorName
            );
            source = byVendor.map(item => ({
                productId: item.productId,
                ondcProductId: item.ondcProductId ?? '',
                productName: item.productName,
                productQuantity: item.productQuantity,
            }));
        }
        source.forEach(row => pushRow(group, row));
    });
    return out;
}
