exports.formattedDateTime = (datetime) =>
  datetime.toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true, // For AM/PM format
  });

exports.formatNumberWithLocalString = (amount = 0, minFraction = 2, maxFraction = 2) => {
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
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = date.toLocaleDateString("en-IN", options);
  return formattedDate;
};

exports.startOfDay = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00.000Z'); // Ensures UTC start
  return date;
};

exports.endOfDay = (dateStr) => {
  const date = new Date(dateStr + 'T23:59:59.999Z'); // Ensures UTC end
  return date;
};

exports.capitalizeCase = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .split(/[_\s]+/) // splits on one or more underscores or whitespace
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

exports.fixAmountPrecisionError = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
exports.amountPrecision = exports.fixAmountPrecisionError;