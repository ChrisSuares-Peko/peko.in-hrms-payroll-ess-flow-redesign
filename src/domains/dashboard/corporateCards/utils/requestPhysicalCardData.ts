/** Static copy + options for the "Request Physical Card" modal. Swap for live data later. */

export const REQUEST_PHYSICAL_CARD_COPY = {
    title: 'Request Physical Card',
    subtitle:
        "The cardholder name is pulled from the member's profile. Review and edit the delivery address before placing the order.",
    nameHelper: 'This name will be the same as your virtual card.',
    reviewHeading: 'Review & Confirm',
    reviewSubtitle: 'Please check the details below before we process your card request.',
    dispatchNote:
        'Your physical card will be dispatched within 2 business days after confirmation.',
    successTitle: 'Card Request Submitted!',
    successMessage:
        "Your physical card request has been placed successfully. You'll receive it in 3–7 business days.",
    pendingTitle: 'Card Order Placed',
    pendingMessage:
        'The order has been placed and is awaiting confirmation from the issuer. The card will show as Pending until then.',
};

/** Fixed delivery details shown on the review step. */
export const DELIVERY_DETAILS = {
    estimatedDelivery: '5–7 Business Days',
};

/** DEMO placeholder — replaced by the real tracking reference from the order response. */
export const TRACKING_REFERENCE = 'PK-2024-08912';
