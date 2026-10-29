const asyncHandler = require("../../middlewares/async");
const transactionDocument = require("../entities/transactionDocument");

exports.createTransactionDocument = asyncHandler(async (data) => transactionDocument.create(data));

exports.findTransactionDocument = asyncHandler(async (where) =>
    transactionDocument.findOne({ where })
);

exports.deleteTransactionDocument = asyncHandler(async (where) => {
    const doc = await transactionDocument.findOne({ where });
    if (!doc) return null;
    await doc.destroy();
    return true;
});
