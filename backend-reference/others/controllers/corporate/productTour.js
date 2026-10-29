const asyncHandler = require("../../middlewares/async");
const {
  enableProductTour,
  enableProductTourSingle,
} = require("../../models/use-cases/productTour");
const ErrorResponse = require("../../utils/error-response");

exports.alterproductTour = asyncHandler(async (req, res, next) => {
  const { type, service } = req.body;
  const id = req.user.id;
  let result;
  if (type === "All") {
    result = await enableProductTour(id);
  } else if (type === "Single") {
    result = await enableProductTourSingle(id, service);
  }
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Product tour updated successfully",
      data: { result },
      responseCode: "000",
    });
  }
});
