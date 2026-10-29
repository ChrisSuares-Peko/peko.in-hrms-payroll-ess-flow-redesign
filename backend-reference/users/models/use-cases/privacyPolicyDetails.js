const PrivacyPolicyDetails = require("../entities/privacyPolicyDetails");

exports.findAllActivePrivacyPolicies = async () => {
  const policies = await PrivacyPolicyDetails.findAll({
    where: { status: "ACTIVE" },
    attributes: [
      "id",
      "privacyPolicyRegistrationText",
      "effectiveFrom",
      "status",
      "isMandatory",
      "hyperLinkText",
      "validationText",
    ],
    order: [["id", "ASC"]],
    raw: true,
  });
  return policies;
};
