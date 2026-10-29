const vaLoadUnloadTransaction = require("../entities/vaLoadUnloadTransaction");
const { Op } = require("sequelize");

exports.create = async (data) => {
  return await vaLoadUnloadTransaction.create(data);
};

exports.findOne = async (id, credentialId) => {
  return await vaLoadUnloadTransaction.findOne({ where: { id, credentialId } });
};

exports.findByReferenceId = async (referenceId) => {
  return await vaLoadUnloadTransaction.findOne({ where: { referenceId } });
};

exports.findByDecentroTxnId = async (decentroTxnId) => {
  return await vaLoadUnloadTransaction.findOne({ where: { decentroTxnId } });
};

exports.updateOnSuccess = async (id, { decentroTxnId, status, providerMessage, bankReferenceNumber, responsePayload }) => {
  const updateData = {};
  if (decentroTxnId !== undefined) updateData.decentroTxnId = decentroTxnId;
  if (status !== undefined) updateData.status = status;
  if (providerMessage !== undefined) updateData.providerMessage = providerMessage;
  if (bankReferenceNumber !== undefined) updateData.bankReferenceNumber = bankReferenceNumber;
  if (responsePayload !== undefined) updateData.responsePayload = responsePayload;
  const [updated] = await vaLoadUnloadTransaction.update(updateData, { where: { id } });
  return updated > 0;
};

exports.updateOnFailure = async (id, { errorPayload, providerMessage }) => {
  const updateData = { status: "FAILED" };
  if (errorPayload !== undefined) updateData.errorPayload = errorPayload;
  if (providerMessage !== undefined) updateData.providerMessage = providerMessage;
  const [updated] = await vaLoadUnloadTransaction.update(updateData, { where: { id } });
  return updated > 0;
};

exports.findAll = async ({ credentialId, type, status, from, to, page = 1, itemsPerPage = 10 }) => {
  const where = { credentialId };
  if (type) where.type = type;
  if (status) where.status = status;
  if (from && to) {
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    where.transactionDate = { [Op.between]: [from, tomorrow] };
  }
  return await vaLoadUnloadTransaction.findAndCountAll({
    where,
    order: [["transactionDate", "DESC"]],
    limit: itemsPerPage,
    offset: (page - 1) * itemsPerPage,
  });
};
