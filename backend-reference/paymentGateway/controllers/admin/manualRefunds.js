const asyncHandler = require("../../middlewares/async");
const { findAllManualRefunds, updateManualRefundStatus } = require("../../models/use-cases/manualRefunds");
const { notifyManualRefundStatus } = require("../../utils/manualRefundNotifications");

const failureStatusCode = (result) => {
  if (result.notFound) return 404;
  if (result.conflict) return 409;
  return 400;
};

exports.getManualRefunds = asyncHandler(async (req, res) => {
  const result = await findAllManualRefunds(req.query);
  return res.status(200).json({
    status: true,
    message: "Manual refunds fetched successfully.",
    responseCode: "000",
    data: {
      recordsTotal: result.recordsTotal,
      recordsFiltered: result.recordsTotal,
      rows: result.rows,
      statuses: result.statuses,
    },
  });
});

exports.updateManualRefund = asyncHandler(async (req, res) => {
  const result = await updateManualRefundStatus({
    id: req.params.manualRefundId,
    status: req.body.status,
    refundReference: req.body.refundReference,
    remarks: req.body.remarks,
    adminId: req.user?.id,
  });

  if (!result.status) {
    return res.status(failureStatusCode(result)).json({
      status: false,
      message: result.message,
      responseCode: "001",
      data: {},
    });
  }

  await notifyManualRefundStatus({ ...result.data, logTraceId: req?.LogTraceId });

  return res.status(200).json({
    status: true,
    message: result.message,
    responseCode: "000",
    data: {},
  });
});
