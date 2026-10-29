const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { getCatalog } = require('../../services/droomCatalog');

// GET /car-report/catalog?category=&make=&model=&year=
// One endpoint serving all four cascade levels of the Valuation/Inspection forms'
// Vehicle Information section — which level comes back depends on which params are
// present, per the vendor's documented behavior (see DROOM_MYBIZ_API_REFERENCE.md).
// Response normalization here is a best guess until a live call confirms the vendor's
// actual payload shape (see the doc comment in services/droomCatalog.js).
exports.getCarReportCatalog = asyncHandler(async (req, res, next) => {
    const { category, make, model, year } = req.query;
    if (!category) {
        return next(new ErrorResponse('category is required', 400));
    }

    let vendorData;
    try {
        vendorData = await getCatalog({ category, make, model, year }, req?.LogTraceId);
    } catch (error) {
        return next(new ErrorResponse('Unable to fetch catalog options right now', 502));
    }

    const options = Array.isArray(vendorData)
        ? vendorData
        : Array.isArray(vendorData?.data)
          ? vendorData.data
          : [];

    return res.status(200).json({
        status: true,
        data: options,
        message: 'Catalog options fetched successfully',
        responseCode: '000',
    });
});
