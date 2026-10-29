const payouts = require("./../entities/payout");
const order = require("./../entities/order");
const credential = require("./../entities/credential");
const asyncHandler = require("./../../middlewares/async");
const { customLog } = require("../../utils/loggerHelper");

exports.createLeanPayout = asyncHandler(async (params) => {
  return await payouts.create(params);
});
 
exports.findOnePayout = asyncHandler(async (params, attributes = undefined) => {
  try {
    return await payouts.findOne({
      where: {
        paymentRefId: params.intentId,
      }, 
      include: [
        {
          model: order,
          attributes: ["amountInINR","corporateTxnId","orderResponse", "status", "createdAt"],
          include: [{ model: credential, attributes: ["username", "name", "email"] }],
        },
      ],
      attributes,
      raw: true,
      nest: true,
    });
  } catch (error) {
    customLog(null, 'error', { error: error.message });

  } finally {
    customLog(null, "info", { message: `PAYOUT FIND ONE ROUTE CALLED` });
  }
});

exports.updatePayout = asyncHandler(async (intentId, data) => {
  try {
    return await payouts.update(data,{
      where: {
        paymentRefId: intentId,
      }
    });
  } catch (error) {
    customLog(null, 'error', { error: error.message });

  } finally {
    customLog(null, "info", { message: `PAYOUT UPDATE ROUTE CALLED` });
  }
});