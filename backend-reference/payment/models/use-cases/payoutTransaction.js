const payoutTransaction = require("../entities/payoutTransaction");
const payoutBeneficiary = require("../entities/payoutBeneficiary");
const { Op } = require("sequelize");

const moment = require("moment");

exports.create = async (data) => {
  return await payoutTransaction.create(data);
};

exports.findOne = async (id, credentialId) => {
  return await payoutTransaction.findOne({
    where: { id, credentialId },
    include: [{ model: payoutBeneficiary }],
  });
};

exports.findByDecentroTxnId = async (decentroTxnId) => {
  return await payoutTransaction.findOne({ where: { decentroTxnId } });
};

exports.findByReferenceId = async (referenceId) => {
  return await payoutTransaction.findOne({ where: { referenceId } });
};

exports.updateStatus = async (id, status, decentroTxnId = null) => {
  const updateData = { status };
  if (decentroTxnId) updateData.decentroTxnId = decentroTxnId;
  const [updated] = await payoutTransaction.update(updateData, { where: { id } });
  return updated > 0;
};

exports.getRecentPayouts = async (credentialId, limit = 7) => {
  return await payoutTransaction.findAll({
    where: { credentialId },
    include: [{ model: payoutBeneficiary, attributes: ["name", "bankName"] }],
    order: [["transactionDate", "DESC"]],
    limit,
  });
};

exports.getMonthlyStats = async (credentialId) => {
  const startOfMonth = moment().startOf("month").toDate();
  const endOfMonth = moment().endOf("month").toDate();

  const where = {
    credentialId,
    transactionDate: { [Op.between]: [startOfMonth, endOfMonth] },
  };

  const [totalAmount, billsCount] = await Promise.all([
    payoutTransaction.sum("amount", {
      where: { ...where, status: "COMPLETED" },
    }),
    payoutTransaction.count({ where }),
  ]);

  return {
    totalPayoutsThisMonth: totalAmount || 0,
    billsThisMonth: billsCount || 0,
  };
};

exports.findAll = async ({ credentialId, status, category, from, to, searchText, page = 1, itemsPerPage = 10 }) => {
  const where = { credentialId };
  if (status) where.status = status;
  if (category) where.category = category;
  if (from && to) {
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    where.transactionDate = { [Op.between]: [from, tomorrow] };
  }
  if (searchText) {
    where[Op.or] = [
      { payeeName: { [Op.like]: `%${searchText}%` } },
      { referenceId: { [Op.like]: `%${searchText}%` } },
      { decentroTxnId: { [Op.like]: `%${searchText}%` } },
      { category: { [Op.like]: `%${searchText}%` } },
    ];
  }

  return await payoutTransaction.findAndCountAll({
    where,
    include: [{ model: payoutBeneficiary, attributes: ["name", "bankName", "accountNumber"] }],
    order: [["transactionDate", "DESC"]],
    limit: itemsPerPage,
    offset: (page - 1) * itemsPerPage,
  });
};

exports.findAllForExport = async ({ credentialId, status, category, from, to, searchText }) => {
  const where = { credentialId };
  if (status) where.status = status;
  if (category) where.category = category;
  if (from && to) {
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    where.transactionDate = { [Op.between]: [from, tomorrow] };
  }
  if (searchText) {
    where[Op.or] = [
      { payeeName: { [Op.like]: `%${searchText}%` } },
      { referenceId: { [Op.like]: `%${searchText}%` } },
      { decentroTxnId: { [Op.like]: `%${searchText}%` } },
      { category: { [Op.like]: `%${searchText}%` } },
    ];
  }

  return await payoutTransaction.findAll({
    where,
    include: [{ model: payoutBeneficiary, attributes: ["name", "bankName", "accountNumber"] }],
    order: [["transactionDate", "DESC"]],
    raw: true,
    nest: true,
  });
};
