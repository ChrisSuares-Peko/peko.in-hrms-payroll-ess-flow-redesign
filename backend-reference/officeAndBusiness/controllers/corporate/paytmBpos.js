const asyncHandler = require("../../middlewares/async");
const {
  createRequest,
  findAllBposByCorporate,
} = require("../../models/use-cases/paytmBpos");
const ErrorResponse = require("../../utils/error-response");

exports.createRequest = asyncHandler(async (req, res, next) => {
  const data = req.body;
  let credentialId = req.user.id;
  const result = await createRequest({ ...data, credentialId });

  if (!result) {
    return next(new ErrorResponse("Something went wrong while updating", 500));
  } else if (result.error) {
    return next(new ErrorResponse(result.error, 409));
  } else {
    return res.status(200).json({
      status: true,
      message: "Created demo request successfully",
      data: { result },
      responseCode: "000",
    });
  }
});

exports.fetchHistory = asyncHandler(async (req, res, next) => {
  let { searchText, page, itemsPerPage, column } = req.query;
  let corporateId = req.user.id;

  const sort = req.query.sort && req.query.sort === "DESC" ? "DESC" : "ASC";

  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
  let limit = itemsPerPage;

  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  let params = {
    searchText,
    sort,
    limit,
    offset,
    corporateId,
    column,
  };

  const transactionsData = await findAllBposByCorporate(params);
  if (!transactionsData) {
    return next(
      new ErrorResponse(`Something went wrong while getting your request`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      data: {
        result: transactionsData.rows,
        totalData: transactionsData.count,
      },
      message: "Request fetched successfully",
      responseCode: "000",
    });
  }
});
