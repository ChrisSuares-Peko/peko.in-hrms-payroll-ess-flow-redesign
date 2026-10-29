const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
  generateExcelBufferAndType,
} = require("../../utils/generateExcelBufferAndType");
const {
  getAllQuoteRequests,
  updateQuoteRequestStatus,
  getQuoteRequestExcelData,
} = require("../../models/use-cases/garage/garage_quote_request");

exports.getAllQuoteRequestsList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const itemsPerPage = parseInt(req.query.itemsPerPage, 10) || 10;
  const searchText = req.query.searchText || "";
  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  const sortField = req.query.sortField || "createdAt";
  const { status, insuranceType, from, to } = req.query;

  const params = { page, itemsPerPage, searchText, sort, sortField, status, insuranceType, from, to };

  try {
    const result = await getAllQuoteRequests(params);
    if (!result) {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch quote requests",
        data: {},
        responseCode: "001",
      });
    }
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: result.count,
        data: result.rows,
      },
      message: "Quote requests fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
      data: {},
      responseCode: "001",
    });
  }
});

exports.updateQuoteRequestStatus = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const result = await updateQuoteRequestStatus(id, { status, remarks });

    if (!result.success) {
      return next(new ErrorResponse(result.message || "Failed to update quote request", 400));
    }

    return res.status(200).json({
      status: true,
      data: result.data,
      message: "Quote request updated successfully",
      responseCode: "000",
    });
  } catch (error) {
    console.error("Update Quote Request Status Error:", error);
    next(new ErrorResponse(error?.message, 400));
  }
});

exports.exportQuoteRequests = asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  const searchText = req.query.searchText || req.query.search || "";
  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  const sortField = req.query.sortField || "createdAt";
  const { status, insuranceType, from, to } = req.query;

  const params = { searchText, sort, sortField, status, insuranceType, from, to };

  try {
    const data = await getQuoteRequestExcelData(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500));
    }
    if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500));
    }
    const { buffer, fileType } = await generateExcelBufferAndType(data, type);
    return res.status(200).json({
      status: true,
      data: { buffer, fileType },
      message: "Fetched excel/csv data successfully",
      responseCode: "000",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: `Something went wrong while generating report`,
      data: {},
      responseCode: "001",
    });
  }
});
