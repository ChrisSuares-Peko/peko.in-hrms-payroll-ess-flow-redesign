/** ONDC office-supply cart item (snapshot refreshed by the ondc/cartDetails API). */
export type CartItem = {
    /** ondcProducts listing row id — the update/delete key (null on very old snapshots) */
    productId: number | null;
    /** stable ONDC item id, unchanged across catalog refreshes — the Buy Now
     *  checkout-scope key (null on very old snapshots) */
    ondcProductId: string | null;
    vendorName: string;
    productName: string;
    image: string;
    price: number;
    maxPrice: number;
    productQuantity: number;
    availableQuantity: number;
    /** Seller minimum order quantity — stepping below it removes the item */
    minQuantity?: number | null;
    /** Seller maximum order quantity — caps the stepper together with stock */
    maxQuantity?: number | null;
    totalPrice: number;
    /** false when the listing row is gone or out of stock ("No longer available") */
    available: boolean;
    /** resolved delivery estimate saved at add-to-cart time — null when the seller
     *  couldn't quote / no location was selected (never fabricated) */
    expectedDeliveryDate?: string | null;
    /** raw ONDC TAT duration (e.g. "P1DT1H") saved alongside the date */
    deliveryTat?: string | null;
};

export type CartDetailsPayload = {
    userId: number;
    userType: string;
};

export type CartDetailsResponse = {
    items: CartItem[];
    count: number;
    cartId: number;
    itemsTotalAmount: number;
    allowCheckout: boolean;
    grandTotal: number;
    /** GST included in the item prices (informational) */
    totalGst: number;
    shippingCharge: number;
    freeDelivery: boolean;
    eligibleFreeShipping: number;
    discount?: number;
};

export type AddToCartRequestPayload = {
    userId: number;
    userType: string;
    productQuantity: number;
    productId: number;
    /** delivery estimate to persist on the cart item (from the ONDC estimate call) */
    expectedDeliveryDate?: string | null;
    deliveryTat?: string | null;
};

export type AddToCartRequestResponse = {
    status: 'added' | 'updated';
    newCartProduct: true | 'duplicate';
};

export type DeleteFromCartRequestPayload = {
    userId: number;
    userType: string;
    productId: number;
};
export type DeleteFromCartResponse = {};

export type ClearUnavailableRequestPayload = {
    userId: number;
    userType: string;
};
export type ClearUnavailableResponse = {
    /** how many unavailable items the backend removed */
    removed: number;
};

export type ValidateCartRequestPayload = {
    userId: number;
    userType: string;
    /** delivery pincode (ONDC area_code) — from the selected saved address */
    pincode: string;
    /** optional "lat,lng" from browser geolocation — omitted when unavailable
     *  (backend tries the corporate profile, else quotes from pincode alone) */
    gps?: string;
    /** Buy Now: validate only these cart items. Omitted = the whole cart. */
    ondcProductIds?: string[];
};

/** One "item" row of a seller quote (quote.breakup, title_type "item"). */
export type ValidatedQuoteItem = {
    itemId: string;
    title: string;
    quantity: number | null;
    amount: number;
};

/** One breakup row exactly as the seller returned it (ordered, incl. ₹0 rows). */
export type ValidatedQuoteRow = {
    itemId: string | null;
    /** "item" | "tax" | "delivery" | "packing" | "misc" | ... */
    titleType: string | null;
    /** seller's row title — for item rows this is the variant (e.g. "1 Kg") */
    title: string;
    /** cart product name resolved for item rows, null for charge rows */
    productName: string | null;
    quantity: number | null;
    amount: number;
    currency: string;
};

export type ValidatedGroupQuote = {
    total: number;
    currency: string;
    items: ValidatedQuoteItem[];
    deliveryCharge: number;
    otherCharges: { title: string; type: string; amount: number }[];
    /** exact ordered mirror of the seller's quote.breakup */
    rows: ValidatedQuoteRow[];
    ttl: string | null;
};

/** Per-seller (bppUri + provider) result of the pre-checkout ONDC select. */
export type ValidatedSellerGroup = {
    bppId: string | null;
    bppUri: string | null;
    providerId: string | null;
    vendorName: string;
    cartItems: {
        productId: number | null;
        ondcProductId: string;
        productName: string;
        productQuantity: number;
    }[];
    transactionId?: string;
    status: 'validated' | 'failed';
    reason: string | null;
    quote: ValidatedGroupQuote | null;
    /** raw ONDC TAT duration (e.g. "P1DT1H") if the seller declared one at on_select — null otherwise */
    deliveryTat: string | null;
    /** resolved absolute delivery estimate from deliveryTat — null when the seller hasn't declared TAT yet */
    expectedDeliveryDate: string | null;
    error: unknown;
};

export type ValidateCartResponse = {
    groups: ValidatedSellerGroup[];
    /** sum of the validated groups' quote totals */
    validatedTotal: number;
    allValidated: boolean;
    anyValidated: boolean;
    failedCount: number;
};

export type InitOrderRequestPayload = {
    userId: number;
    userType: string;
    /** billing/delivery pincode (ONDC area_code) */
    pincode: string;
    /** billing contact name */
    name: string;
    /** billing contact phone */
    phone: string;
    /** house/flat + building line of the delivery address */
    addressLine: string;
    /** falls back to the logged-in user's email on the backend */
    email?: string;
    /** optional "lat,lng"; backend falls back to the profile latLng */
    gps?: string;
    /** txn hints from the select validation so init reuses the same session */
    groups?: { bppUri: string | null; providerId: string | null; transactionId?: string }[];
    /** Buy Now: order only these cart items. Omitted = the whole cart. Must match
     *  what validateCart was scoped to — init re-derives its groups from the cart,
     *  it does not take the item set from `groups` above. */
    ondcProductIds?: string[];
};

/** Per-seller result of the ONDC /init fired at Pay time. */
export type InitializedSellerGroup = Omit<ValidatedSellerGroup, 'status'> & {
    status: 'initialized' | 'failed';
    /** on_init `order.payment` passthrough (settlement terms for /confirm) */
    payment: unknown;
};

export type InitOrderResponse = {
    groups: InitializedSellerGroup[];
    /** sum of the initialized groups' quote totals */
    initializedTotal: number;
    allInitialized: boolean;
    anyInitialized: boolean;
    failedCount: number;
};

export type ConfirmOrderRequestPayload = {
    userId: number;
    userType: string;
    /** initialized groups from the init response — identifies the sessions to confirm */
    groups: { bppUri: string | null; providerId: string | null; transactionId?: string }[];
    /** payment gateway reference id (generated server-side if omitted) */
    paymentRef?: string;
};

/** Per-seller result of the ONDC /confirm (order placement). */
export type ConfirmedSellerGroup = Omit<ValidatedSellerGroup, 'status'> & {
    /** `pending` while the seller has not answered /confirm yet (checkout still in progress) */
    status: 'confirmed' | 'failed' | 'pending';
    /** ONDC order state from on_confirm, e.g. "Created" */
    orderState: string | null;
    orderId: string | null;
    /** on_confirm `order.payment` passthrough */
    payment: unknown;
};

/**
 * The refund of what no seller could place, for a checkout that was paid first
 * and confirmed after. `NONE` until the checkout completes (the amount is not known
 * before) and whenever nothing is owed back; `INITIATED` once it is requested from
 * the gateway; `SUCCESS` once the gateway reports it credited; `FAILED` when it
 * could not be requested — the team is alerted and processes it.
 */
export type CheckoutRefund = {
    status: 'NONE' | 'PENDING' | 'INITIATED' | 'SUCCESS' | 'FAILED';
    amount: number;
};

export type ConfirmOrderResponse = {
    groups: ConfirmedSellerGroup[];
    /** sum of the confirmed groups' quote totals */
    confirmedTotal: number;
    /** confirmedTotal + checkout platform fee */
    amountPaidTotal?: number;
    allConfirmed: boolean;
    anyConfirmed: boolean;
    failedCount: number;
    /** ISO timestamp stamped client-side when the confirmation was received —
     *  the Order Placed page shows it (the persisted slice outlives the session) */
    confirmedAt?: string;
    /** Cashfree payment reference the order was confirmed against — stamped
     *  client-side from the settled capture so Order Placed can show it */
    paymentRef?: string;
    /**
     * Cashfree Easy Split outcome for this checkout — the SELLERS' payout, not the
     * buyer's payment. `SKIPPED`/`DISABLED` mean there was nothing to settle (no
     * seller had usable bank details, or splitting is off); only `FAILED` means we
     * tried and it didn't work, which is what blocks the buyer's success screen.
     * Optional so an older backend response can't block every order.
     */
    settlement?: {
        status: 'SPLIT' | 'PARTIAL' | 'SKIPPED' | 'DISABLED' | 'FAILED';
        reason?: string;
        message?: string | null;
        splitCount: number;
        splitTotal: number;
        skipped: { seller: string; providerId: string | null; amount: number; reason: string }[];
    };
    /** Refund of the sellers that could not be placed. Absent from older backends. */
    refund?: CheckoutRefund;
};

/**
 * The result of one paid checkout, read back by payment reference.
 *
 * `/cashfree-gateway/complete` orchestrates Easy Split → ONDC confirm server-side,
 * so the post-payment page polls this rather than confirming itself. `PENDING`
 * means that chain is still running (or never started).
 */
export type CheckoutResultResponse = ConfirmOrderResponse & {
    paymentRef: string;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
    /**
     * When the slowest seller's on_confirm window closes (ISO). Past it the server
     * treats that seller as failed and refunds it, so the page polls until shortly
     * after. Absent from older backends and before any seller has been sent /confirm.
     */
    deadlineAt?: string | null;
};

export type updateCartRequestPayload = {
    userId: number;
    userType: string;
    productQuantity: number;
    productId: number;
    operation: string;
};
export type updateFromCartResponse = {
    newCartProduct: {
        newQuantity: number;
    };
};
