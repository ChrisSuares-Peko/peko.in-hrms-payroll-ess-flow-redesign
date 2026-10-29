const otherBill = require("../entities/otherBill");
const payoutBeneficiary = require("../entities/payoutBeneficiary");
const { Op } = require("sequelize");

exports.create = async (data) => {
  return await otherBill.create(data);
};

exports.findAll = async ({ credentialId, status, searchText }) => {
  const where = { credentialId };
  if (status) where.status = status;
  if (searchText) {
    where[Op.or] = [
      { billTitle: { [Op.like]: `%${searchText}%` } },
      { payeeName: { [Op.like]: `%${searchText}%` } },
      { billReferenceNumber: { [Op.like]: `%${searchText}%` } },
    ];
  }

  return await otherBill.findAll({
    where,
    include: [{ model: payoutBeneficiary, attributes: ["id", "name", "accountNumber", "bankName"] }],
    order: [["createdAt", "DESC"]],
  });
};

exports.findOne = async (id, credentialId) => {
  return await otherBill.findOne({
    where: { id, credentialId },
    include: [{ model: payoutBeneficiary }],
  });
};

exports.update = async (id, credentialId, data) => {
  const [updated] = await otherBill.update(data, { where: { id, credentialId } });
  return updated > 0;
};

exports.deleteOne = async (id, credentialId) => {
  const deleted = await otherBill.destroy({ where: { id, credentialId } });
  return deleted > 0;
};

exports.markAsPaid = async (id, payoutTransactionId) => {
  const [updated] = await otherBill.update(
    { status: "PAID", payoutTransactionId },
    { where: { id } }
  );
  return updated > 0;
};
