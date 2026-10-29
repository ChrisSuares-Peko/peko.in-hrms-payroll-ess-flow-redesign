const bankAccount = require("../entities/bankAccount");
const { Op } = require("sequelize");

exports.create = async (data) => {
  return await bankAccount.create(data);
};

exports.findAll = async ({ credentialId, status }) => {
  const where = { credentialId };
  if (status) where.status = status;
  return await bankAccount.findAll({ where, order: [["isPrimary", "DESC"], ["createdAt", "DESC"]] });
};

exports.findOne = async (id, credentialId) => {
  return await bankAccount.findOne({ where: { id, credentialId } });
};

exports.findDuplicate = async ({ credentialId, accountNumber, ifscCode, excludeId }) => {
  const where = { credentialId, accountNumber, ifscCode };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return await bankAccount.findOne({ where });
};

exports.update = async (id, credentialId, data) => {
  const [updated] = await bankAccount.update(data, { where: { id, credentialId } });
  return updated > 0;
};

exports.findPrimary = async (credentialId) => {
  return await bankAccount.findOne({ where: { credentialId, isPrimary: true, status: "ACTIVE" } });
};

exports.clearPrimary = async (credentialId) => {
  await bankAccount.update({ isPrimary: false }, { where: { credentialId } });
};

exports.deleteOne = async (id, credentialId) => {
  const deleted = await bankAccount.destroy({ where: { id, credentialId } });
  return deleted > 0;
};
