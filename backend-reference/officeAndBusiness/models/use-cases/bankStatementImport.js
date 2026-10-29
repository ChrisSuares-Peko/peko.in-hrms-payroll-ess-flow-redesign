const asyncHandler = require("../../middlewares/async");
const bankStatementImport = require("../entities/bankStatementImport");

exports.createBankStatementImport = asyncHandler(async (data) =>
    bankStatementImport.create(data)
);

exports.findBankStatementImport = asyncHandler(async (where) =>
    bankStatementImport.findOne({ where })
);

exports.updateBankStatementImport = asyncHandler(async (where, data) => {
    const doc = await bankStatementImport.findOne({ where });
    if (!doc) return null;
    return doc.update(data);
});
