const axios = require("axios");
const { CLEVERTAP_ACCOUNT_ID, CLEVERTAP_PASSCODE } = process.env;

exports.uploadEvent = async (
  { eventName, eventData, email },
  partnerDetails
) => {
  try {
    if (!eventName || !eventData || !email) {
      console.error("Values missing:", { eventName, eventData, email });
      return false;
    }
    if (process.env.NODE_ENV !== "production") {
      console.log("CleverTap skipped, working in staging environment");
      return false;
    }
    const { clevertap_projectId, clevertap_passCode } = partnerDetails;
    const config = {
      method: "post",
      url: `https://api.clevertap.com/1/upload`,
      headers: {
        "Content-Type": "application/json",
        "X-CleverTap-Account-Id": `${clevertap_projectId || CLEVERTAP_ACCOUNT_ID}`,
        "X-CleverTap-Passcode": `${clevertap_passCode || CLEVERTAP_PASSCODE}`,
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
