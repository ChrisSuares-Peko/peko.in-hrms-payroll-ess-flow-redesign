const OfficeAddressSubscription = require("../entities/officeAddressSubscription");

const createSubscription = async (params) => {
  try {
    const isExist = await OfficeAddressSubscription.findOne({
      where: { paymentRefId: params.paymentRefId },
    });

    if (isExist) {
      console.error({
        message: "Subscription for this workspace order already exist",
      });
      return false;
    }
    return await OfficeAddressSubscription.create(params);
  } catch (error) {
    console.log(error.message);
  } finally {
    console.log("SUBSCRIPTION CREATE ROUTE CALLED");
  }
};

module.exports = {
  createSubscription,
};
