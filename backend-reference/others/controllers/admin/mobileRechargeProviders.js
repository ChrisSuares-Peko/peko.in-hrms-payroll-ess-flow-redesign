const {
    createOne,
    findAll,
    updateOne,
    deleteOne,
    findByProviderName,
    updateStatus,
} = require("../../models/use-cases/mobileRechargeProvider");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");

exports.createMobileRechargeProvider = asyncHandler(async (req, res, next) => {
    const data = req.body;

    if (!data || !String(data.providerName || "").trim()) {
        return next(new ErrorResponse(`Provider name is required`, 400));
    }

    const isProviderAvailable = await findByProviderName(data.providerName);
    if (isProviderAvailable) {
        return next(
            new ErrorResponse(
                `Mobile Recharge Provider Already Exists with this name`,
                403
            )
        );
    }

    const result = await createOne(data);
    if (!result) {
        return next(
            new ErrorResponse(
                `Something went wrong while adding Mobile Recharge Provider`,
                500
            )
        );
    } else {
        return res.status(200).json({
            status: true,
            data: result,
            message: "Mobile recharge provider added successfully",
            responseCode: "000",
        });
    }
});

exports.findAllMobileRechargeProvidersAndCount = asyncHandler(
    async (req, res, next) => {
        let { searchText, page, itemsPerPage } = req.query;

        const sort =
            req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
        let sortField = req.query.sortField || "createdAt";

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
            searchText,
            sort,
            sortField,
        };

        const mobileRechargeProviderData = await findAll(params);
        if (!mobileRechargeProviderData) {
            return next(
                new ErrorResponse(
                    `Something went wrong while getting all Mobile Recharge Providers from DB`,
                    200
                )
            );
        } else {
            return res.status(200).json({
                success: true,
                data: {
                    data: mobileRechargeProviderData
                        ? mobileRechargeProviderData.rows
                        : [],
                    recordsTotal: mobileRechargeProviderData
                        ? mobileRechargeProviderData.count
                        : 0,
                    recordsFiltered: mobileRechargeProviderData
                        ? mobileRechargeProviderData.count
                        : 0,
                },
                message: "Mobile recharge providers fetched successfully",
                responseCode: "000",
            });
        }
    }
);

exports.updateMobileRechargeProvider = asyncHandler(async (req, res, next) => {
    let params = req.params;
    let data = req.body;

    if (
        Object.prototype.hasOwnProperty.call(data || {}, "providerName") &&
        !String(data.providerName || "").trim()
    ) {
        return next(new ErrorResponse(`Provider name is required`, 400));
    }

    if (data && data.providerName) {
        const isProviderAvailable = await findByProviderName(data.providerName);
        if (
            isProviderAvailable &&
            String(isProviderAvailable.id) !== String(params.id)
        ) {
            return next(
                new ErrorResponse(
                    `Mobile Recharge Provider Already Exists with this name`,
                    403
                )
            );
        }
    }

    const result = await updateOne(params.id, data);
    if (!result) {
        return next(
            new ErrorResponse(
                `Something went wrong while updating Mobile Recharge Provider`,
                500
            )
        );
    } else {
        return res.status(200).json({
            status: true,
            data: {},
            message: "Mobile recharge provider updated successfully",
            responseCode: "000",
        });
    }
});

exports.updateMobileRechargeProviderStatus = asyncHandler(async (req, res, next) => {
    let params = req.params;
    let data = req.body;
    let result = await updateStatus(params, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating status`, 200));
    } else {
        return res.status(200).json({
            success: true,
            message: "Status updated successfully",
            data: "Updated successfully",
        });
    }
});

exports.deleteMobileRechargeProvider = asyncHandler(async (req, res, next) => {
    let params = req.params;

    const result = await deleteOne(params.id);
    if (!result) {
        return next(
            new ErrorResponse(
                `Mobile Recharge Provider not found or already deleted`,
                404
            )
        );
    } else {
        return res.status(200).json({
            status: true,
            data: {},
            message: "Mobile recharge provider deleted successfully",
            responseCode: "000",
        });
    }
});
