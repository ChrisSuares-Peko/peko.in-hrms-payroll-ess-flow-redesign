const esimProfiles = require("../entities/esimProfilesTunz");
const order = require("../entities/order");

exports.findCustomerUidByIccid = async (iccid) => {
  const profile = await esimProfiles.findOne({
    where: { iccid },
    attributes: ["customerUid"]
  });

  return profile?.customerUid || null;
};

// Recipient the eSIM was originally purchased for (employee / someone else), from the
// purchase order's stored response. Null when purchased for self or on any lookup failure.
exports.findPurchasedForByIccid = async (iccid) => {
  try {
    const profile = await esimProfiles.findOne({
      where: { iccid },
      attributes: ["corporateTxnId"]
    });
    if (!profile?.corporateTxnId) return null;

    const orderRow = await order.findOne({
      where: { corporateTxnId: profile.corporateTxnId },
      attributes: ["orderResponse"]
    });
    if (!orderRow?.orderResponse) return null;

    return JSON.parse(orderRow.orderResponse)?.purchasedFor || null;
  } catch (error) {
    return null;
  }
};

exports.createEsimProfile = async ({
  credentialId,
  corporateUserId,
  customerUid,
  esimUid,
  iccid,
  activationCode,
  planId,
  country,
  corporateTxnId,
  state,
  installationUrl
}) => {
  try {
    const profile = await esimProfiles.create({
      userId: credentialId,
      corporateUserId,
      customerUid,
      esimUid,
      iccid,
      activationCode,
      planId,
      country,
      corporateTxnId,
      status: state,
      installationUrl
    });

    return profile;
  } catch (error) {
    throw new Error(`Failed to create eSIM profile: ${error.message}`);
  }
};