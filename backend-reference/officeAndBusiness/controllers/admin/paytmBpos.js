const asyncHandler = require("../../middlewares/async");
const {
  findAllRequestAndCount,
  updateBposStatus,
} = require("../../models/use-cases/paytmBpos");
const ErrorResponse = require("../../utils/error-response");

exports.findAllRequestAndCount = asyncHandler(async (req, res, next) => {
  try {
    let { from, to, searchText, page, itemsPerPage } = req.query;

    const sort = req.query.sort && req.query.sort === "DESC" ? "DESC" : "ASC";
    let column = "createdAt";

    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage;

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }
    let params = {
      limit,
      offset,
      from,
      to,
      sort,
      searchText,
      column,
    };
    const invoiceData = await findAllRequestAndCount(params);
    if (!invoiceData) {
      return next(
        new ErrorResponse(
          `Something went wrong while getting all invoices from database`,
          500
        )
      );
    } else {
      return res.status(200).json({
        status: true,
        data: {
          recordsTotal: invoiceData ? invoiceData.count : 0,
          recordsFiltered: invoiceData ? invoiceData.count : 0,
          data: invoiceData ? invoiceData.rows : 0,
        },
        message: "Fetched all demo requests successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    next(new ErrorResponse(error.message, 400));
  }
});

exports.updateStatus = asyncHandler(async (req, res, next) => {
  let params = req.params;
  let data = req.body;

  let result = await updateBposStatus(params, data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while updating status`, 400)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "status updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});
