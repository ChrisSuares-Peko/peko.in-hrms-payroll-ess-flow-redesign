const asyncHandler = require("../../../middlewares/async");
const cloud_assets = require("../../entities/pekoCloud/cloud_assets");
const { Op } = require("sequelize");
const cloud_employees = require("../../entities/pekoCloud/cloud_employees");
const sequelize = require("../../../configs/database/index");
const cloud_usageHistories = require("../../entities/pekoCloud/cloud_usageHistories");
const cloud_documents = require("../../entities/pekoCloud/cloud_documents");
const { handleSortFields } = require("../../../utils/sortHandle");
const ErrorResponse = require("../../../utils/error-response");

let category = "ASSET";
exports.createAsset = asyncHandler(async (data) => {
  //checking asset already exist
  const existingAsset = await cloud_assets.findOne({
    where: {
      [Op.or]: [
        {
          serialNumber: data.serialNumber,
          credentialId: data.credentialId,
        },
      ],
    },
  });

  if (existingAsset) {
    return {
      success: false,
      error: "Asset with this serial number already exists",
    };
  }

  if (data.cloudEmployeeId) {
    const existEmployee = await cloud_employees.findOne({
      where: {
        id: data.cloudEmployeeId
      },
    });
    if (!existEmployee) {
      return {
        success: false,
        error: "employee is not existing with the given details",
      };
    }
  }

  let transaction = await sequelize.transaction();
  try {
    const responseData = await cloud_assets.create(data, {
      transaction: transaction,
    });
    if (!responseData) {
      return { success: false, error: "Failed to create asset." };
    }

    if (responseData.cloudEmployeeId) {
      // create usage history with the assigned employee
      await cloud_usageHistories.create(
        {
          cloudEmployeeId: responseData.cloudEmployeeId,
          usageCategory: category,
          cloudAssetId: responseData.id,
          assignDate: responseData.createdAt,
          credentialId: responseData.credentialId
        },
        {
          transaction: transaction,
        }
      );
    }
    await transaction.commit();

    return { success: true, data: responseData };
  }
  catch (error) {
    await transaction.rollback();
    console.error("Transaction failed and rolled back: ", error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
});

exports.findSingleAsset = asyncHandler(async (id, owner = {}) => {
  //fetch single asset
  const asset = await cloud_assets.findOne({
    include: [
      {
        model: cloud_employees,
        attributes: [
          "id",
          "employeeName",
          "employeeEmail",
          "department",
          "joiningDate",
          "employeeID",
        ],
      },
    ],
    where: {
      id: id,
      ...owner,
    },
  });
  if (!asset) {
    return {
      success: false,
      error: "Asset with this details doesn't exists.",
    };
  }

  return { success: true, data: asset };
});

exports.findAllAssetsList = async (credentialId, subCorporateUserId) => {
  let whereClause = {};
  if (credentialId) {
    whereClause.credentialId = credentialId;
  }
  if (subCorporateUserId) {
    whereClause.subCorporateUserId = subCorporateUserId;
    delete whereClause.credentialId;
  }

  const assetsData = await cloud_assets.findAndCountAll({
    include: [
      {
        model: cloud_employees,
        attributes: [
          "id",
          "employeeName",
          "employeeEmail",
          "department",
          "joiningDate",
          "employeeID",
        ],
      },
    ],
    where: whereClause,
  });

  return { success: true, data: assetsData };
};

exports.findAllAssets = async (
  page,
  itemsPerPage,
  sortField,
  sort,
  searchText,
  credentialId,
  subCorporateUserId
) => {
  let order = handleSortFields(sortField, sort)
  const offset = (page - 1) * itemsPerPage;

  let whereClause = {};
  if (searchText) {
    whereClause = {
      [Op.or]: [
        { assetName: { [Op.like]: `%${searchText}%` } },
        { serialNumber: { [Op.like]: `%${searchText}%` } },
        { assetCategory: { [Op.like]: `%${searchText}%` } },
        { assetType: { [Op.like]: `%${searchText}%` } },
        { "$cloud_employee.employeeName$": { [Op.like]: `%${searchText}%` } },
      ],
    };
  }
  if (credentialId) {
    whereClause.credentialId = credentialId;
  }
  if (subCorporateUserId) {
    whereClause.subCorporateUserId = subCorporateUserId;
    delete whereClause.credentialId;
  }
  const assetsData = await cloud_assets.findAndCountAll({
    include: [
      {
        model: cloud_employees,
        attributes: [
          "id",
          "employeeName",
          "employeeEmail",
          "department",
          "joiningDate",
          "employeeID",
        ],
      },
    ],
    limit: itemsPerPage,
    offset: offset,
    order: order,
    where: whereClause,
  });

  return { success: true, data: assetsData };
};

exports.findAllAssetsUsageHistories = async (
  page,
  itemsPerPage,
  sortField,
  sort,
  searchText,
  credentialId
) => {
  let order = handleSortFields(sortField, sort)
  const offset = (page - 1) * itemsPerPage;

  let whereClause = {};
  if (searchText) {
    whereClause = {
      [Op.or]: [
        { "$cloud_employee.employeeName$": { [Op.like]: `%${searchText}%` } },
        { "$cloud_employee.employeeEmail$": { [Op.like]: `%${searchText}%` } },
        { "$cloud_employee.department$": { [Op.like]: `%${searchText}%` } },
      ],
    };
  }
  if (category) {
    whereClause.usageCategory = category;
  }

  if (credentialId) {
    whereClause.credentialId = credentialId;
  }

  const usageHistoriesData = await cloud_usageHistories.findAndCountAll({
    include: [
      {
        model: cloud_employees,
        attributes: [
          "id",
          "employeeName",
          "employeeEmail",
          "department",
          "joiningDate",
          "employeeID",
        ],
      },
      {
        model: cloud_assets,
        attributes: [
          "id",
          "assetName",
          "assetCategory",
          "serialNumber",
          "purchasedDate",
          "assetType",
          "warranty",
          "amount",
        ],
      },
    ],
    limit: itemsPerPage,
    offset: offset,
    order: order,
    where: whereClause,
  });

  return { success: true, data: usageHistoriesData };
};

exports.updateAsset = async (id, newData, owner = {}) => {
  const isAssetExist = await cloud_assets.findOne({
    where: { id, ...owner },
  });

  if (!isAssetExist) {
    return {
      success: false,
      error: "asset is not existing with the given details",
    };
  }

  if (newData.cloudEmployeeId) {
    const existEmployee = await cloud_employees.findOne({
      where: {
        id: newData.cloudEmployeeId
      },
    });
    if (!existEmployee) {
      return {
        success: false,
        error: "employee is not existing with the given details",
      };
    }
  }

  const updateAsset = await cloud_assets.update(newData, {
    where: { id: id, ...owner },
  });

  if (updateAsset[0] === 0) {
    return {
      success: false,
      error: "something went wrong while updating the asset",
    };
  }

  return { success: true, data: {} };
};

exports.assignAsset = async (newData, credentialId) => {
  const {
    newEmployeeId,
    assetId,
    newAssignDate,
    existUsageId,
    existReturnDate,
    existReturnStatus,
    existRemarks,
  } = newData;

  let transaction = await sequelize.transaction();
  try {
    const isAssetExist = await cloud_assets.findOne({
      where: { id: assetId, credentialId },
    });

    if (!isAssetExist) {
      return {
        success: false,
        error: "asset is not existing with the given details",
      };
    }

    if (newEmployeeId) {
      const existEmployee = await cloud_employees.findOne({
        where: {
          id: newEmployeeId
        },
      });
      if (!existEmployee) {
        return {
          success: false,
          error: "employee is not existing with the given details",
        };
      }
    }
    // if asset already assigned
    if (isAssetExist.cloudEmployeeId) {
      await cloud_usageHistories.update(
        {
          returnDate: existReturnDate,
          returnStatus: existReturnStatus,
          remarks: existRemarks,
        },
        {
          where: { id: existUsageId },
          transaction: transaction,
        }
      );
    }

    // create usage history with the assigned employee
    await cloud_usageHistories.create(
      {
        cloudEmployeeId: newEmployeeId,
        usageCategory: category,
        cloudAssetId: assetId,
        assignDate: newAssignDate,
        credentialId: credentialId
      },
      {
        transaction: transaction,
      }
    );

    // update user on asset table
    const updateAsset = await cloud_assets.update(
      { cloudEmployeeId: newEmployeeId },
      {
        where: { id: assetId },
        transaction: transaction,
      }
    );

    if (updateAsset[0] === 0) {
      return {
        success: false,
        error: "something went wrong while updating the asset",
      };
    }
    await transaction.commit();
    return { success: true, data: {} };
  }
  catch (error) {
    await transaction.rollback();
    console.error("Transaction failed and rolled back: ", error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.deleteAsset = async (id, owner = {}) => {
  let transaction = await sequelize.transaction();
  try {
    const isAssetExist = await cloud_assets.findOne({
      where: { id, ...owner },
    });

    if (!isAssetExist) {
      return {
        success: false,
        error: "asset is not existing with the given details",
      };
    }

    await cloud_documents.destroy({
      where: { cloudAssetId: id, documentCategory: category },
      transaction: transaction,
    });

    await cloud_usageHistories.destroy({
      where: { cloudAssetId: id, usageCategory: category },
      transaction: transaction,
    });

    const deletedAssetRowsCount = await cloud_assets.destroy({
      where: { id: id, ...owner },
      transaction: transaction,
    });
    if (deletedAssetRowsCount == 0) {
      return { success: false, error: "asset is not able to delete try again" };
    }

    await transaction.commit();
    return { success: true, data: {} };
  }
  catch (error) {
    await transaction.rollback();
    console.error("Transaction failed and rolled back: ", error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};
