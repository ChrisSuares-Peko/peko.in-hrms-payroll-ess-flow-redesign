exports.fixAmountPrecisionError = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
exports.amountPrecision = exports.fixAmountPrecisionError;
