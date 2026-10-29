const softwares_subscriptions = require("../entities/softwares_subscriptions");
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const { handleSortFields } = require("../../utils/sortHandle");
const vendors = require("../entities/vendor");
const { formattedDateTime } = require("../../utils/formatter");
const { uploadFile } = require("../../utils/commonUploadFile");

exports.create = asyncHandler(async (params) => {
  try {
    if (Object.prototype.hasOwnProperty.call(params, "image") && params.imageFormat) {
      const filePath = `softwares_subscriptions/products`;
      const publicUrl = await uploadFile(params.image, filePath, params.imageFormat);
      params.image = publicUrl;
    }
    return await softwares_subscriptions.create(params);
  } catch (error) {
    console.log(error.message);
    return false;
  }
});

exports.findAll = asyncHandler(async (params, status = undefined, attributes) => {
  try {
    let { limit, offset, searchText, sort, sortField } = params;

    const order = handleSortFields(sortField, sort);

    const whereClause = {};

    if (searchText) {
      whereClause[Op.or] = [
        { id: { [Op.like]: `%${searchText}%` } },
        { name: { [Op.like]: `%${searchText}%` } },
        { type: { [Op.like]: `%${searchText}%` } },
        { offersText: { [Op.like]: `%${searchText}%` } },
        { peko_key: { [Op.like]: `%${searchText}%` } },
        { pekoEmail: { [Op.like]: `%${searchText}%` } },
      ];
    }

    if (status) {
      whereClause["status"] = status;
    }

    const queryOptions = {
      include: [
        {
          model: vendors,
          attributes: ["vendorName", "optional1"],
        },
      ],
      attributes,
      where: whereClause,
      order,
      raw: true,
      nest: true,
    };

    if (limit) queryOptions.limit = limit;
    if (offset !== undefined) queryOptions.offset = offset;

    return await softwares_subscriptions.findAndCountAll(queryOptions);
  } catch (error) {
    console.log(error);
    throw { message: "Something went wrong" };
  }
});

exports.update = asyncHandler(async (params, data) => {
  try {
    if (Object.prototype.hasOwnProperty.call(data, "image") && data.imageFormat) {
      const filePath = `softwares_subscriptions/products`;
      const publicUrl = await uploadFile(data.image, filePath, data.imageFormat);
      data.image = publicUrl;
    }

    if (Object.prototype.hasOwnProperty.call(data, "sold_quantity")) {
      // Retrieve the current sold_quantity value from the database
      const software = await softwares_subscriptions.findOne({
        where: { id: params.id },
      });
      // Update the data object to increment the sold_quantity value by 1
      data.sold_quantity = (software.sold_quantity || 0) + data.sold_quantity;
    }

    return await softwares_subscriptions.update(data, {
      where: {
        id: params.id,
      },
    });
  } catch (error) {
    console.log(error.message);
    return false;
  }
});

exports.findOne = asyncHandler(async (params, attributes) => {
  return await softwares_subscriptions.findOne({
    where: params,
    attributes,
  });
});

exports.listAll = asyncHandler(async (params, status = undefined, attributes) => {
  try {
    let { searchText } = params;

    let whereClause = {
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          name: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          type: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          offersText: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          peko_key: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          pekoEmail: {
            [Op.like]: "%" + searchText + "%",
          },
        },
      ],
    };

    if (status) {
      whereClause["status"] = status;
    }

    return await softwares_subscriptions.findAndCountAll({
      attributes: attributes,
      where: whereClause,
      raw: true,
      nest: true,
    });
  } catch (error) {
    console.log(error);
    throw { message: "Something went wrong" };
  }
});

exports.productAndCountExport = asyncHandler(async (params) => {
  try {
    let { searchText, sort, sortField } = params;
    let order = handleSortFields(sortField, sort);

    const data = await softwares_subscriptions.findAndCountAll({
      include: [
        {
          model: vendors,
          attributes: ["vendorName", "optional1"],
        },
      ],
      where: {
        [Op.or]: [
          {
            id: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            type: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            name: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            offersText: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            displayOrder: {
              [Op.like]: "%" + searchText + "%",
            }
          },
          {
            peko_key: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            pekoEmail: {
              [Op.like]: "%" + searchText + "%",
            },
          },
        ],
      },
      order: order,
      raw: true,
      nest: true,
    });
    let finalData = [];
    data.rows.forEach(function (limitData) {
      finalData.push({
        Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : "Not Available",
        Name: limitData.name ? limitData.name : "Not Available",
        Type: limitData.type ? limitData.type : "Not Available",
        Offers: limitData.offersText ? limitData.offersText : "Not Available",
        "Display Order": limitData.displayOrder ? limitData.displayOrder : "Not Available",
        Image: limitData.image ? limitData.image : "Not Available",        
        Status: limitData.status > 0 ? "Active" : "In Active",
      });
    });
    return finalData;
  } catch (error) {
    console.log(error);
    throw { message: "Something went wrong" };
  }
});

exports.Delete = asyncHandler(async (params) => {
  return await softwares_subscriptions.destroy({
    where: {
      id: params.productCode,
    },
  });
});