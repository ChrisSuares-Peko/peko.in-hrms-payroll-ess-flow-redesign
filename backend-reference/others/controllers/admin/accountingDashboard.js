const asyncHandler = require("../../middlewares/async");
const { getAccountingDashboard } = require("../../models/use-cases/accountingDashboard");

exports.getAccountingDashboard = asyncHandler(async (req, res) => {
    const data = await getAccountingDashboard({ refresh: Boolean(req.query.refresh) });
    return res.status(200).json({
        status: true,
        data,
        message: "Accounting dashboard fetched successfully",
        responseCode: "000",
    });
});
