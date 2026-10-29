const asyncHandler = require('./../../middlewares/async');
const ondcCheckoutConfirms = require('./../entities/ondc_checkout_confirm');
const ondcConfirmAttempts = require('./../entities/ondc_confirm_attempt');

/**
 * Checkout-level rows of the confirm-after-payment flow — see
 * models/entities/ondc_checkout_confirm.js and services/ondcConfirmAfterPayment.js.
 * paymentGateway creates these rows when it sends /confirm; purchase settles them.
 *
 * Every function rejects on a DB failure (asyncHandler's `.catch(next)` gets no
 * `next` here, so the rejection propagates to the caller).
 */

exports.findCheckoutConfirm = asyncHandler(async ({ paymentRef }) => {
    if (!paymentRef) return null;
    return await ondcCheckoutConfirms.findOne({
        where: { paymentRef: String(paymentRef) },
        raw: true,
    });
});

/**
 * Compare-and-set: apply `patch` only while the row still matches `where`.
 * Returns true when THIS call won.
 */
exports.updateCheckoutConfirmIf = asyncHandler(async ({ id, where = {}, patch }) => {
    if (!id || !patch) return false;
    const [affected] = await ondcCheckoutConfirms.update(patch, { where: { ...where, id } });
    return affected > 0;
});

/**
 * The checkout row with all of its attempts, or null when this capture was never
 * recorded by the confirm-after-payment flow (checkouts that predate it).
 *
 * @returns {Promise<{ checkout: Object, attempts: Object[] } | null>}
 */
exports.findCheckoutConfirmSummary = asyncHandler(async (paymentRef) => {
    if (!paymentRef) return null;
    const checkout = await ondcCheckoutConfirms.findOne({
        where: { paymentRef: String(paymentRef) },
        raw: true,
    });
    if (!checkout) return null;
    const attempts = await ondcConfirmAttempts.findAll({
        where: { paymentRef: String(paymentRef) },
        order: [['id', 'ASC']],
        raw: true,
    });
    return { checkout, attempts };
});
