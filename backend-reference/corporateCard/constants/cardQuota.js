const QUOTA_STALE_PENDING_HOURS = 24

const NO_PRICE_MESSAGE =
    'Your plan has no physical cards left, and extra cards are not available on it. '
    + 'Upgrade your plan to order more.'

const money = (value) => Number(value || 0).toFixed(2)

const physicalCardMessage = ({ included, used, unitPrice }) => {
    if (!unitPrice) return NO_PRICE_MESSAGE
    const usedUp = included > 0
        ? `You've used all ${included} physical card${included === 1 ? '' : 's'} included in your plan (${used}/${included}).`
        : 'Your plan does not include a free physical card.'
    return `${usedUp} You can order another for INR ${money(unitPrice)} + GST.`
}

module.exports = {
    QUOTA_STALE_PENDING_HOURS,
    NO_PRICE_MESSAGE,
    physicalCardMessage,
}
