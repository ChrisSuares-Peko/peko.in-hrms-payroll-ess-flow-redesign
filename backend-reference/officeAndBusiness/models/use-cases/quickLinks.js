const quickLinks = require("./../entities/quickLinks");
const { Op } = require("sequelize");
const asyncHandler = require("./../../middlewares/async");

const createPaymentLink = async (params) => {
  try {
    return await quickLinks.create(params);
  } catch (error) {
    console.log(error.message);
  } finally {
    console.log("PAYMENT LINKS CREATE ROUTE CALLED");
  }
};

const findAllPaymentLinks = asyncHandler(async (params) => {
  let { corporateId, from, to, start, length, order, column } = params;
  let whereClause = {
    createdAt: {
      [Op.between]: [from, to],
    },
  };
  if (corporateId) {
    whereClause.credentialId = corporateId;
  }
  return await quickLinks.findAndCountAll({
    where: whereClause,
    order: [[column, order]],
    limit: length,
    offset: start,
    raw: true,
    nest: true,
  });
});

module.exports = {
  createPaymentLink,
  findAllPaymentLinks,
};
