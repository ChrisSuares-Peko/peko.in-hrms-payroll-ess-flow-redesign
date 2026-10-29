const OfficeAddressSubscription = require("../entities/officeAddressSubscription");
const { customLog } = require('../../utils/loggerHelper');

const createSubscription = async (params) => {
  try {
    const isExist = await OfficeAddressSubscription.findOne({
      where: { paymentRefId: params.paymentRefId },
    });

    if (isExist) {
      customLog(null, "error", {
        message: "Subscription for this workspace order already exist",
      });
      return false;
    }
    return await OfficeAddressSubscription.create(params);
  } catch (error) {
    customLog(null, "error", { error, message: "Error creating office address subscription" });
  } finally {
    customLog(null, "info", { message: "Subscription create route called" });
  }
};

module.exports = {
  createSubscription,
};
