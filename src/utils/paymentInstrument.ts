/**
 * The instrument a gateway payment was actually made with.
 *
 * Orders only record the funding split in `paymentMode` ("PAYMENT GATEWAY" / "WALLET"),
 * so the instrument has to come out of the raw gateway payload in `paymentModeResponse`.
 * Cashfree puts it in `payment_group`; CC Avenue (BBPS bills) sends no such field and
 * uses `order_option_type` (status API) or `payment_mode` (redirect callback) instead.
 */

// CC Avenue option types mapped onto the codes Cashfree sends, so both vendors render
// through the same formatter.
const CCAVENUE_OPTION_CODES: Record<string, string> = {
    OPTCRDC: 'credit_card',
    OPTDBCRD: 'debit_card',
    OPTNBK: 'net_banking',
    OPTUPI: 'upi',
    OPTWLT: 'digital_wallet',
    OPTEMI: 'emi',
    OPTCASHC: 'cash_card',
};

const CCAVENUE_MODE_CODES: Record<string, string> = {
    'credit card': 'credit_card',
    'debit card': 'debit_card',
    'net banking': 'net_banking',
    'unified payments': 'upi',
    upi: 'upi',
    wallet: 'digital_wallet',
    emi: 'emi',
    'cash card': 'cash_card',
};

// A wallet inside the gateway (Paytm, PhonePe) is NOT the Peko wallet — that one is its own
// paymentMode and shows as "Wallet". Labelling the gateway's as "Digital Wallet" keeps the two
// apart and matches what the backend reports already show for the same payment.
const GATEWAY_WALLET_CODES: Record<string, string> = {
    wallet: 'digital_wallet',
    app: 'digital_wallet',
};

export const GENERIC_PAYMENT_MODE = 'PAYMENT GATEWAY';

const ccAvenuePaymentCode = (parsed: { order_option_type?: string; payment_mode?: string }) =>
    CCAVENUE_OPTION_CODES[String(parsed?.order_option_type || '').trim().toUpperCase()] ||
    CCAVENUE_MODE_CODES[String(parsed?.payment_mode || '').trim().toLowerCase()];

/**
 * Resolves the instrument code for an order. Anything that isn't a gateway payment
 * (wallet, etc.) is returned untouched.
 */
export const resolvePaymentModeCode = (
    paymentMode?: string | null,
    paymentModeResponse?: string | null
): string => {
    if (paymentMode !== GENERIC_PAYMENT_MODE) return paymentMode ?? '';

    try {
        const parsed = JSON.parse(paymentModeResponse || '{}');
        const paymentGroup = parsed?.payment_group || ccAvenuePaymentCode(parsed);
        if (!paymentGroup) return GENERIC_PAYMENT_MODE;

        return GATEWAY_WALLET_CODES[paymentGroup.toLowerCase()] || paymentGroup;
    } catch (err) {
        console.error('Error parsing paymentModeResponse:', err);
        return GENERIC_PAYMENT_MODE;
    }
};

/** "credit_card" -> "Credit Card", "upi" -> "UPI". */
export const formatPaymentMode = (str = '') => {
    if (!str) return '';
    const upperWords = ['emi', 'upi'];

    return str
        .toLowerCase()
        .split(/[_\s-]+/)
        .map(word =>
            upperWords.includes(word)
                ? word.toUpperCase()
                : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(' ');
};
