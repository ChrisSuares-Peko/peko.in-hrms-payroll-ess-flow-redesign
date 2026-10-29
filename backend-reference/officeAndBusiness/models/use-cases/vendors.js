/* eslint-disable no-unused-vars */
const vendor = require("./../entities/vendor");
const sequelize = require("../../configs/database/index");
const { Op } = require("sequelize");
const asyncHandler = require("./../../middlewares/async");

exports.fetchVendorDetails = asyncHandler(async (query, type, vendors) => {
  const whereCondition = {
    vendorName: {
      [Op.like]: "%" + query + "%",
    },
  };

  if (type) {
    whereCondition.type = type;
  }

  if (vendors && vendors.length > 0) {
    whereCondition.id = {
      [Op.in]: vendors,
    };
  }

  return await vendor.findAll({
    where: whereCondition,
    attributes: ["id", "vendorName"],
  });
});
