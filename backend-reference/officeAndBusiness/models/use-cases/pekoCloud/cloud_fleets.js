const asyncHandler = require("../../../middlewares/async");
const cloud_fleets = require("../../entities/pekoCloud/cloud_fleets");
const { Op } = require("sequelize");
const cloud_employees = require("../../entities/pekoCloud/cloud_employees");
const sequelize = require("../../../configs/database/index");
// const { createUsageHistory } = require("./cloud_fleetUsageHistories");
const cloud_usageHistories = require("../../entities/pekoCloud/cloud_usageHistories");
const cloud_documents = require("../../entities/pekoCloud/cloud_documents");
const cloud_maintenances = require("../../entities/pekoCloud/cloud_maintenances");
const ErrorResponse = require("../../../utils/error-response");

let category = "FLEET";
exports.createFleet = asyncHandler(async (data) => {
  let transaction = await sequelize.transaction();
  try {
    //checking fleet already exist
    const existingFleet = await cloud_fleets.findOne({
      where: {
        [Op.or]: [
          {
            vehicleNumber: data.vehicleNumber,
            credentialId: data.credentialId,
          },
        ],
      },
    });

    if (existingFleet) {
      return {
        success: false,
        error: "Fleet with this vehicle number already exists",
      };
    }

    if (data.cloudEmployeeId) {
      const existEmployee = await cloud_employees.findOne({
        where: {
          id: data.cloudEmployeeId,
        },
      });
      if (!existEmployee) {
        return {
          success: false,
          error: "employee is not existing with the given details",
        };
      }
    }

    const responseData = await cloud_fleets.create(data, {
      transaction: transaction,
    });
    if (!responseData) {
      return { success: false, error: "Failed to create fleet." };
    }

    if (responseData.cloudEmployeeId) {
      // create usage history with the assigned employee
      await cloud_usageHistories.create(
        {
          cloudEmployeeId: responseData.cloudEmployeeId,
          usageCategory: category,
          cloudFleetId: responseData.id,
          assignDate: responseData.createdAt,
          credentialId: responseData.credentialId,
        },
        {
          transaction: transaction,
        }
      );
    }
    await transaction.commit();
    return { success: true, data: responseData };
  } catch (error) {
    await transaction.rollback();
    console.error("Transaction failed and rolled back: ", error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
});

exports.findSingleFleet = asyncHandler(async (id, owner = {}) => {
  try {
    //fetch single fleet
    const fleet = await cloud_fleets.findOne({
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

    return { success: true, data: fleet };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
});

exports.findAllFleetsList = async (credentialId, subCorporateUserId) => {
  try {
    let whereClause = {};
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }

    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const fleetsData = await cloud_fleets.findAndCountAll({
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

    return { success: true, data: fleetsData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};
exports.findAllFleets = async (
  page,
  itemsPerPage,
  sortField,
  sort,
  searchText,
  credentialId,
  subCorporateUserId
) => {
  try {
    const offset = (page - 1) * itemsPerPage;

    let whereClause = {};
    if (searchText) {
      whereClause = {
        [Op.or]: [
          { vehicleName: { [Op.like]: `%${searchText}%` } },
          { vehicleNumber: { [Op.like]: `%${searchText}%` } },
          { vehicleType: { [Op.like]: `%${searchText}%` } },
          { assetType: { [Op.like]: `%${searchText}%` } },
          { modelYear: { [Op.like]: `%${searchText}%` } },
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

    const fleetsData = await cloud_fleets.findAndCountAll({
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
      order: [[sortField, sort]],
      where: whereClause,
    });

    return { success: true, data: fleetsData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};

exports.findAllFleetsUsageHistories = async (
  page,
  itemsPerPage,
  sortField,
  sort,
  searchText,
  credentialId,
  subCorporateUserId
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

    if (credentialId) {
      whereClause.credentialId = credentialId;
    }

    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
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
          model: cloud_fleets,
          attributes: [
            "id",
            "vehicleName",
            "vehicleType",
            "vehicleNumber",
            "purchasedDate",
            "dateOfRenewal",
            "amount",
            "modelYear",
          ],
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

exports.updateFleet = async (id, newData, owner = {}) => {
  try {
    const isFleetExist = await cloud_fleets.findOne({
      where: { id, ...owner },
    });

    if (!isFleetExist) {
      return {
        success: false,
        error: "fleet is not existing with the given details",
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

    const updateFleet = await cloud_fleets.update(newData, {
      where: { id: id, ...owner },
    });

    if (updateFleet[0] === 0) {
      return {
        success: false,
        error: "something went wrong while updating the fleet",
      };
    }

    return { success: true, data: {} };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};

exports.assignFleet = async (newData, credentialId) => {
  const {
    newEmployeeId,
    fleetId,
    newAssignDate,
    existUsageId,
    existReturnDate,
    existReturnStatus,
    existRemarks,
  } = newData;
  let transaction = await sequelize.transaction();
  try {
    const isFleetExist = await cloud_fleets.findOne({
      where: { id: fleetId },
    });

    if (!isFleetExist) {
      return {
        success: false,
        error: "fleet is not existing with the given details",
      };
    }

    if (newEmployeeId) {
      const existEmployee = await cloud_employees.findOne({
        where: {
          id: newEmployeeId,
        },
      });
      if (!existEmployee) {
        return {
          success: false,
          error: "employee is not existing with the given details",
        };
      }
    }

    // if fleet already assigned
    if (isFleetExist.cloudEmployeeId) {
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
        cloudFleetId: fleetId,
        assignDate: newAssignDate,
        credentialId: credentialId,
      },
      {
        transaction: transaction,
      }
    );

    // update user on fleet table
    const updateFleet = await cloud_fleets.update(
      { cloudEmployeeId: newEmployeeId },
      {
        where: { id: fleetId },
        transaction: transaction,
      }
    );

    if (updateFleet[0] === 0) {
      return {
        success: false,
        error: "something went wrong while updating the fleet",
      };
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

exports.deleteFleet = async (id, owner = {}) => {
  let transaction = await sequelize.transaction();
  try {
    const isFleetExist = await cloud_fleets.findOne({
      where: { id, ...owner },
    });

    if (!isFleetExist) {
      return {
        success: false,
        error: "fleet is not existing with the given details",
      };
    }

    await cloud_documents.destroy({
      where: { cloudFleetId: id, documentCategory: category },
      transaction: transaction,
    });

    await cloud_maintenances.destroy({
      where: { cloudFleetId: id, maintenanceCategory: category },
      transaction: transaction,
    });

    await cloud_usageHistories.destroy({
      where: { cloudFleetId: id, usageCategory: category },
      transaction: transaction,
    });

    const deletedFleetRowsCount = await cloud_fleets.destroy({
      where: { id: id, ...owner },
      transaction: transaction,
    });
    if (deletedFleetRowsCount == 0) {
      return { success: false, error: "fleet is not able to delete try again" };
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
