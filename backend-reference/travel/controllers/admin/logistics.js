const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { fetchAllLogisticsCorporates } = require("../../models/use-cases/logistics");
const { uploadFile } = require("../../utils/commonUploadFile");
const shipmentOrders = require("../../models/entities/shipmentOrders");

exports.fetchLogisticsCorporateDetails = asyncHandler(async (req, res, next) => {
  try {
    const { searchText, page = 1, itemsPerPage = 10 } = req.query;
    const result = await fetchAllLogisticsCorporates({ searchText, page, itemsPerPage });
    return res.status(200).json({
      status: true,
      message: "Logistics corporate details fetched successfully",
      responseCode: "000",
      data: result,
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.adminUploadBusinessPan = asyncHandler(async (req, res, next) => {
  try {
    const { credentialId } = req.params;
    const { base64String, imageFormat } = req.body;

    if (!base64String || !imageFormat) {
      return next(new ErrorResponse("base64String and imageFormat are required", 400));
    }

    const filePath = `admin/logistics-pan/${credentialId}`;
    const url = await uploadFile(base64String, filePath, imageFormat, 5);

    await shipmentOrders.update(
      { businessPanUrl: url },
      { where: { credentialId: parseInt(credentialId) } }
    );

    return res.status(200).json({
      status: true,
      message: "Business PAN uploaded successfully",
      responseCode: "000",
      data: { url },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message });
    return next(new ErrorResponse("Something went wrong while uploading PAN", 500));
  }
});
