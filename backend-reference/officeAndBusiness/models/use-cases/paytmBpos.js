const asyncHandler = require("../../middlewares/async");
const PaytmBpos = require("./../entities/paytmBpos");

const { Op } = require("sequelize");

exports.createRequest = asyncHandler(async (data) => {
  const existingRecord = await PaytmBpos.findOne({
    where: { storeName: data.storeName, credentialId: data.credentialId },
  });
  if (existingRecord) {
    return { error: "This store is already requested for Paytm BPOS" };
  } else {
    const requestData = await PaytmBpos.create(data);
    return requestData;
  }
});

exports.findAllBposByCorporate = asyncHandler(async (params) => {
  let {
    limit,
    offset,
    sort,
    searchText = "",
    column = "createdAt",
    corporateId,
  } = params;

  return await PaytmBpos.findAndCountAll({
    where: {
      credentialId: corporateId,
      [Op.or]: [
        {
          storeName: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          businessCategory: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          contactPerson: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          mobileNumber: {
            [Op.like]: "%" + searchText + "%",
          },
        },
      ],
    },
    order: [[column, sort]],
    limit,
    offset,
    raw: true,
    nest: true,
  });
});

exports.findAllRequestAndCount = asyncHandler(async (params) => {
  let { limit, offset, from, to, sort, searchText, column } = params;
  // Adjust 'to' date to end of day
  const tomorrow = new Date(to);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return await PaytmBpos.findAndCountAll({
    where: {
      createdAt: {
        [Op.between]: [from, tomorrow],
      },

      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          storeName: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          contactPerson: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          mobileNumber: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          email: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          preferredLanguage: {
            [Op.like]: "%" + searchText + "%",
          },
        },
      ],
    },
    order: [[column, sort]],
    limit,
    offset,
    raw: true,
    nest: true,
  });
});

exports.updateBposStatus = asyncHandler(async (params, data) => {
  return await PaytmBpos.update(data, {
    where: {
      id: params.id,
    },
  });
});
