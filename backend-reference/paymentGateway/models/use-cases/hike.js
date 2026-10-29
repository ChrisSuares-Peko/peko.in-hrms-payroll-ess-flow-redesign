const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const hike = require("../entities/hike");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");

exports.findHikesByIds = asyncHandler(async (ids, credentialId) => {
  const hikes = await hike.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ["id", "name", "amount", "commissionMode", "commissionType", "commission", "fixedCommissionPerTransaction", "isCommissionInclGST", "isCommissionConfigured"],
  });
  await applyCommissionMarkup(hikes, "amount", credentialId);
  return hikes;
});

exports.findOneHikeDetails = asyncHandler(async ({params, credentialId}) => {
  try {
    let { id } = params;
    const plan = await hike.findOne({
      where: { id },
    });
    await applyCommissionMarkup(plan, "amount", credentialId);
    return plan;
  } catch (error) {
    console.log("this is error", error);
    throw error;
  } finally {
    console.log("HIKE FIND ONE CALLED");
  }
});
