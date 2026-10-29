const cashback = require("../entities/cashback");
const serviceOperator = require("../entities/serviceOperator");
const packages = require("../entities/package");
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");

exports.findOne = asyncHandler(async (params) => {
  try {
    let { serviceOperatorId, packageIds } = params;
    return await cashback.findOne({
      where: {
        packageId: {
          [Op.in]: packageIds,
        },
        serviceOperatorId,
        serviceStatus: true,
      },
      raw: true,
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("CASHBACK FIND ONE ROUTE CALLED");
  }
});

exports.findOneByPackageId = asyncHandler(async (packageId) => {
  try {
    return await cashback.findOne({
      where: {
        packageId,
        serviceStatus: true,
      },
      raw: true,
    });
  } catch (error) {
    console.log(error);
  }
});

// Returns the GROUP plan's cashback entry for a service identified by its INDIVIDUAL packageId.
// Used to get tier-specific unitPrice for addon periodic price calculations.
exports.findGroupCashbackForService = asyncHandler(async ({ groupPackageId, individualPackageId }) => {
  try {
    // Step 1: get the serviceOperatorId from the INDIVIDUAL package's cashback
    const individualCashback = await cashback.findOne({
      where: { packageId: individualPackageId, serviceStatus: true },
      attributes: ["serviceOperatorId"],
      raw: true,
    });
    if (!individualCashback) return null;

    // Step 2: find the GROUP plan's cashback for the same serviceOperator
    const groupCashback = await cashback.findOne({
      where: {
        packageId: groupPackageId,
        serviceOperatorId: individualCashback.serviceOperatorId,
        serviceStatus: true,
      },
      attributes: ["unitPrice", "baseLimit", "packageId"],
      raw: true,
    });
    return groupCashback;
  } catch (error) {
    console.error("Error finding group cashback for service:", error);
    return null;
  }
});

exports.findOneServiceCashbacks = asyncHandler(async ({ accessKey, partnerId }) => {
  try {
    let packageWhere = {};
    if (partnerId !== undefined) {
      const normalizedPartnerId = partnerId === 'null' ? null : partnerId;
      packageWhere = { partnerId: normalizedPartnerId };
    }
    
    const cashbacks = await cashback.findAll({
      include: [
        {
          model: packages,
          required: true,
          where: packageWhere, 
          attributes: [
            "id",
            "packageName",
            "packagePrices",
            "partnerId",
            "discount",
            "packageType",
          ],
        },
        {
          model: serviceOperator,
          where: { accessKey: accessKey },
          attributes: ["id", "isDynamicUnitPricing", "serviceProvider"],
        },
      ],
      where:{serviceStatus: true},
      attributes: ["unitPrice", "baseLimit", "packageId"],
      raw: true,
      nest: true,
    });

    return cashbacks;
  } catch (error) {
    console.error("Error finding cashback row:", error);
    return false;
  }
});
