const ServiceSubscription = require("../entities/serviceSubscription");
const Package = require("../entities/package");
const { customLog } = require("../../utils/loggerHelper");

exports.findActiveByAccessCode = async (
    credentialId,
    accessCode,
    attributes = undefined
) => {
    try {
        return await ServiceSubscription.findOne({
            where: { credentialId, status: "ACTIVE" },
            include: [
                {
                    model: Package,
                    attributes: [
                        "packageName",
                        "accessCode",
                        "packagePrices",
                        "discount",
                    ],
                    where: { accessCode },
                    required: true,
                },
            ],
            attributes,
            raw: true,
            nest: true,
        });
    } catch (error) {
        customLog(null, "error", {
            message: "findActiveByAccessCode failed",
            error: error?.message,
        });
        return null;
    }
};
