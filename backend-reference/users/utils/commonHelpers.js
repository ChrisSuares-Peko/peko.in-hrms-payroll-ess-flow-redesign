const { parsePhoneNumberFromString } = require("libphonenumber-js");
const { customLog } = require("./loggerHelper");

exports.splitPhoneNumber = (fullNumber) => {
  // No phone is a legitimate state - an OIDC provider may simply not send a phone
  // claim. Return null like any other unusable input instead of letting
  // libphonenumber throw "A text for parsing must be a string." at the caller.
  if (fullNumber === null || fullNumber === undefined || fullNumber === "") {
    return null;
  }
  if (typeof fullNumber !== "string") {
    customLog(null, "error", { msg: "Phone number must be a string:", fullNumber });
    return null;
  }

  const phoneNumber = parsePhoneNumberFromString(fullNumber);

  if (!phoneNumber || !phoneNumber.isValid()) {
    if (fullNumber.startsWith("+999")) {
      return {
        countryCode: "999",
        mobileNo: fullNumber.split("+999")[1] || "",
      };
    }
    customLog(null, "error", { msg: "Invalid phone number:", fullNumber });
    return null;
  }

  return {
    countryCode: phoneNumber.countryCallingCode,
    mobileNo: phoneNumber.nationalNumber,
  };
};
