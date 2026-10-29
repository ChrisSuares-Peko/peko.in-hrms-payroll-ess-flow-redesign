const rentBill = require("../entities/rentBill");
const payoutBeneficiary = require("../entities/payoutBeneficiary");
const { Op } = require("sequelize");

exports.create = async (data) => {
  return await rentBill.create(data);
};

exports.findAll = async ({ credentialId, status, searchText }) => {
  const where = { credentialId };
  if (status) where.status = status;
  if (searchText) {
    where[Op.or] = [
      { landlordName: { [Op.like]: `%${searchText}%` } },
      { propertyAddress: { [Op.like]: `%${searchText}%` } },
      { rentPeriod: { [Op.like]: `%${searchText}%` } },
      { leaseAgreementNumber: { [Op.like]: `%${searchText}%` } },
    ];
  }

  return await rentBill.findAll({
    where,
    include: [{ model: payoutBeneficiary, attributes: ["id", "name", "accountNumber", "bankName"] }],
    order: [["createdAt", "DESC"]],
  });
};

exports.findOne = async (id, credentialId) => {
  return await rentBill.findOne({
    where: { id, credentialId },
    include: [{ model: payoutBeneficiary }],
  });
};

exports.update = async (id, credentialId, data) => {
  const [updated] = await rentBill.update(data, { where: { id, credentialId } });
  return updated > 0;
};

exports.deleteOne = async (id, credentialId) => {
  const deleted = await rentBill.destroy({ where: { id, credentialId } });
  return deleted > 0;
};

exports.markAsPaid = async (id, payoutTransactionId) => {
  const [updated] = await rentBill.update(
    { status: "PAID", payoutTransactionId },
    { where: { id } }
  );
  return updated > 0;
};
