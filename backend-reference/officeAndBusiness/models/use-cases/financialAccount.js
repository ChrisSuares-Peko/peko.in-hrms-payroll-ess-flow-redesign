const asyncHandler = require("../../middlewares/async");
const financialAccount = require("../entities/financialAccount");

exports.createFinancialAccount = asyncHandler(async (data) => financialAccount.create(data));

exports.findFinancialAccount = asyncHandler(async (where) => financialAccount.findOne({ where }));

exports.findFinancialAccounts = asyncHandler(async (where) =>
    financialAccount.findAll({ where, order: [["accountName", "ASC"]] })
);
