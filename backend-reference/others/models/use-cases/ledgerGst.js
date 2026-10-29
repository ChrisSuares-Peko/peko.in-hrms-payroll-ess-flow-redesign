const { getASetting } = require("./setting");

const GST_RATE_SETTING = "taxRate";
const DEFAULT_GST_RATE = 18;

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const isPresent = value => value !== undefined && value !== null && value !== "";

const loadGstRate = async () => {
    const details = await getASetting(GST_RATE_SETTING);
    const rate = details && Number(details.gst);
    return rate > 0 ? rate : DEFAULT_GST_RATE;
};

const isInclusive = value => !(value === false || value === 0 || value === "0" || value === "false");

const splitEntryAmount = ({ amount, gstInclusive, gstRate }) => {
    const rate = toNumber(gstRate);
    const factor = rate / 100;
    const inclusive = isInclusive(gstInclusive);

    if (inclusive) {
        const total = round2(amount);
        const taxableAmount = round2(total / (1 + factor));
        return {
            amount: total,
            taxableAmount,
            gstAmount: round2(total - taxableAmount),
            gstRate: rate,
            gstInclusive: true,
        };
    }

    const taxableAmount = round2(amount);
    const gstAmount = round2(taxableAmount * factor);
    return {
        amount: round2(taxableAmount + gstAmount),
        taxableAmount,
        gstAmount,
        gstRate: rate,
        gstInclusive: false,
    };
};

const gstPartsOf = (row, fallbackRate) => {
    if (row && isPresent(row.gstAmount) && isPresent(row.taxableAmount)) {
        return {
            amount: round2(row.amount),
            taxableAmount: round2(row.taxableAmount),
            gstAmount: round2(row.gstAmount),
            gstRate: isPresent(row.gstRate) ? toNumber(row.gstRate) : toNumber(fallbackRate),
            gstInclusive: isInclusive(row.gstInclusive),
            stored: true,
        };
    }
    const split = splitEntryAmount({
        amount: Math.abs(toNumber(row && row.amount)),
        gstInclusive: true,
        gstRate: fallbackRate,
    });
    return { ...split, stored: false };
};

const gstFieldsOf = row => ({
    gstInclusive: row ? isInclusive(row.gstInclusive) : true,
    gstRate: row && isPresent(row.gstRate) ? toNumber(row.gstRate) : null,
    taxableAmount: row && isPresent(row.taxableAmount) ? round2(row.taxableAmount) : null,
    gstAmount: row && isPresent(row.gstAmount) ? round2(row.gstAmount) : null,
});

module.exports = {
    GST_RATE_SETTING,
    DEFAULT_GST_RATE,
    loadGstRate,
    isInclusive,
    splitEntryAmount,
    gstPartsOf,
    gstFieldsOf,
};
