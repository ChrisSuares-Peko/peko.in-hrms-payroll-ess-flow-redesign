exports.formattedDateTime = (datetime) =>
    datetime.toLocaleString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true, // For AM/PM format
    });

exports.formatNumberWithLocalString = (amount, minFraction = 2, maxFraction = 2) => {
    try {
        if (minFraction > maxFraction) maxFraction = minFraction;

        // Remove commas and other non-numeric characters (except for decimal points)
        const sanitizedAmount = String(amount).replace(/,/g, '');

        // Convert sanitized amount to a number
        const number = Number(sanitizedAmount);
        // Check if the conversion resulted in NaN
        // eslint-disable-next-line no-restricted-globals
        if (isNaN(number)) {
            console.error('Invalid number:', sanitizedAmount);
            return amount; // Return an empty string if the amount is not a valid number
        }
        // Format the number with specified fraction digits
        return number.toLocaleString('en-IN', {
            minimumFractionDigits: minFraction,
            maximumFractionDigits: maxFraction,
        });
    } catch (error) {
        console.error('Error occurred while formatting amount:', error);
        return amount; // Return an empty string if an error occurs
    }
};

exports.fixAmountPrecisionError = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
exports.amountPrecision = exports.fixAmountPrecisionError;