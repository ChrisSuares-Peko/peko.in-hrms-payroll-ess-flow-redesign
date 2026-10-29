const asyncHandler = require("../../middlewares/async");
const {
  findAllOnboardingByAdmin,
  updateOnboardingStatusByAdmin,
} = require("../../models/use-cases/paymentLinkOnboarding");
const ErrorResponse = require("../../utils/error-response");

exports.listPayoutOnboarding = asyncHandler(async (req, res, next) => {
  try {
    let { searchText, page, itemsPerPage } = req.query;

    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    const sortField = req.query.sortField || "createdAt";
    const from = req.query.from;
    const to = req.query.to;

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
    const limit = itemsPerPage;
    const offset = (page - 1) * itemsPerPage;

    const result = await findAllOnboardingByAdmin({
      limit,
      offset,
      searchText,
      sort,
      sortField,
      from,
      to,
    });

    if (!result) {
      return next(new ErrorResponse("Something went wrong while fetching payout onboarding records", 400));
    }

    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: result.count,
        data: result.rows,
      },
      message: "Payout onboarding records fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    console.log("🚀 ~ listPayoutOnboarding ~ error:", error);
    return next(new ErrorResponse("Something went wrong while fetching payout onboarding records", 400));
  }
});

exports.updatePayoutOnboardingStatus = asyncHandler(async (req, res, next) => {
  try {
    const { onboardingId } = req.params;
    const { status } = req.body;

    const validStatuses = ["approval-pending", "active", "suspended", "rejected"];
    if (!status || !validStatuses.includes(status)) {
      return next(new ErrorResponse("Invalid status value", 400));
    }

    const updated = await updateOnboardingStatusByAdmin({
      id: parseInt(onboardingId),
      status,
    });

    if (!updated) {
      return next(new ErrorResponse("Onboarding record not found", 404));
    }

    return res.status(200).json({
      status: true,
      data: updated,
      message: "Payout onboarding status updated successfully",
      responseCode: "000",
    });
  } catch (error) {
    console.log("🚀 ~ updatePayoutOnboardingStatus ~ error:", error);
    return next(new ErrorResponse(error.message || "Something went wrong while updating status", error.statusCode || 400));
  }
});
