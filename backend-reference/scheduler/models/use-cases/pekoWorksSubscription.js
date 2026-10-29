const PekoWorksSubscription = require("../entities/pekoWorksSubscription");
const { customLog } = require('../../utils/loggerHelper');

const createSubscription = async (params) => {
  try {
    const isExist = await PekoWorksSubscription.findOne({
      where: { paymentRefId: params.paymentRefId },
    });

    if (isExist) {
      customLog(null, "error", {
        message: "Subscription for this peko works order already exist",
      });
      return false;
    }
    return await PekoWorksSubscription.create(params);
  } catch (error) {
    customLog(null, "error", { error, message: "Error creating peko works subscription" });
  } finally {
    customLog(null, "info", { message: "Subscription create route called" });
  }
};

module.exports = {
  createSubscription,
};
