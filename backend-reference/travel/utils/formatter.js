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

exports.formattedDateOnly = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return formattedDate;
};

exports.formatPriceToCeil = (price) => {
    return Math.ceil(price * 100) / 100;
}

exports.toTitleCase = (str) => {
    try {
        if (!str) throw new Error('Input string is empty or invalid');
        if (str === 'N/A') return str;

        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    } catch (error) {
        console.error(`Error in toTitleCase: ${error.message}`);
        return str; // Return empty string as a fallback
    }
};

exports.customTitlecase = (input) => {
    try {
       const formatted = input.toLowerCase().replace(/_/g, ' ');

        switch (formatted) {
             case 'on request':
                return 'Pending Confirmation';
            case 'cancelled request for refund':
                return 'Cancelled and Refund Requested';
            case 'cancelled and refunded':
                return 'Cancelled and Refunded';
            default:
                return formatted
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
        }
    } catch (error) {
        return input;
    }
};
exports.snakeCaseToSentenceCase = (input) => {
    try {
        const words = input.toLowerCase().split('_');
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    } catch (error) {
        return input;
    }
};

// Mask a phone number for display, keeping the country code and the first/last 2 digits
// e.g. maskPhone('9812345621', '91') -> '+91-98xxxxxx21'. Returns '' when there is nothing to show.
exports.maskPhone = (phone, phoneCode = '') => {
    try {
        const digits = String(phone || '').replace(/\D/g, '');
        if (!digits) return '';
        const codeDigits = String(phoneCode || '').replace(/\D/g, '');
        const prefix = codeDigits ? `+${codeDigits}-` : '';
        if (digits.length <= 4) {
            const visible = digits.slice(-2);
            return `${prefix}${'x'.repeat(Math.max(digits.length - 2, 0))}${visible}`;
        }
        return `${prefix}${digits.slice(0, 2)}${'x'.repeat(digits.length - 4)}${digits.slice(-2)}`;
    } catch (error) {
        return '';
    }
};

// Mask an email for display, keeping the first character of the local part and the full domain
// e.g. maskEmail('john@peko.one') -> 'j****@peko.one'. Returns '' when the value is not an email.
exports.maskEmail = (email) => {
    try {
        const value = String(email || '').trim();
        const at = value.indexOf('@');
        if (at < 1) return '';
        const domain = value.slice(at + 1);
        if (!domain) return '';
        return `${value.charAt(0)}****@${domain}`;
    } catch (error) {
        return '';
    }
};

exports.fixAmountPrecisionError = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
exports.amountPrecision = exports.fixAmountPrecisionError;
