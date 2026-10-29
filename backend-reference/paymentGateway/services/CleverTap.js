const axios = require("axios");
const { CLEVERTAP_ACCOUNT_ID, CLEVERTAP_PASSCODE } = process.env;

exports.uploadEvent = async ({ eventName, eventData, email }) => {
  try {
    if (!eventName || !eventData || !email) {
      console.error("Values missing:", { eventName, eventData, email });
      return false;
    }
    const config = {
      method: "post",
      url: `https://api.clevertap.com/1/upload`,
      headers: {
        "Content-Type": "application/json",
        "X-CleverTap-Account-Id": `${CLEVERTAP_ACCOUNT_ID}`,
        "X-CleverTap-Passcode": `${CLEVERTAP_PASSCODE}`,
      },
      data: {
        d: [
          {
            type: "event",
            evtName: eventName,
            evtData: eventData,
            identity: email,
          },
        ],
      },
    };
    const response = await axios(config);
    const { processed, status } = response.data;
    if (processed > 0) {
      return status;
    } else {
      console.error("Failed to record event:", response.data);
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};
