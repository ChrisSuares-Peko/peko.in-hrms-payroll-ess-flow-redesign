const {  findOneHikeDetails } = require("../models/use-cases/hike");
const { customLog } = require("../utils/loggerHelper");

/**
 * Validates selected hikes against DB and recalculates total amount
 */
const validateHikePayment = async (params, credentialId) => {
   
  try {
    if (!params.selectedHikes || !Array.isArray(params.selectedHikes) || params.selectedHikes.length === 0) {
      return { status: false, message: "No hikes selected" };
    }

    let expectedAmount = 0;

    for (const hike of params.selectedHikes) {
      const { id, quantity } = hike;
     
      if (!id || !quantity) {
        return { status: false, message: "Invalid hike data" };
      }

      // fetch actual hike from DB
      const dbHike = await findOneHikeDetails({
        params: { id },
        attributes: ["id", "name", "amount", "planType"],
        credentialId,
      });
     
      const dbPrice = Number(dbHike.amount || 0);
      expectedAmount += Number(quantity) * dbPrice;
    }

    return { status: true, totalAmount: Number(expectedAmount) };
  } catch (error) {
    customLog(null, "error", { error, message: "Error validating hike payment" });
    return { status: false, message: "Something went wrong" };
  }
};

module.exports = validateHikePayment;
