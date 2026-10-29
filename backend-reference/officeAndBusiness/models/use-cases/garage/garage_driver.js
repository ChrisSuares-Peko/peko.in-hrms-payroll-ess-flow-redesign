"use strict";
const { Op } = require("sequelize");
const { handleSortFields } = require("../../../utils/sortHandle");
const { garage_driver: GarageDriver, garage_assignment, garage_fleet } = require("../../entities/garage");
const sequelize = require("../../../configs/database/index");
const garage_operations_log = require("../../entities/garage/garage_operations_log");
const { createLog } = require("./garage_logs");
const { customLog } = require("../../../utils/loggerHelper");

exports.createDriver = async (data, credentialId, logTraceId = null) => {
  data.credentialId = credentialId;
  let transaction = await sequelize.transaction();
  try {
    //checking fleet already exist
    const existingDriver = await GarageDriver.findOne({
      where: {
        [Op.or]: [
          {
            dlNumber: data.dlNumber,
            credentialId,
          },
        ],
      },
    });

    if (existingDriver) {
      return {
        success: false,
        error: "This driver is already added to your fleet.",
      };
    }

    const responseData = await GarageDriver.create(data, {
      transaction: transaction,
    });
    if (!responseData) {
      return { success: false, error: "Failed to create driver." };
    }

    await garage_operations_log.create(
      {
        actionType: "ADD_DRIVER",
        referenceId: data.verification_id,
        description: `Driver added with DL number: ${data.dlNumber}`,
        meta:{dlNumber:data.dlNumber},
        credentialId,
      },
      {
        transaction: transaction,
      }
    );
    await transaction.commit();
    return { success: true, data: responseData };
  } catch (error) {
    await transaction.rollback();
    customLog(logTraceId, "error", { message: "createDriver failed", error: error?.message ?? String(error), stack: error?.stack });
    return { success: false, error: "Something went wrong. If the issue persists, please contact support at reach@peko.one" };
  }
};

// exports.createDriver = async (data) => {
//   try {
//     const driver = await GarageDriver.create(data);
//     return { success: true, data: driver };
//   } catch (error) {
//     console.error("Create Driver Error:", error);
//     return { success: false, message: "Unable to create driver", error };
//   }
// };

exports.getAllDrivers = async (params) => {
  const { page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId } = params;
  try {
    const offset = (page - 1) * itemsPerPage;
    const order = handleSortFields(sortField, sort);

    let whereClause = { status: true };

    if (searchText) {
      whereClause = {
        [Op.or]: [
          { dlNumber: { [Op.like]: `%${searchText}%` } },
          { name: { [Op.like]: `%${searchText}%` } },
          { fatherName: { [Op.like]: `%${searchText}%` } },
          { address: { [Op.like]: `%${searchText}%` } },
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

    return await GarageDriver.findAndCountAll({
      limit: itemsPerPage,
      offset,
      order,
      where: whereClause,
      include: [
        {
          model: garage_assignment,
          as: "assignments",
          where: {
            assignmentType: { [Op.in]: ["Assigned", "Reassigned"] },
          },
          required: false,
          include: [
            {
              model: garage_fleet,
              as: "fleet",
              attributes: ["id", "vehicleNumber", "manufacturer", "model"],
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error("Get All Drivers Error:", error);
    return false;
  }
};

exports.getDriverById = async (id) => {
  try {
    const driver = await GarageDriver.findOne({ where: { id, status: true } });

    if (!driver) {
      return { success: false, message: "Driver not found" };
    }

    return { success: true, data: driver };
  } catch (error) {
    console.error("Get Driver By ID Error:", error);
    return { success: false, message: "Unable to fetch driver", error };
  }
};

exports.findOneDriver = async (params, logTraceId = null) => {
  try {
    params.status = true;
    const driver = await GarageDriver.findOne({ where: params,include: [
      {
        model: garage_assignment,
        as: "assignments",
        where: {
          assignmentType: { [Op.in]: ["Assigned", "Reassigned"] },
        },
        required: false,
        include: [
          {
            model: garage_fleet,
            as: "fleet",
            attributes: ["id", "vehicleNumber", "manufacturer", "model"],
          },
        ],
      },
    ], });

    if (!driver) {
      return { success: false, message: "Driver not found" };
    }

    return { success: true, data: driver };
  } catch (error) {
     customLog(logTraceId, "error", { error:error,message:"Get Driver By ID Error:" });
    console.error("Find Driver Error:", error);
    return { success: false, message: "Unable to fetch driver", error };
  }
};

exports.deleteDriverById = async (id, credentialId) => {
  try {
    const driver = await GarageDriver.findOne({ where: { id, credentialId } });
    if (!driver) {
      return { success: false, message: "Driver not found" };
    }

    const existingAssignment = await garage_assignment.findOne({
      where: {
        driverId: id,
        assignmentType: {
          [Op.in]: ["Assigned", "Reassigned"],
        },
      },
    });

    if (existingAssignment) {
      return { success: false, message: "Driver is assigned to a vehicle and cannot be deleted" };
    }

    await driver.destroy(); // permanent delete
    await createLog({
      actionType: "DELETE_DRIVER",
      meta: { dlNumber: driver.dlNumber },
      referenceId: id,
      description: `Driver deleted with DL number: ${driver.dlNumber}`,
      credentialId,
    });
    return { success: true, message: "Driver permanently deleted" };
  } catch (error) {
    console.error("Delete Driver Error:", error);
    return { success: false, message: "Unable to delete driver", error };
  }
};

exports.getDriverStats = async (params) => {
  const { credentialId, subCorporateUserId } = params;

  try {
    let whereClause = { status: true };

    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }

    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const [totalDrivers, expiringSoonDrivers] = await Promise.all([
      GarageDriver.count({ where: whereClause }),
      GarageDriver.count({
        where: {
          ...whereClause,
          transportValidTo: {
            [Op.between]: [today, next30Days],
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalDrivers,
        dlExpiringSoon: expiringSoonDrivers,
      },
    };
  } catch (error) {
    console.error("Get Driver Stats Error:", error);
    return { success: false, message: "Unable to fetch driver stats", error };
  }
};

exports.getExcelCSVData = async (params) => {
  let { from, to, sort, sortField, credentialId } = params;

  const searchText = (params.searchText || "").trim();

  let whereClause = { credentialId };

  if (searchText) {
    whereClause[Op.or] = [
      { id: { [Op.like]: `%${searchText}%` } },
      { dlNumber: { [Op.like]: `%${searchText}%` } },
      { name: { [Op.like]: `%${searchText}%` } },
      { dateOfIssue: { [Op.like]: `%${searchText}%` } },
      { address: { [Op.like]: `%${searchText}%` } }
    ];
  }

  if (from && to) {
    let tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    whereClause.createdAt = {
      [Op.between]: [from, tomorrow],
    };
  }

  let sortClause;
  if (sort) {
    sortClause = [sortField, sort];
  } else {
    sortClause = [sortField, "ASC"];
  }

  const data = await GarageDriver.findAndCountAll({
    include: [
      {
        model: garage_assignment,
        as: "assignments",
        where: {
          assignmentType: { [Op.in]: ["Assigned", "Reassigned"] },
        },
        required: false,
        include: [
          {
            model: garage_fleet,
            as: "fleet",
            attributes: ["id", "vehicleNumber", "manufacturer", "model"],
          },
        ],
      },
    ],
    where: whereClause,
    order: [sortClause],
    raw: true,
    nest: true,
  });

  let finalData = [];
  data.rows.forEach(function (limitData) {
    const capitalize = (str) => {
    if (!str) return "Not Available";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };
    finalData.push({
      Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : "Not Available",
      Name: limitData.name ? limitData.name : "Not Available",
      "DL Number": limitData.dlNumber ? limitData.dlNumber : "Not Available",
      "License Validity": limitData.nonTransportValidTo ? formattedDateTime(limitData.nonTransportValidTo) : "Not Available",
      "State of Issue": limitData?.rawData?.details_of_driving_licence?.address_list[0]?.split_address?.state[0][0] ? capitalize(limitData.rawData.details_of_driving_licence.address_list[0].split_address.state[0][0]) : "Not Available",
      "Vehicle Assigned": limitData.assignments?.fleet?.vehicleNumber ? limitData.assignments?.fleet?.vehicleNumber : "Not Available",
      // "Date of Issue": limitData.dateOfIssue ? formattedDateTime(limitData.dateOfIssue) : "Not Available",
      "DL Status": limitData.verificationStatus ? capitalize(limitData.verificationStatus) : "Not Available",
      "Photo Url": limitData.photoUrl ? limitData.photoUrl : "Not Available",

    });
  });
  return finalData;
};

exports.getGarageDriverUsage = async (credentialId) => {
  try {
    const count = await GarageDriver.count({
      where: {
        credentialId,
      },
    });
    return { success: true, data: count };
  } catch (error) {
    console.error('getGarageDriverUsage error:', error);
    return { success: false, message: 'Failed to fetch driver usage', error };
  }
};

const formattedDateTime = (datetime) =>
  datetime.toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true, // For AM/PM format
    timeZone: "Asia/Kolkata", // Indian Standard Time
  });