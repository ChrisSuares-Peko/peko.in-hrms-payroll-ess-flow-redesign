const billPayout = require("../entities/billPayout");
const payoutBeneficiary = require("../entities/payoutBeneficiary");
const { Op } = require("sequelize");

exports.create = async (data) => {
  return await billPayout.create(data);
};

exports.findAll = async ({ credentialId, status, searchText }) => {
  const where = { credentialId };
  if (status) where.status = status;
  if (searchText) {
    where[Op.or] = [
      { billTitle: { [Op.like]: `%${searchText}%` } },
      { billerName: { [Op.like]: `%${searchText}%` } },
      { billNumber: { [Op.like]: `%${searchText}%` } },
      { billPeriod: { [Op.like]: `%${searchText}%` } },
    ];
  }

  return await billPayout.findAll({
    where,
    include: [{ model: payoutBeneficiary, attributes: ["id", "name", "accountNumber", "bankName"] }],
    order: [["createdAt", "DESC"]],
  });
};

exports.findOne = async (id, credentialId) => {
  return await billPayout.findOne({
    where: { id, credentialId },
    include: [{ model: payoutBeneficiary }],
  });
};

exports.update = async (id, credentialId, data) => {
  const [updated] = await billPayout.update(data, { where: { id, credentialId } });
  return updated > 0;
};

exports.deleteOne = async (id, credentialId) => {
  const deleted = await billPayout.destroy({ where: { id, credentialId } });
  return deleted > 0;
};

exports.markAsPaid = async (id, payoutTransactionId) => {
  const [updated] = await billPayout.update(
    { status: "PAID", payoutTransactionId },
    { where: { id } }
  );
  return updated > 0;
};
