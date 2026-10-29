/* eslint-disable no-prototype-builtins */
const { fetchServiceDetails } = require("../utils/checkAndFetchServiceDetails");

exports.fetchVendorDetailsByServiceDetails = async (user, accessKey) => {
  try {
    const credentialId = user.id; //will come from userObject
    const packageId = user.packageId; //will come from userObject
    const corporateUserId = user.corporateId;
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (serviceDetails.hasOwnProperty("error")) {
      throw new Error(
        "Apologies, the service you are trying to access is currently unavailable."
      );
    }
    console.log({ vendor: serviceDetails.vendor });
    return serviceDetails.vendor;
  } catch (error) {
    console.log({ error });
    throw new Error(
      "Apologies, the service you are trying to access is currently unavailable."
    );
  }
};
