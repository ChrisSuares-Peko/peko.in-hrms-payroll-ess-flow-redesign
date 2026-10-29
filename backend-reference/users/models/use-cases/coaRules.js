const CoaRules = require("../entities/coaRules");

exports.getActiveRuleByEntityType = async (entityType) => {
    return await CoaRules.findAll({
        where: { entityType, isActive: true },
    });
};
