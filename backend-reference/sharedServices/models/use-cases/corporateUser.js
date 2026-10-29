const corporateUser = require("../entities/corporateUser");

// Map a credentialId → corporateUser row (id needed for wallet COA lookup).
exports.findByCredentialId = async (
    credentialId,
    attributes = ["id", "registeredBy"]
) => {
    if (!credentialId) return null;
    return corporateUser.findOne({
        where: { credentialId },
        attributes,
        raw: true,
    });
};
