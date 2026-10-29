"use strict";
const { Op } = require("sequelize");
const garage_operations_log = require("../../entities/garage/garage_operations_log");

exports.createLog = async (data) => {
  try {
    const log = await garage_operations_log.create(data);
    return { success: true, data: log };
  } catch (error) {
    console.error("Create Log Error:", error);
    return { success: false, message: "Unable to create log", error };
  }
};

exports.getAllOperationLogs = async (params) => {
  const { page, itemsPerPage, credentialId, sortField, sort, searchText, from, to } = params;

  try {
    const offset = (page - 1) * itemsPerPage;
    const order = [[sortField || "createdAt", sort || "DESC"]];

    let whereClause = {
      credentialId
    };

    if (searchText) {
      whereClause[Op.or] = [
        { actionType: { [Op.like]: `%${searchText}%` } },
        { referenceId: { [Op.like]: `%${searchText}%` } },
        { description: { [Op.like]: `%${searchText}%` } }
      ];
    }

     if (from && to) {
    const endDate = new Date(to);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    whereClause.createdAt = {
      [Op.between]: [from, endDate],
    };
  }

    return await garage_operations_log.findAndCountAll({
      where: whereClause,
      order,
      offset,
      limit: itemsPerPage
    });
  } catch (error) {
    console.error("Get All Operation Logs Error:", error);
    return false;
  }
};

exports.findOneLogAndUpdateTime = async ({ credentialId }) => {
  try {
    const log = await garage_operations_log.findOne({
      where: {
        credentialId,
      },
    });

    if (!log) {
      console.warn(`Log not found`);
      return null;
    }

    await log.changed('updatedAt', true);
    await log.save();

    return log;
  } catch (error) {
    console.error("Find One Log & Update Error:", error);
    return false;
  }
};

