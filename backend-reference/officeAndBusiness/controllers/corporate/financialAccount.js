const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const {
    createFinancialAccount: insertFinancialAccount,
    findFinancialAccounts,
} = require("../../models/use-cases/financialAccount");

const subUserId = (req) =>
    req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId
        ? req.user.subCorporateId
        : null;

// GET /accounting/financial-accounts — active accounts for the corporate (filter + import).
exports.getFinancialAccounts = asyncHandler(async (req, res, next) => {
    try {
        const rows = await findFinancialAccounts({
            corporateUserId: req.user.corporateId,
            isActive: true,
        });
        return res.status(200).json({
            status: true,
            message: "Financial accounts fetched successfully",
            data: rows.map((a) => ({
                id: a.id,
                accountName: a.accountName,
                accountNumber: a.accountNumber,
                bankName: a.bankName,
                ifscCode: a.ifscCode,
                accountType: a.accountType,
                currency: a.currency,
            })),
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// POST /accounting/financial-accounts
exports.createFinancialAccount = asyncHandler(async (req, res, next) => {
    try {
        const { accountName, accountNumber, bankName, ifscCode, accountType, currency } = req.body;
        const created = await insertFinancialAccount({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            accountName,
            accountNumber: accountNumber || null,
            bankName: bankName || null,
            ifscCode: ifscCode || null,
            accountType: accountType || "Other",
            currency: currency || "INR",
        });
        return res.status(200).json({
            status: true,
            message: "Financial account created successfully",
            data: { id: created.id },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});
