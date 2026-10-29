const payoutBeneficiary = require("../entities/payoutBeneficiary");
const payoutTransaction = require("../entities/payoutTransaction");
const { Op, fn, col, } = require("sequelize");

exports.create = async (data) => {
  return await payoutBeneficiary.create(data);
};

exports.findAll = async ({ credentialId, status, searchText }) => {
  const where = { credentialId };
  if (status) where.status = status;
  if (searchText) {
    where[Op.or] = [
      { name: { [Op.like]: `%${searchText}%` } },
      { accountNumber: { [Op.like]: `%${searchText}%` } },
      { bankName: { [Op.like]: `%${searchText}%` } },
      { mobile: { [Op.like]: `%${searchText}%` } },
      { email: { [Op.like]: `%${searchText}%` } },
    ];
  }

  const [beneficiaries, stats] = await Promise.all([
    payoutBeneficiary.findAll({ where, order: [["createdAt", "DESC"]] }),
    payoutTransaction.findAll({
      where: { credentialId, status: "COMPLETED" },
      attributes: [
        "payoutBeneficiaryId",
        [fn("SUM", col("amount")), "totalPaid"],
        [fn("MAX", col("transactionDate")), "lastPaymentDate"],
      ],
      group: ["payoutBeneficiaryId"],
      raw: true,
    }),
  ]);

  const statsMap = {};
  for (const s of stats) {
    statsMap[s.payoutBeneficiaryId] = { totalPaid: s.totalPaid, lastPaymentDate: s.lastPaymentDate };
  }

  return beneficiaries.map((b) => {
    const plain = b.toJSON();
    const s = statsMap[plain.id] || {};
    plain.totalPaid = s.totalPaid || 0;
    plain.lastPaymentDate = s.lastPaymentDate || null;
    return plain;
  });
};

exports.findDuplicate = async ({ credentialId, accountNumber, ifscCode, upiId, excludeId }) => {
  const where = { credentialId };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  if (upiId) {
    where.upiId = upiId;
  } else {
    where.accountNumber = accountNumber;
    where.ifscCode = ifscCode;
  }

  return await payoutBeneficiary.findOne({ where });
};

exports.countActive = async (credentialId) => {
  return await payoutBeneficiary.count({
    where: { credentialId, status: "ACTIVE" },
  });
};

exports.findOne = async (id, credentialId) => {
  return await payoutBeneficiary.findOne({
    where: { id, credentialId },
  });
};

exports.update = async (id, credentialId, data) => {
  const [updated] = await payoutBeneficiary.update(data, {
    where: { id, credentialId },
  });
  return updated > 0;
};

exports.deleteOne = async (id, credentialId) => {
  const deleted = await payoutBeneficiary.destroy({
    where: { id, credentialId },
  });
  return deleted > 0;
};
