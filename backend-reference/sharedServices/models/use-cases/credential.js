const credential = require("../entities/credential");

exports.findById = async (
    id,
    attributes = ["id", "name", "username", "registeredBy"]
) => {
    if (!id) return null;
    return credential.findByPk(id, { attributes, raw: true });
};
