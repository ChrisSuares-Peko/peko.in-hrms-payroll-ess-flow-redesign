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
    timeZone: "UTC",
    hour12: true, // For AM/PM format
  });

exports.formatString = (text) => {
    if (!text) return '';
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
};

exports.formatNumberWithLocalString = (
  amount = 0,
  minFraction = 2,
  maxFraction = 2
) => {
  try {
    return Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: minFraction,
      maximumFractionDigits: maxFraction,
    });
  } catch (error) {
    console.error("Error occurred while formatting amount:", error);
    return ``; // Return received amount if an error occurs
  }
};

exports.formattedDateOnly = (dateString) => {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = date.toLocaleDateString('en-US', options);
  return formattedDate;
};
exports.capitalizeFirstLetter=(str)=> {
  if (!str) return 'Not Available'; // Provide a default value if the string is undefined or null
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

exports.startOfDay = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00.000Z'); // Ensures UTC start
  return date;
};

exports.endOfDay = (dateStr) => {
  const date = new Date(dateStr + 'T23:59:59.999Z'); // Ensures UTC end
  return date;
};

exports.fixAmountPrecisionError = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
exports.amountPrecision = exports.fixAmountPrecisionError;