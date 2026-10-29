const asyncHandler = require("../../../middlewares/async");
const cloud_employees = require("../../entities/pekoCloud/cloud_employees");
const cloud_usageHistories = require("../../entities/pekoCloud/cloud_usageHistories");
const sequelize = require("../../../configs/database/index");
const { Op } = require("sequelize");
// const { updateAsset } = require("./cloud_assets");
const cloud_assets = require("../../entities/pekoCloud/cloud_assets");
const { handleSortFields } = require("../../../utils/sortHandle");
const ErrorResponse = require("../../../utils/error-response");

let category = "ASSET";

exports.findLatestUsageHistory = asyncHandler(async (id) => {
  try {
    //fetch latest usage history
    const asset = await cloud_usageHistories.findOne({
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
        cloudAssetId: id,
      },
      order: [["createdAt", "DESC"]], // Order by creation date in descending order
      limit: 1,
    });

    return { success: true, data: asset };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
});

exports.findAllUsageHistories = async (
  page,
  itemsPerPage,
  sortField,
  sort,
  searchText,
  assetId
) => {
  try {
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
    if (assetId) {
      whereClause.cloudAssetId = assetId;
    }

    const usageHistoriesData = await cloud_usageHistories.findAndCountAll({
      include: [
        {
          model: cloud_employees,
          attributes: ["id", "employeeName", "employeeEmail", "department"],
        },
      ],
      limit: itemsPerPage,
      offset: offset,
      order: order,
      where: whereClause,
    });

    return { success: true, data: usageHistoriesData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.updateUsageHistory = async (id, newData, owner = {}) => {
  const isUsageHistoryExist = await cloud_usageHistories.findOne({
    where: { id: id, usageCategory: category, ...owner },
  });

  if (!isUsageHistoryExist) {
    return {
      success: false,
      error: "usage history is not existing with the given details",
    };
  }

  if (newData.cloudEmployeeId) {
    const existEmployee = await cloud_employees.findOne({
      where: {
        id: newData.cloudEmployeeId,
      },
    });
    if (!existEmployee) {
      return {
        success: false,
        error: "employee is not existing with the given details",
      };
    }
  }

  if (newData.cloudAssetId) {
    const existAsset = await cloud_assets.findOne({
      where: {
        id: newData.cloudAssetId,
      },
    });
    if (!existAsset) {
      return {
        success: false,
        error: "asset is not existing with the given details",
      };
    }
  }

  const latestUsage = await cloud_usageHistories.findOne({
    where: {
      cloudAssetId: isUsageHistoryExist.cloudAssetId,
    },
    order: [["createdAt", "DESC"]], // Order by creation date in descending order
    limit: 1,
  });

  let transaction = await sequelize.transaction();
  try {
    const updateUsage = await cloud_usageHistories.update(newData, {
      where: { id: id, usageCategory: category, ...owner },
      transaction: transaction,
    });

    if (updateUsage[0] === 0) {
      return {
        success: false,
        error: "something went wrong while updating the usage history",
      };
    }

    if (isUsageHistoryExist.id == latestUsage.id && newData.cloudEmployeeId) {
      // update employee in asset table if latest user changed
      await cloud_assets.update(
        {
          cloudEmployeeId: newData.cloudEmployeeId,
        },
        {
          where: { id: isUsageHistoryExist.cloudAssetId },
          transaction: transaction,
        }
      );
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

exports.deleteUsageHistory = async (id, owner = {}) => {
  const isUsageHistoryExist = await cloud_usageHistories.findOne({
    where: { id: id, usageCategory: category, ...owner },
  });

  if (!isUsageHistoryExist) {
    return {
      success: false,
      error: "usage history is not existing with the given details",
    };
  }

  const latestUsage = await cloud_usageHistories.findOne({
    where: {
      cloudAssetId: isUsageHistoryExist.cloudAssetId,
    },
    order: [["createdAt", "DESC"]], // Order by creation date in descending order
    limit: 1,
  });

  let transaction = await sequelize.transaction();
  try {
    if (isUsageHistoryExist.id == latestUsage.id) {
      // remove employee in asset table if latest user deleted
      await cloud_assets.update(
        {
          cloudEmployeeId: null,
        },
        {
          where: { id: isUsageHistoryExist.cloudAssetId },
          transaction: transaction,
        }
      );
    }

    const deletedRowsCount = await cloud_usageHistories.destroy({
      where: { id: id, usageCategory: category, ...owner },
      transaction: transaction,
    });

    
    if (deletedRowsCount > 0) {
      await transaction.commit();
      return { success: true, data: {} };
    } else {
      return {
        success: false,
        error: "something went wrong while deleting the usage history"
      };
    }
  }
  catch (error) {
    await transaction.rollback();
    console.error("Transaction failed and rolled back: ", error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};
