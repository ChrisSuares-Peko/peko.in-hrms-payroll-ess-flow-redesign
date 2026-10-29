const billFetchLog = require("../entities/billFetchLog");
const credential = require("../entities/credential");
const { Op } = require("sequelize");

exports.create = async (data) => {
  return await billFetchLog.create(data);
};

exports.findAll = async ({ credentialId, statusCode, fromDate, toDate }) => {
  const where = {};
  if (credentialId) where.credentialId = credentialId;
  if (statusCode) where.statusCode = statusCode;
  if (fromDate && toDate) {
    where.createdAt = { [Op.between]: [fromDate, toDate] };
  }

  return await billFetchLog.findAll({
    where,
    include: [{ model: credential, attributes: ["id", "name", "email"] }],
    order: [["createdAt", "DESC"]],
  });
};
