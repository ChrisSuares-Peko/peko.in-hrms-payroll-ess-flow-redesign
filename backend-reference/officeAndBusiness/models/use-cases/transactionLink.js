const asyncHandler = require("../../middlewares/async");
const transactionLink = require("../entities/transactionLink");

// Bulk-insert links; the UNIQUE (accountingTransactionId, targetType, targetId)
// index + ignoreDuplicates makes re-linking the same target a no-op.
exports.createLinks = asyncHandler(async (rows) =>
    transactionLink.bulkCreate(rows, { ignoreDuplicates: true })
);

exports.findLinksByTransaction = asyncHandler(async (accountingTransactionId) =>
    transactionLink.findAll({ where: { accountingTransactionId } })
);

exports.deleteLink = asyncHandler(async (where) => {
    const doc = await transactionLink.findOne({ where });
    if (!doc) return null;
    await doc.destroy();
    return true;
});
