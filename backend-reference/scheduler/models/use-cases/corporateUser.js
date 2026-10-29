/* eslint-disable no-unused-vars */
const corporateUser = require("./../entities/corporateUser");
const credential = require("./../entities/credential");
const sequelize = require("../../configs/database/index");
const { QueryTypes } = require("sequelize");
//const sequelize = require('sequelize')
// const moment = require('moment')
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const packAge = require("../entities/package");
const { customLog } = require('../../utils/loggerHelper');
const {
  dailyReportScheduler,
  weeklyReportScheduler,
  monthlyReportScheduler,
  scheduleDailyReportOfCorporates,
  scheduleDailyReportOfCorporatesAdmin,
  scheduleWeeklyReportOfCorporates,
  scheduleMonthlyReportOfCorporates
} = require("../../services/scheduleReports");
const systemUser = require("../entities/systemUser");

const findCorporateUserData = asyncHandler(async (id) => {
  const data = await corporateUser.findOne({
    where: {
      credentialId: id,
    },
    attributes: [
      "id",
      "name",
      "email",
      "city",
      "dailyReport",
      "weeklyReport",
      "monthlyReport",
      // "accounts_id"
    ],
  });
  return data;
});

const findSystemUserData = asyncHandler(async (id) => {

  const data = await systemUser.findOne({
    where: {
      credentialId: id,
    },
    attributes: [
      "email",
      "dailyReport",
      "weeklyReport",
      "monthlyReport",
    ],
  });
  return data;
});

const fetchAllCorporates = asyncHandler(async (query, partnerId, res) => {
  return await corporateUser.findAll({
    include: [
      {
        model: credential,
        where: {
          registeredBy: partnerId,
          name: {
            [Op.like]: "%" + query + "%",
          },
        },
      },
    ],
    raw: true,
    nest: true,
  });
});

const updateDailyStatus = asyncHandler(async (id, isActive) => {
  try {
    const query = `
      UPDATE corporateUsers
      SET dailyReport = JSON_SET(dailyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `;

    await sequelize.query(query, {
      replacements: { id, isActive },
      type: QueryTypes.UPDATE,
    });

    customLog(null, "info", { message: "Corporate user report update route called" });

    return true;
  } catch (error) {
    customLog(null, "error", { error, message: "Failed to update dailyStatus" });
    throw new Error("Failed to update dailyStatus");
  }
});

const updateWeeklyStatus = asyncHandler(async (id, isActive) => {
  try {
    const query = `
      UPDATE corporateUsers
      SET weeklyReport = JSON_SET(weeklyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `;

    await sequelize.query(query, {
      replacements: { id, isActive },
      type: QueryTypes.UPDATE,
    });

    customLog(null, "info", { message: "Corporate user report update route called" });

    return true;
  } catch (error) {
    customLog(null, "error", { error, message: "Failed to update weeklyStatus" });
    throw new Error("Failed to update weeklyStatus");
  }
});

const updateMonthlyStatus = asyncHandler(async (id, isActive) => {
  try {
    const query = `
      UPDATE corporateUsers
      SET monthlyReport = JSON_SET(monthlyReport, '$.isActive', :isActive)
      WHERE credentialId = :id
    `;

    await sequelize.query(query, {
      replacements: { id, isActive },
      type: QueryTypes.UPDATE,
    });

    customLog(null, "info", { message: "Corporate user report update route called" });

    return true;
  } catch (error) {
    customLog(null, "error", { error, message: "Failed to update monthlyStatus" });
    throw new Error("Failed to update monthlyStatus");
  }
});

const updateWeeklyReport = asyncHandler(async (id, data) => {
  try {
    const existingUserData = await corporateUser.findOne({
      where: {
        credentialId: id,
      },
    });
    const updatedWeeklyReport = {
      ...existingUserData.weeklyReport,
      ...data,
    };
    await corporateUser.update(
      { weeklyReport: updatedWeeklyReport },
      {
        where: {
          credentialId: id,
        },
      }
    );
    const updatedUser = await corporateUser.findOne({
      where: {
        credentialId: id,
      },
      attributes: ["name", "credentialId", "weeklyReport"],
    });

    weeklyReportScheduler(updatedUser);
    return updatedUser;
  } catch (error) {
    customLog(null, "error", { error, message: "Failed to update weeklyReport" });
    throw new Error("Failed to update weeklyReport");
  }
});

const updateMonthlyReport = asyncHandler(async (id, data) => {
  try {
    const existingUserData = await corporateUser.findOne({
      where: {
        credentialId: id,
      },
    });
    if (!existingUserData) {
      throw new Error("User not found");
    }
    const updatedMonthlyReport = {
      ...existingUserData?.monthlyReport,
      ...data,
    };
    await corporateUser.update(
      { monthlyReport: updatedMonthlyReport },
      {
        where: {
          credentialId: id,
        },
      }
    );
    const updatedUser = await corporateUser.findOne({
      where: {
        credentialId: id,
      },
      attributes: ["name", "credentialId", "monthlyReport"],
    });
    monthlyReportScheduler(updatedUser);
    return updatedUser;
  } catch (error) {
    customLog(null, "error", { error, message: "Failed to update monthlyReport" });
    throw new Error("Failed to update monthlyReport");
  }
});

const updateDailyReport = asyncHandler(async (id, data) => {
  try {
    const existingUserData = await corporateUser.findOne({
      where: {
        credentialId: id,
      },
    });
    if (!existingUserData) {
      throw new Error("User not found");
    }
    const updatedDailyReport = {
      ...existingUserData?.dailyReport,
      ...data,
    };
    // Updating user data
    await corporateUser.update(
      { dailyReport: updatedDailyReport },
      {
        where: {
          credentialId: id,
        },
      }
    );

    // Retrieving the updated user data
    const updatedUser = await corporateUser.findOne({
      where: {
        credentialId: id,
      },
      attributes: ["name", "credentialId", "dailyReport"],
    });

    dailyReportScheduler(updatedUser);
    return updatedUser;
  } catch (error) {
    customLog(null, "error", { error, message: "Failed to update dailyReport" });
    throw new Error("Failed to update dailyReport");
  }
});

const findOneDetails = asyncHandler(async (params, attributes) => {
  const { corporateAttr, packageAttr, credentialsAttr } = attributes;
  return await corporateUser.findOne({
    include: [
      {
        model: packAge,
        attributes: packageAttr,
      },
      {
        model: credential,
        attributes: credentialsAttr,
      },
    ],
    where: {
      credentialId: params.corporateId,
    },
    attributes: corporateAttr,
    nest: true,
    raw: true,
  });
});

const updateDailyReportAndSendToAdmin = asyncHandler(async (id, data) => {
  try {
    // Fetch all corporate users
    // const corporateUsers = await corporateUser.findAll({attributes:["credentialId"],raw: true});

    const adminUser = await systemUser.findOne({
      where: {
        credentialId: id,
      },
      attributes: ["credentialId", "dailyReport", "email"], // Fetch the admin's current daily report
      raw: true,
    });

    if (adminUser) {
      // Merge existing dailyReport with new data for the admin
      const updatedDailyReport = {
        ...adminUser.dailyReport,
        ...data,
      };
      await sequelize.query(
        'UPDATE systemUsers SET dailyReport = :report WHERE credentialId = :id',
        {
          replacements: { report: JSON.stringify(updatedDailyReport), id },
        }
      );

      const admin = await systemUser.findOne({
        where: {
          credentialId: id,
        },
        attributes: ["credentialId", "dailyReport"],
      });
      // await scheduleDailyReportOfCorporates(corporateUsers, admin);
      await scheduleDailyReportOfCorporatesAdmin(admin);
    } else {
      customLog(null, "error", { message: "Admin user not found" });
    }

    return adminUser;
  } catch (error) {
    customLog(null, "error", { error, message: "Error updating daily report" });
    throw new Error("Failed to update daily report and notify scheduler");
  }
});




const updateMonthlyReportAllCorporates = asyncHandler(async (id, data) => {
  try {
    // const corporateUsers = await corporateUser.findAll({});

    const adminUser = await systemUser.findOne({
      where: {
        credentialId: id,
      },
      attributes: ["credentialId", "monthlyReport", "email"], // Fetch the admin's current daily report
      raw: true,
    });

    if (adminUser) {
      const updatedMonthlyReport = {
        ...adminUser.monthlyReport,
        ...data,
      };
      await sequelize.query(
        'UPDATE systemUsers SET monthlyReport = :report WHERE credentialId = :id',
        {
          replacements: { report: JSON.stringify(updatedMonthlyReport), id },
        }
      );

      const admin = await systemUser.findOne({
        where: {
          credentialId: id,
        },
        attributes: ["credentialId", "monthlyReport"],
      });

      await scheduleMonthlyReportOfCorporates(admin);
    } else {
      customLog(null, "error", { message: "Admin user not found" });
    }
    return adminUser;
  } catch (error) {
    customLog(null, "error", { error, message: "Failed to update dailyReport for all corporates" });
    throw new Error("Failed to update dailyReport for all corporates");
  }
});


const updateWeeklyReportAllCorporates = asyncHandler(async (id, data) => {
  try {
    // const corporateUsers = await corporateUser.findAll({});
    const adminUser = await systemUser.findOne({
      where: {
        credentialId: id,
      },
      attributes: ["credentialId", "weeklyReport", "email"], // Fetch the admin's current daily report
      raw: true,
    });

    if (adminUser) {
      const updatedWeeklyReport = {
        ...adminUser.weeklyReport,
        ...data,
      };
      await sequelize.query(
        'UPDATE systemUsers SET weeklyReport = :report WHERE credentialId = :id',
        {
          replacements: { report: JSON.stringify(updatedWeeklyReport), id },
        }
      );

      const admin = await systemUser.findOne({
        where: {
          credentialId: id,
        },
        attributes: ["credentialId", "weeklyReport"],
      });

      await scheduleWeeklyReportOfCorporates(admin);
    } else {
      customLog(null, "error", { message: "Admin user not found" });
    }
    return adminUser;
  } catch (error) {
    customLog(null, "error", { error, message: "Failed to update weeklyReport" });
    throw new Error("Failed to update weeklyReport");
  }
});

const fetchAlladminSchedulars = asyncHandler(async (query, partnerId, res) => {
  return await systemUser.findAll({
    attributes:['dailyReport','weeklyReport','monthlyReport','credentialId'],
    where: {
      [Op.or]: [
        { dailyReport: { [Op.ne]: null } },
        { weeklyReport: { [Op.ne]: null } },
        { monthlyReport: { [Op.ne]: null } }
      ]
    },
    raw: true,
    nest: true,
  });
});

const fetchAllCorporateSchedulars = asyncHandler(async (query, partnerId, res) => {
  return await corporateUser.findAll({
    attributes:['dailyReport','weeklyReport','monthlyReport','credentialId'],
    where: {
      [Op.or]: [
        { dailyReport: { [Op.ne]: null } },
        { weeklyReport: { [Op.ne]: null } },
        { monthlyReport: { [Op.ne]: null } }
      ]
    },
    raw: true,
    nest: true,
  });
});

const findOneWithId = asyncHandler(async (corporateUserID) => {
    return await corporateUser.findOne({
      where: {
        id: corporateUserID
      }
    })
  })

const findOne = asyncHandler(async (params, attributes = undefined) => {
  return await corporateUser.findOne({
    where: {
      credentialId: params.id,
    },
    attributes,
    nest: true,
    raw: true,
  });
});

module.exports = {
  updateWeeklyReportAllCorporates,
  updateDailyReportAndSendToAdmin,
  findSystemUserData,
  updateMonthlyReportAllCorporates,
  findOneDetails,
  updateDailyReport,
  updateMonthlyReport,
  updateWeeklyReport,
  updateMonthlyStatus,
  updateDailyStatus,
  fetchAllCorporates,
  findCorporateUserData,
  updateWeeklyStatus,
  fetchAlladminSchedulars,
  fetchAllCorporateSchedulars,
  findOneWithId
};