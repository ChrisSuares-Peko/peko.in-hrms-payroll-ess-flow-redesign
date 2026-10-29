const vendorPayout = require("../entities/vendorPayout");
const payoutBeneficiary = require("../entities/payoutBeneficiary");
const { Op } = require("sequelize");

exports.create = async (data) => {
  return await vendorPayout.create(data);
};

exports.findAll = async ({ credentialId, status, searchText }) => {
  const where = { credentialId };
  if (status) where.status = status;
  if (searchText) {
    where[Op.or] = [
      { vendorName: { [Op.like]: `%${searchText}%` } },
      { invoiceNumber: { [Op.like]: `%${searchText}%` } },
      { description: { [Op.like]: `%${searchText}%` } },
    ];
  }

  return await vendorPayout.findAll({
    where,
    include: [{ model: payoutBeneficiary, attributes: ["id", "name", "accountNumber", "bankName"] }],
    order: [["createdAt", "DESC"]],
  });
};

exports.findOne = async (id, credentialId) => {
  return await vendorPayout.findOne({
    where: { id, credentialId },
    include: [{ model: payoutBeneficiary }],
  });
};

exports.update = async (id, credentialId, data) => {
  const [updated] = await vendorPayout.update(data, { where: { id, credentialId } });
  return updated > 0;
};

exports.deleteOne = async (id, credentialId) => {
  const deleted = await vendorPayout.destroy({ where: { id, credentialId } });
  return deleted > 0;
};

exports.markAsPaid = async (id, payoutTransactionId) => {
  const [updated] = await vendorPayout.update(
    { status: "PAID", payoutTransactionId },
    { where: { id } }
  );
  return updated > 0;
};
