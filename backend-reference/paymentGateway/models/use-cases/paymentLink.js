const paymentLinks = require("./../entities/paymentLink");
const { Op } = require("sequelize");
const asyncHandler = require("./../../middlewares/async");

exports.createPaymentLink = async (params) => {
  try {
    return await paymentLinks.create(params);
  } catch (error) {
    console.log(error.message);
    return false;
  } finally {
    console.log("PAYMENT LINKS CREATE ROUTE CALLED");
  }
};

exports.findOne = asyncHandler(async (params) => {
  try {
    return await paymentLinks.findOne({
      where: params,
  })
  } catch (error) {
    console.log(error.message);
    return false;
  } finally {
    console.log("PAYMENT LINKS RESEND ROUTE CALLED");
  }
  
})

exports.findAllPaymentLinks = asyncHandler(async (params) => {
  let { limit, offset, sort, sortField, corporateId, searchText } = params;
  let whereClause = { [Op.and]: [] };

  if (searchText) {
    whereClause[Op.and].push({
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          status: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          invoiceId: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          credentialId: {
            [Op.like]: "%" + searchText + "%",
          },
        },
      ],
    });
  }

  if (corporateId) {
    whereClause[Op.and].push({
      credentialId: corporateId,
    });
  }

  // If whereClause[Op.and] is empty, remove it to avoid unnecessary condition
  if (whereClause[Op.and].length === 0) {
    delete whereClause[Op.and];
  }
  return await paymentLinks.findAndCountAll({
    where: whereClause,
    order: [[sortField, sort]],
    limit: limit,
    offset: offset,
    raw: true,
    nest: true,
  });
});

exports.update = asyncHandler(async (paymentLinkId, data) => {
  try {
    return await paymentLinks.update(data,{
      where: {
        id: paymentLinkId,
      }
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("PAYOUT FIND ONE ROUTE CALLED");
  }
});