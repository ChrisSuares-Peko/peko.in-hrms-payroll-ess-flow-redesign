const esimProfiles = require("../entities/esimProfilesTunz");

exports.findEsimCustomerByCredential = async (credentialId) => {
  try {
    const profile = await esimProfiles.findOne({
      where: { userId: credentialId },
      attributes: ["customerUid"]
    });

    return profile?.customerUid || null;

  } catch (error) {
    console.error("findEsimCustomerByCredential error:", error);
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
  installationUrl,
  state
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

exports.updateEsimProfileStatusByIccid = async ({ iccid, status }) => {
  try {
    const profile = await esimProfiles.findOne({ where: { iccid } });

    if (!profile) return null;

    profile.status = status;
    await profile.save();

    return profile;
  } catch (error) {
    throw new Error(`Failed to update eSIM profile status: ${error.message}`);
  }
};
