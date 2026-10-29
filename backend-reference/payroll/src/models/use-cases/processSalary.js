const SalaryPayoutBatch = require('../entities/salaryPayoutBatch');
const SalaryPayoutTransaction = require('../entities/salaryPayoutTransaction');

const ACTIVE_PAYOUT_STATUSES = ['PENDING', 'INITIATED'];
const INITIATED_AMOUNT_STATUSES = ['PENDING', 'INITIATED', 'SUCCESS'];

exports.ACTIVE_PAYOUT_STATUSES = ACTIVE_PAYOUT_STATUSES;

exports.createSalaryPayoutBatch = async (data) => SalaryPayoutBatch.create(data);

exports.findSalaryPayoutBatch = async ({ corporateUser, batchReferenceId }) =>
  SalaryPayoutBatch.findOne({ corporateUser, batchReferenceId });

exports.findLatestSalaryPayoutBatch = async ({ corporateUser, month, year }) =>
  SalaryPayoutBatch.findOne({ corporateUser, month, year }).sort({ createdAt: -1 });

exports.updateSalaryPayoutBatch = async ({ batchReferenceId, corporateUser, data }) =>
  SalaryPayoutBatch.findOneAndUpdate(
    { batchReferenceId, corporateUser },
    { $set: data },
    { new: true }
  );

exports.createSalaryPayoutTransaction = async (data) =>
  SalaryPayoutTransaction.create(data);

exports.updateSalaryPayoutTransaction = async ({ id, data }) =>
  SalaryPayoutTransaction.findByIdAndUpdate(id, { $set: data }, { new: true });

exports.findSalaryPayoutTransactions = async ({ corporateUser, batchReferenceId }) =>
  SalaryPayoutTransaction.find({ corporateUser, batchReferenceId }).sort({ createdAt: 1 });

exports.findSalaryPayoutTransactionByReferenceId = async (referenceId) =>
  SalaryPayoutTransaction.findOne({ referenceId });

exports.findSalaryPayoutTransactionByDecentroTxnId = async (decentroTxnId) =>
  SalaryPayoutTransaction.findOne({ decentroTxnId });

exports.findRefreshableSalaryPayoutTransactions = async ({ corporateUser, batchReferenceId }) =>
  SalaryPayoutTransaction.find({
    corporateUser,
    batchReferenceId,
    $or: [
      { status: { $in: ACTIVE_PAYOUT_STATUSES } },
      {
        status: 'SUCCESS',
        $or: [
          { vaDebitStatus: { $ne: 'SUCCESS' } },
          { virtualAccountTransaction: { $exists: false } },
          { virtualAccountTransaction: null },
        ],
      },
    ],
  }).sort({ createdAt: 1 });

exports.findActiveSalaryPayoutBySalary = async ({ corporateUser, salaryId }) =>
  SalaryPayoutTransaction.findOne({
    corporateUser,
    salary: salaryId,
    status: { $in: ACTIVE_PAYOUT_STATUSES },
  }).sort({ createdAt: -1 });

exports.findLatestTransactionsBySalaryIds = async ({ corporateUser, salaryIds }) => {
  if (!Array.isArray(salaryIds) || salaryIds.length === 0) return {};

  const rows = await SalaryPayoutTransaction.aggregate([
    {
      $match: {
        corporateUser,
        salary: { $in: salaryIds },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$salary',
        transaction: { $first: '$$ROOT' },
      },
    },
  ]);

  return rows.reduce((acc, row) => {
    acc[String(row._id)] = row.transaction;
    return acc;
  }, {});
};

exports.recalculateSalaryPayoutBatch = async ({ corporateUser, batchReferenceId }) => {
  const transactions = await SalaryPayoutTransaction.find({
    corporateUser,
    batchReferenceId,
  });

  const summary = transactions.reduce(
    (acc, transaction) => {
      const amount = Number(transaction.amount || 0);
      acc.requestedCount += 1;
      acc.totalRequestedAmount += amount;

      if (transaction.status === 'SKIPPED') {
        acc.skippedCount += 1;
      } else if (transaction.status === 'FAILED') {
        acc.failedCount += 1;
      } else if (transaction.status === 'SUCCESS') {
        acc.successCount += 1;
      } else if (ACTIVE_PAYOUT_STATUSES.includes(transaction.status)) {
        acc.initiatedCount += 1;
      }

      if (INITIATED_AMOUNT_STATUSES.includes(transaction.status)) {
        acc.totalInitiatedAmount += amount;
      }

      return acc;
    },
    {
      requestedCount: 0,
      initiatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      successCount: 0,
      totalRequestedAmount: 0,
      totalInitiatedAmount: 0,
    }
  );

  const terminalCount = summary.skippedCount + summary.failedCount + summary.successCount;
  let status = 'PENDING';

  if (summary.requestedCount === 0) {
    status = 'PENDING';
  } else if (summary.initiatedCount > 0 && terminalCount > 0) {
    status = 'PARTIALLY_PROCESSING';
  } else if (summary.initiatedCount > 0) {
    status = 'PROCESSING';
  } else if (summary.successCount === summary.requestedCount) {
    status = 'COMPLETED';
  } else if (summary.successCount > 0) {
    status = 'PARTIALLY_COMPLETED';
  } else if (summary.failedCount > 0 || summary.skippedCount > 0) {
    status = 'FAILED';
  }

  return exports.updateSalaryPayoutBatch({
    corporateUser,
    batchReferenceId,
    data: {
      ...summary,
      totalRequestedAmount: Number(summary.totalRequestedAmount.toFixed(2)),
      totalInitiatedAmount: Number(summary.totalInitiatedAmount.toFixed(2)),
      status,
    },
  });
};
