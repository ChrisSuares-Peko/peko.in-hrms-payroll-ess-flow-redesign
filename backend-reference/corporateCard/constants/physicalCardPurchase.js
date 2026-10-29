/** Reasons a paid card could not be allocated that a later retry could still resolve. */
const RETRYABLE_REASONS = ['NO_CREDS', 'ISSUE_REFUSED', 'VENDOR_FAIL', 'ENCRYPT', 'NO_CARD_SCHEME']

module.exports = {
    PURCHASE_WEBHOOK_USER: 'paymentgateway',
    RETRYABLE_REASONS,
}
