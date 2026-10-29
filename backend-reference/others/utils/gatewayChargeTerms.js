const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const gatewayChargeTermsOf = value => {
    let terms = value;
    if (typeof value === "string") {
        try {
            terms = JSON.parse(value);
        } catch (error) {
            return null;
        }
    }
    if (!terms || typeof terms !== "object") return null;
    return { percentage: toNumber(terms.percentage), fixed: toNumber(terms.fixed) };
};

const gatewayChargeOn = (terms, pgAmount) =>
    terms && toNumber(pgAmount) > 0 ? round2(toNumber(pgAmount) * (terms.percentage / 100) + terms.fixed) : 0;

module.exports = { gatewayChargeTermsOf, gatewayChargeOn };
