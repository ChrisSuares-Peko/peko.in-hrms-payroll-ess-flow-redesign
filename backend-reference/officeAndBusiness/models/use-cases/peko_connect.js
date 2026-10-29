/* eslint-disable no-unused-vars */
/* eslint-disable no-prototype-builtins */
const peko_connect = require("../entities/peko_connect");
const connections = require("../entities/connections");
const sequelize = require("../../configs/database/index");
const credential = require("../entities/credential");
const { handleSortFields } = require("../../utils/sortHandle");
const { formattedDateTime } = require("../../utils/formatter");
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const { uploadFile } = require("../../utils/commonUploadFile");

exports.create = asyncHandler(async (params) => {
  if (params.hasOwnProperty("logo") && params.format) {
    const filePath = `peko-connect/logo`;
      const publicUrl = await uploadFile(
        params.logo,
        filePath,
        params.format
      );
      params.logo = publicUrl;
    
  }
  const responseData = await peko_connect.create(params);
  if (!responseData) {
    return false;
  }
  return responseData;
});

exports.find = asyncHandler(async (params, exclude = undefined) => {
  return await peko_connect.findOne({
    where: {
      id: params.id,
    },
    attributes: {
      exclude,
    },
  });
});

exports.findPeko = asyncHandler(async (attributes = undefined) => {
  return await peko_connect.findAll({
    where: {
      status: true,
    },
    attributes,
  });
});

exports.update = asyncHandler(async (params, data) => {
  if (data.hasOwnProperty("logo") && data.format) {
    const filePath = `peko-connect/logo`;
      const publicUrl = await uploadFile(data.logo, filePath, data.format);
      data.logo = publicUrl;
  }
  return await peko_connect.update(data, {
    where: {
      id: params.id,
    },
  });
});

exports.deleteEntry = asyncHandler(async (params) => {
  return await peko_connect.destroy({
    where: {
      id: params.id,
    },
  });
});

exports.pekoAndCountExport = asyncHandler(async (params) => {
  try {
    let {
      searchText,
      sort,
      sortField
    } = params
    let order = handleSortFields(sortField, sort)
    const options = {
      where: {
        [Op.or]: [
          { id: { [Op.like]: `%${searchText}%` } },
          { serviceProvider: { [Op.like]: `%${searchText}%` } },
          { address: { [Op.like]: `%${searchText}%` } },
          { category: { [Op.like]: `%${searchText}%` } },
        ],
      },
      order: order,
      raw: true,
    };

    const data = await peko_connect.findAndCountAll(options);
    let finalData = []
    data.rows.forEach(function (limitData) {
      finalData.push({
        Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
        "Service Provider": limitData.serviceProvider ? limitData.serviceProvider : "Not Available",
        Address: limitData.address ? limitData.address : "Not Available",
        Category: limitData.category ? limitData.category : "Not Available",
        Description: limitData.description ? limitData.description : "Not Available",
        Status: limitData.status > 0 ? "Active" : "In Active",
      })
    })
    return finalData
  } catch (error) {
    console.log(error);
    throw { message: 'Something went wrong' };
  }
});

exports.findAllPeko = asyncHandler(async (params) => {
  try {
    let {
      page,
      itemsPerPage,
      searchText,
      sort,
      sortField
    } = params
    let order = handleSortFields(sortField, sort)
    const options = {
      where: {
        [Op.or]: [
          { id: { [Op.like]: `%${searchText}%` } },
          { serviceProvider: { [Op.like]: `%${searchText}%` } },
          { address: { [Op.like]: `%${searchText}%` } },
          { category: { [Op.like]: `%${searchText}%` } },
        ],
      },
      order: order,
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      raw: true,
    };

    return await peko_connect.findAndCountAll(options);
  } catch (error) {
    console.log(error);
    throw { message: 'Something went wrong' };
  }
});

exports.createRequest = asyncHandler(async (params) => {
  return await connections.create(params);
});

exports.findConnected = asyncHandler(async (params) => {
  return await connections.findAll({
    where: {
      credentialId: params.id,
    },
    order: [["createdAt", "DESC"]],
  });
});
