exports.formattedDateTime = (datetime) =>
  datetime.toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true, // For AM/PM format
  });

  exports.formatNumberWithLocalString = (
    amount=0,
    minFraction = 2,
    maxFraction = 2
) => {
    try {
        return Number(amount).toLocaleString('en-IN', {
            minimumFractionDigits: minFraction,
            maximumFractionDigits: maxFraction,
        });
    } catch (error) {
        console.error('Error occurred while formatting amount:', error);
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

exports.fixAmountPrecisionError = (n) =>
  Math.round((Number(n) + Number.EPSILON) * 100) / 100;
exports.amountPrecision = exports.fixAmountPrecisionError;