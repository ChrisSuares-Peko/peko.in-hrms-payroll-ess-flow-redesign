// ─── Visa pricing → INR ───────────────────────────────────────────────────────
// VisaOS quotes some products in a foreign currency (e.g. Australia in USD, with components
// originally in AUD), but Peko IN's wallet, payment summary and orders are INR-only — the frontend
// reads these numbers as rupees. So every money field is converted to INR at the search boundary
// using the live rates the scheduler stores in `setting.currencyExchangeRate`
// (`rates[CODE].value` = units of CODE per 1 INR → foreign → INR is amount / value).
// Peko-AE does the same for AED, but with a static env rate.

const BREAKUP_MONEY_FIELDS = [
    'total_tax_amount', 'total_service_fee', 'total_tax_service_fee', 'discount_applied',
    'total_round_off', 'total_value', 'total_taxable_value', 'total_non_taxable_value',
    'total_fx_convenience_fee', 'total_component_value', 'total_govt_fees',
];
// Component cost fields are in `component.currency`; `original_*` fields are in `original_currency`.
const COMPONENT_MONEY_FIELDS = ['fx_cost', 'fx_additional_pax_cost', 'cost', 'additional_pax_cost', 'child_cost', 'fx_child_cost'];
const COMPONENT_ORIGINAL_MONEY_FIELDS = ['original_cost', 'original_child_cost'];
const AGE_GROUP_MONEY_FIELDS = ['Embassy Fees', 'Service Fee', 'Platform Fee', 'Total Tax', 'Total'];

const normalizeCode = (code) => String(code || 'INR').trim().toUpperCase();

// Units of `code` per 1 INR, or null when no usable rate is configured.
function rateFor(code, rates) {
    if (code === 'INR') return 1;
    const rate = Number(rates?.[code]?.value);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
}

// Converts a numeric (or numeric-string, e.g. "0.00") amount; leaves null/blank/non-numeric alone.
// Keeps the original type so string fields stay strings.
function toInr(amount, rate) {
    if (amount === null || amount === undefined || amount === '') return amount;
    const n = Number(amount);
    if (!Number.isFinite(n)) return amount;
    const inr = Math.round((n / rate) * 100) / 100;
    return typeof amount === 'string' ? inr.toFixed(2) : inr;
}

function convertFields(target, fields, rate) {
    fields.forEach((field) => {
        if (field in target) target[field] = toInr(target[field], rate);
    });
}

function isInrProduct(product) {
    if (normalizeCode(product?.base_currency) !== 'INR') return false;
    return (product.breakup?.components || []).every(
        (c) => normalizeCode(c.currency) === 'INR' && normalizeCode(c.original_currency || c.currency) === 'INR'
    );
}

// Returns an INR copy of one vendor visa product, the product itself when it's already INR,
// or null when a required rate is missing (the caller must not show it — charging a USD figure
// as rupees would undercharge ~85x).
function convertVisaProductToInr(product, rates) {
    if (!product || isInrProduct(product)) return product;
    const baseCurrency = normalizeCode(product.base_currency);

    const baseRate = rateFor(baseCurrency, rates);
    if (!baseRate) return null;

    const item = JSON.parse(JSON.stringify(product));
    const originalTotalValue = item.breakup?.total_value ?? null;

    if (item.breakup) {
        convertFields(item.breakup, BREAKUP_MONEY_FIELDS, baseRate);
        for (const component of item.breakup.components || []) {
            const costCurrency = normalizeCode(component.currency || baseCurrency);
            const originalCurrency = normalizeCode(component.original_currency || costCurrency);
            const costRate = rateFor(costCurrency, rates);
            const originalRate = rateFor(originalCurrency, rates);
            if (!costRate || !originalRate) return null;

            convertFields(component, COMPONENT_MONEY_FIELDS, costRate);
            convertFields(component, COMPONENT_ORIGINAL_MONEY_FIELDS, originalRate);
            if (component.currency) component.currency = 'INR';
            if (component.original_currency) component.original_currency = 'INR';
        }
    }

    Object.values(item.age_cost_breakup || {}).forEach((ageGroupFees) => {
        if (ageGroupFees && typeof ageGroupFees === 'object') convertFields(ageGroupFees, AGE_GROUP_MONEY_FIELDS, baseRate);
    });

    item.base_currency = 'INR';
    // Audit trail of the vendor's own quote (the frontend ignores it).
    item.inr_conversion = {
        from_currency: baseCurrency,
        inr_per_unit: Math.round((1 / baseRate) * 1e6) / 1e6,
        original_total_value: originalTotalValue,
    };
    return item;
}

// True when any product needs a rate lookup (lets the caller skip the DB read for INR-only results).
function needsInrConversion(products) {
    return Array.isArray(products) && products.some((p) => p && !isInrProduct(p));
}

module.exports = { convertVisaProductToInr, needsInrConversion };
