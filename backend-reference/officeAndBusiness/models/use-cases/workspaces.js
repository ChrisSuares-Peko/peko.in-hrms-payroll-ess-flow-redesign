/* eslint-disable no-prototype-builtins */
const workspaces = require("../entities/workspaces");
const plans = require("../entities/plans");
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const sequelizeConfig = require("../../configs/database");
const orders = require("../entities/order");
const { handleSortFields } = require("../../utils/sortHandle");
const {
  formatNumberWithLocalString,
  formattedDateTime,
} = require("../../utils/formatter");
const { uploadFile } = require("../../utils/commonUploadFile");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");

exports.create = asyncHandler(async (params) => {
  let docRes = {};
  if (params.hasOwnProperty("logo") && params.logoFormat) {
    const publicUrl = await uploadFile(
      params.logo,
      "workspaceImage",
      params.logoFormat
    );
    params.logo = publicUrl;
    docRes.logo = publicUrl;
  }
  const workspaceData = await workspaces.create(params);
  return workspaceData;
});

exports.findOne = asyncHandler(async (params) => {
  return await workspaces.findOne({
    where: {
      id: params.id,
    },
    raw: true,
    nest: true,
  });
});

exports.findAllWorkspaces = asyncHandler(async () => {
  return await workspaces.findAll({
    where: {
      status: true,
    },
    attributes: {
      exclude: ["createdAt", "updatedAt"],
    },
  });
});

exports.updateWorkspace = asyncHandler(async (params, data) => {
  if (data.hasOwnProperty("logo") && data.logoFormat) {
    const publicUrl = await uploadFile(
      data.logo,
      "workspaceImage",
      data.logoFormat
    );
    data.logo = publicUrl;
  }
  const isExist = await workspaces.findOne({
    where: {
      id: params.id,
    }
  });
  if (isExist) {
    return await workspaces.update(data, {
      where: {
        id: params.id,
      },
    });
  }
});

exports.deleteWorkspace = async (params) => {
  try {
    return await workspaces.destroy({
      where: {
        id: params.id,
      },
    });
  } catch (error) {
    console.log(error.message.message);
  } finally {
    console.log("WORKSPACE DELETE ROUTE CALLED");
  }
};

exports.findAllWorkspacesAndCount = asyncHandler(async (params) => {
  try {
    const { limit, offset, searchText, sort, sortField } = params;

    let order = handleSortFields(sortField, sort);
    const options = {
      include: [
        {
          model: plans,
          attributes: ["id", "name"],
        },
      ],
      where: {},
      limit,
      offset,
    };

    if (searchText) {
      options.where[Op.or] = [
        { id: { [Op.like]: `%${searchText}%` } },
        { name: { [Op.like]: `%${searchText}%` } },
        { monthlyPrice: { [Op.like]: `%${searchText}%` } },
        { yearlyPrice: { [Op.like]: `%${searchText}%` } },
        { address: { [Op.like]: `%${searchText}%` } },
        { latLng: { [Op.like]: `%${searchText}%` }}
      ];
    }

    if (sort && sortField) {
      options.order = order;
    }

    return await workspaces.findAndCountAll(options);
  } catch (error) {
    console.log(error)
    throw  {message:'Something went wrong'};
  }
});

exports.workspacesAndCountExport = asyncHandler(async (params) => {
  try {
    const { searchText, sort, sortField } = params;
    let order = handleSortFields(sortField, sort);
    const options = {
      include: [
        {
          model: plans,
          attributes: ["id", "name"],
        },
      ],
      where: {},
    };

    if (searchText) {
      options.where[Op.or] = [
        { id: { [Op.like]: `%${searchText}%` } },
        { name: { [Op.like]: `%${searchText}%` } },
        { monthlyPrice: { [Op.like]: `%${searchText}%` } },
        { yearlyPrice: { [Op.like]: `%${searchText}%` } },
        { address: { [Op.like]: `%${searchText}%` } },
        { latLng: { [Op.like]: `%${searchText}%` }}
      ];
    }

    if (sort && sortField) {
      options.order = order;
    }

    const data = await workspaces.findAndCountAll(options);
    let finalData = [];
    data.rows.forEach(function (limitData) {
      finalData.push({
        Date: limitData.createdAt
          ? formattedDateTime(limitData.createdAt)
          : "Not Available",
        "Workspace Name": limitData.name ? limitData.name : "Not Available",
        "Monthly Price": limitData.monthlyPrice
          ? "₹ " + formatNumberWithLocalString(limitData.monthlyPrice)
          : "₹ 0.00",
        "Yearly Price": limitData.yearlyPrice
          ? "₹ " + formatNumberWithLocalString(limitData.yearlyPrice)
          : "₹ 0.00",
        "Workspace Address": limitData.address
          ? limitData.address
          : "Not Available",
        "Lat/Long": limitData.latLng ? limitData.latLng : "Not Available",
        // Logo: limitData.logo ? limitData.logo : "Not Available",
        Status: limitData.status ? "Active" : "In Active",
      });
    });
    return finalData;
  } catch (error) {
    console.log(error);
    throw { message: "Something went wrong" };
  }
});

// FIND ALL SELECTED WORKSPACES

exports.findAllSelectedWorkspaces = asyncHandler(async (params) => {
  const { userId, from, to, searchText, sort, limit, offset, subCorporateUserId } = params;

  const tomorrow = new Date(to);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  let column = "createdAt";

  let whereClause = {
    credentialId: userId,
    serviceOperatorId: 24,
    status: {
      [sequelizeConfig.Sequelize.Op.notIn]: ["PENDING", "FAILURE"],
    },
  };

  if (subCorporateUserId) {
    whereClause.subCorporateUserId = subCorporateUserId;
  }

  if (from && to) {
    whereClause.transactionDate = {
      [Op.between]: [from, tomorrow],
    };
  }

  if (searchText) {
    whereClause[sequelizeConfig.Sequelize.Op.or] = [
      { status: { [sequelizeConfig.Sequelize.Op.like]: `%${searchText}%` } },
      {
        corporateTxnId: {
          [sequelizeConfig.Sequelize.Op.like]: `%${searchText}%`,
        },
      },
      {
        transactionDate: {
          [sequelizeConfig.Sequelize.Op.like]: `%${searchText}%`,
        },
      },
      {
        amountInINR: { [sequelizeConfig.Sequelize.Op.like]: `%${searchText}%` },
      },
      {
        paymentMode: { [sequelizeConfig.Sequelize.Op.like]: `%${searchText}%` },
      },
      sequelizeConfig.Sequelize.literal(
        `JSON_EXTRACT(orderResponse, '$.planDetails.billingCycle') COLLATE utf8mb4_general_ci LIKE :searchText`
      ),
      sequelizeConfig.Sequelize.literal(
        `JSON_EXTRACT(orderResponse, '$.planDetails.name') COLLATE utf8mb4_general_ci LIKE :searchText`
      ),
    ];
  }

  let sortClause = [[column, sort]];

  const results = await orders.findAndCountAll({
    where: whereClause,
    ...(searchText ? { replacements: { searchText: `%${searchText}%` } } : {}),
    order: sortClause,
    limit: limit,
    offset: offset,
    raw: true, // Fetch raw data
    nest: true, // Nest the results
  });

  return results;
});

exports.fetchSinglePlan = asyncHandler(async (planId, credentialId) => {
  const plan = await plans.findOne({
    where: {
      id: planId,
      status: true,
    },
    attributes: {
      exclude: ["createdAt", "updatedAt"],
    },
  });
  await applyCommissionMarkup(plan, "price", credentialId);
  return plan;
});
