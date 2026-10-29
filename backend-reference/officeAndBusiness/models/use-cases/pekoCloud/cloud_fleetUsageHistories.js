const asyncHandler = require("../../../middlewares/async");
const cloud_employees = require("../../entities/pekoCloud/cloud_employees");
const sequelize = require("../../../configs/database/index");
const cloud_usageHistories = require("../../entities/pekoCloud/cloud_usageHistories");
const { Op } = require("sequelize");
// const { updateFleet } = require("./cloud_fleets");
const cloud_fleets = require("../../entities/pekoCloud/cloud_fleets");
const ErrorResponse = require("../../../utils/error-response");

let category = "FLEET";

exports.findLatestUsageHistory = asyncHandler(async (id) => {
  try {
    //fetch latest usage history
    const fleet = await cloud_usageHistories.findOne({
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
        cloudFleetId: id,
      },
      order: [["createdAt", "DESC"]], // Order by creation date in descending order
      limit: 1,
    });

    return { success: true, data: fleet };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
});

exports.findAllUsageHistories = async (
  page,
  itemsPerPage,
  sortField,
  sort,
  searchText,
  fleetId
) => {
  try {
    const offset = (page - 1) * itemsPerPage;

    let whereClause = {};
    if (searchText) {
      whereClause = {
        [Op.or]: [
          { "$cloud_employee.employeeName$": { [Op.like]: `%${searchText}%` } },
          {
            "$cloud_employee.employeeEmail$": { [Op.like]: `%${searchText}%` },
          },
          { "$cloud_employee.department$": { [Op.like]: `%${searchText}%` } },
        ],
      };
    }
    if (category) {
      whereClause.usageCategory = category;
    }
    if (fleetId) {
      whereClause.cloudFleetId = fleetId;
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
      order: [[sortField, sort]],
      where: whereClause,
    });

    return { success: true, data: usageHistoriesData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};

exports.updateUsageHistory = async (id, newData, owner = {}) => {
  let transaction = await sequelize.transaction();
  try {
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

    if (newData.cloudFleetId) {
      const existFleet = await cloud_fleets.findOne({
        where: {
          id: newData.cloudFleetId,
        },
      });
      if (!existFleet) {
        return {
          success: false,
          error: "fleet is not existing with the given details",
        };
      }
    }

    const latestUsage = await cloud_usageHistories.findOne({
      where: {
        cloudFleetId: isUsageHistoryExist.cloudFleetId,
      },
      order: [["createdAt", "DESC"]], // Order by creation date in descending order
      limit: 1,
    });

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
      // update employee in fleet table if latest user changed
      await cloud_fleets.update(
        {
          cloudEmployeeId: newData.cloudEmployeeId,
        },
        {
          where: { id: isUsageHistoryExist.cloudFleetId },
          transaction: transaction,
        }
      );
    }
    await transaction.commit();
    return { success: true, data: {} };
  } catch (error) {
    await transaction.rollback();
    console.error("Transaction failed and rolled back: ", error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};

exports.deleteUsageHistory = async (id, owner = {}) => {
  let transaction = await sequelize.transaction();
  try {
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
        cloudFleetId: isUsageHistoryExist.cloudFleetId,
      },
      order: [["createdAt", "DESC"]], // Order by creation date in descending order
      limit: 1,
    });

    if (isUsageHistoryExist.id == latestUsage.id) {
      // remove employee in asset table if latest user deleted
      await cloud_fleets.update(
        {
          cloudEmployeeId: null,
        },
        {
          where: { id: isUsageHistoryExist.cloudFleetId },
          transaction: transaction,
        }
      );
    }

    const deletedRowsCount = await cloud_usageHistories.destroy({
      where: { id: id, usageCategory: category, ...owner },
      transaction: transaction,
    });

    await transaction.commit();

    if (deletedRowsCount > 0) {
      return { success: true, data: {} };
    } else {
      return {
        success: false,
        error: "something went wrong while deleting the usage history",
      };
    }
  } catch (error) {
    await transaction.rollback();
    console.error("Transaction failed and rolled back: ", error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};
