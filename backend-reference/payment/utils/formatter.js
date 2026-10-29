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

exports.formatDateToYMD=(date)=>{
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return date;
  }

exports.formatDateTimeInIST = (dateValue) => {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(parsed);
};
exports.fixAmountPrecisionError = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
exports.amountPrecision = exports.fixAmountPrecisionError;
