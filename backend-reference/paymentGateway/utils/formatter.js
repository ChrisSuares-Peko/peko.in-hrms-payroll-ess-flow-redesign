/** DD/MM/YYYY and 12h time in Asia/Kolkata — for transactional emails only. */
exports.formatIndiaEmailDateTime = (date = new Date()) => {
  const tz = 'Asia/Kolkata';
  const datePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
  return `${datePart}, ${timePart.replace(/(am|pm)/gi, s => s.toUpperCase())}`;
};

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

exports.formatString = (text) => {
    if (!text) return '';
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
};

exports.sanitizeString =(input, maxLength = 40)=>{
  let sanitized = input.replace(/\+/g, "plus");

    sanitized = sanitized.replace(/[^a-zA-Z]/g, " ");

    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

exports.filterLettersAndSpaces = (str) => {
  return str.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim();
}

exports.fixAmountPrecisionError = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
exports.amountPrecision = exports.fixAmountPrecisionError;

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