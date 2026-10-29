/**
 * Shared derivations over a seller's ONDC quote, so every screen that shows a
 * price breakdown reconciles to the same total.
 *
 * The backend's `mapQuote` splits the seller's `quote.breakup` into `items`,
 * `deliveryCharge` and `otherCharges` (everything that is neither — packing,
 * tax, misc, discount). Screens that render only items + delivery silently
 * drop `otherCharges`, which is what made the order summary fail to add up:
 *
 *   amountPaid = quote.total + platformFee
 *              = itemsTotal + deliveryCharge + Σ otherCharges + platformFee
 */

/**
 * Structural shape so this works for both the customer `ValidatedGroupQuote`
 * (types/cartTypes.ts) and the all-optional admin `AdminOrderQuote`.
 */
type QuoteLike =
    | {
          total?: number;
          deliveryCharge?: number;
          otherCharges?: { title?: string; type?: string; amount: number }[];
      }
    | null
    | undefined;

export type QuoteChargeRow = { label: string; amount: number };

/** The /select result parked in redux by Order summary's step 1. */
type ValidationLike = { anyValidated?: boolean; validatedTotal?: number } | null | undefined;

/**
 * Whether the parked /select result is a quote the buyer can actually pay against.
 *
 * A group can come back "validated" (fulfillment serviceable) yet still carry no
 * real price if the seller's on_select response was incomplete, so a non-zero
 * total is part of the test — the presence of `validation` alone is not enough.
 *
 * Shared so the Order summary CTA ("Ship to this address" vs "Pay Now") and the Delivery
 * details card (editable form vs collapsed "Delivering to …" summary) can never
 * disagree about which step of checkout the buyer is on.
 */
export const isQuoteValidated = (validation: ValidationLike): boolean =>
    Boolean(validation && validation.anyValidated && Number(validation.validatedTotal) > 0);

/**
 * Seller charge rows that are neither items nor delivery (packing / tax /
 * misc / discount). Zero-amount rows are dropped — sellers routinely send ₹0
 * placeholder lines. Labelled with the seller's own title, matching the
 * checkout payment summary (hooks/useForm.ts).
 */
export const getOtherChargeRows = (quote: QuoteLike): QuoteChargeRow[] =>
    (quote?.otherCharges || [])
        .filter(c => Number(c.amount) !== 0)
        .map(c => ({
            label: c.title || c.type || 'Other charges',
            amount: Number(c.amount),
        }));

/** Items-only subtotal: the seller's quote total less delivery and every other charge. */
export const getItemsTotal = (quote: QuoteLike, fallback = 0): number =>
    quote?.total != null
        ? quote.total -
          (quote.deliveryCharge || 0) -
          (quote.otherCharges || []).reduce((sum, c) => sum + Number(c.amount), 0)
        : fallback;

const round2 = (n: number) => parseFloat(n.toFixed(2));

export type ValidatedSummary = {
    itemsTotal: number;
    shipping: number;
    otherCharges: QuoteChargeRow[];
    total: number;
};

type QuoteGroupLike = { status?: string; quote?: QuoteLike };

/**
 * Cart-wide order summary from /select quotes. Total Shipping is the sellers'
 * deliveryCharge sum (not the legacy cart 15/free-shipping rule). Total is
 * `validatedTotal` when provided, else the sum of quote.total.
 */
export const getValidatedSummary = (
    groups: QuoteGroupLike[] | null | undefined,
    validatedTotal?: number
): ValidatedSummary => {
    const validated = (groups || []).filter(g => g.status === 'validated' && g.quote);
    const { itemsTotal, shipping, quotedTotal, otherByLabel } = validated.reduce(
        (acc, group) => {
            const quote = group.quote as NonNullable<QuoteLike>;
            const mergedCharges = getOtherChargeRows(quote).reduce(
                (byLabel, row) => ({
                    ...byLabel,
                    [row.label]: (byLabel[row.label] || 0) + row.amount,
                }),
                acc.otherByLabel
            );

            return {
                itemsTotal: acc.itemsTotal + getItemsTotal(quote),
                shipping: acc.shipping + (Number(quote.deliveryCharge) || 0),
                quotedTotal: acc.quotedTotal + (Number(quote.total) || 0),
                otherByLabel: mergedCharges,
            };
        },
        {
            itemsTotal: 0,
            shipping: 0,
            quotedTotal: 0,
            otherByLabel: {} as Record<string, number>,
        }
    );

    const total = Number(validatedTotal) > 0 ? Number(validatedTotal) : quotedTotal;
    return {
        itemsTotal: round2(itemsTotal),
        shipping: round2(shipping),
        otherCharges: Object.entries(otherByLabel).map(([label, amount]) => ({
            label,
            amount: round2(amount),
        })),
        total: round2(total),
    };
};
