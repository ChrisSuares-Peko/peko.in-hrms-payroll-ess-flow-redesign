const { customLog } = require("../../utils/loggerHelper");
const oauth_consents = require("../entities/oauth_consents");

exports.findOauthConsentDetails = async (
  credentialId,
  client_id,
  attributes = undefined
) => {
  try {
    const consent = await oauth_consents.findOne({
      where: {
        client_id,
        credentialId,
      },
      attributes,
      raw: true,
      nest: true,
    });
    return consent;
  } catch (error) {
    customLog(null, "error", {
      msg: "Oauth consent fetching from DB failed:",
      error,
    });
    return false;
  }
};

exports.createOrUpdateOauthConsent = async (credentialId, client_id, scopes) => {
  try {
    const existingConsent = await oauth_consents.findOne({
      where: {
        credentialId,
        client_id,
      },
      raw: true,
      nest: true,
    });
    if (existingConsent) {
      // Update existing consent
      await oauth_consents.update(
        { scopes },
        {
          where: {
            id: existingConsent.id,
            credentialId,
          },
        }
      );
      return { message: "Consent updated successfully" };
    } else {
      // Create new consent
      await oauth_consents.create({
        client_id,
        scopes,
        credentialId,
      });
      return { message: "Consent created successfully" };
    }
  } catch (error) {
    customLog(null, "error", {
      msg: "Creating or updating OAuth consent failed:",
      error,
    });
    return false;
  }
};

exports.findAllOauthConsentsByCredential = async (credentialId) => {
  try {
    const consents = await oauth_consents.findAll({
      where: { credentialId },
      attributes: ["id", "client_id", "scopes", "createdAt", "updatedAt"],
      raw: true,
      nest: true,
    });
    return consents;
  } catch (error) {
    customLog(null, "error", {
      msg: "Fetching OAuth consents list from DB failed:",
      error,
    });
    return false;
  }
};

exports.deleteOauthConsent = async (id, credentialId) => {
  try {
    const deletedCount = await oauth_consents.destroy({
      where: { id, credentialId },
    });
    return deletedCount;
  } catch (error) {
    customLog(null, "error", {
      msg: "Deleting OAuth consent from DB failed:",
      error,
    });
    return false;
  }
};
