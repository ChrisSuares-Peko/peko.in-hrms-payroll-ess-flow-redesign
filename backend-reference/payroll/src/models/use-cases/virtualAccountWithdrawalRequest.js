const VirtualAccountWithdrawalRequest = require('../entities/virtualAccountWithdrawalRequest');

exports.createWithdrawalRequest = async (data) =>
  VirtualAccountWithdrawalRequest.create(data);

exports.updateWithdrawalRequest = async ({ id, data }) =>
  VirtualAccountWithdrawalRequest.findByIdAndUpdate(id, data, { new: true });

exports.findWithdrawalRequestByReferenceId = async (referenceId) =>
  VirtualAccountWithdrawalRequest.findOne({ referenceId });

exports.findWithdrawalRequestByDecentroTxnId = async (decentroTxnId) =>
  VirtualAccountWithdrawalRequest.findOne({ decentroTxnId });

exports.findWithdrawalRequestsByCorporateUser = async ({
  corporateUser,
  page = 1,
  limit = 10,
}) => {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
  const skip = (safePage - 1) * safeLimit;

  const [rows, count] = await Promise.all([
    VirtualAccountWithdrawalRequest.find({ corporateUser })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    VirtualAccountWithdrawalRequest.countDocuments({ corporateUser }),
  ]);

  return {
    rows,
    count,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(count / safeLimit),
  };
};
