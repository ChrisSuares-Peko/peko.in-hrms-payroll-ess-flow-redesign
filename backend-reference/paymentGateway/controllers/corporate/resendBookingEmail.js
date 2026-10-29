const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { findOneOrderByTxnId } = require("../../models/use-cases/order");
const serviceOperator = require("../../models/entities/serviceOperator");
const operatorsData = require("../../utils/operatorsData.json");
const { resendHotelTicketEmail } = require("./hotels");
const { resendFlightTicketEmail } = require("./flight");

const hotelAccessKey = operatorsData["hotel"]["accessKey"];
const airlineAccessKey = operatorsData["flight"]["accessKey"];

// Per-service resend handlers. Each reuses its service's exact payment-success
// email delivery path. Add a new service by mapping its accessKey to a helper.
const resendByAccessKey = {
    [hotelAccessKey]: resendHotelTicketEmail,
    [airlineAccessKey]: resendFlightTicketEmail,
};

// Unified "resend booking confirmation email" endpoint for all services. Looks up
// the SUCCESS order, identifies the service by its serviceOperator accessKey, and
// delegates to that service's resend helper.
exports.resendBookingEmail = asyncHandler(async (req, res, next) => {
    const corporateTxnId = req.body?.corporateTxnId ? String(req.body.corporateTxnId) : null;
    if (!corporateTxnId) {
        return next(new ErrorResponse("corporateTxnId is required", 400));
    }

    const order = await findOneOrderByTxnId(corporateTxnId);
    if (!order) {
        return next(new ErrorResponse("Order not found", 404));
    }
    if (order.status !== "SUCCESS") {
        return next(new ErrorResponse("Order is not successful", 400));
    }

    const operator = await serviceOperator.findOne({
        where: { id: order.serviceOperatorId },
        attributes: ["accessKey"],
    });
    if (!operator) {
        return next(new ErrorResponse("Service operator not found", 500));
    }

    const { accessKey } = operator;
    const resendHandler = resendByAccessKey[accessKey];
    if (!resendHandler) {
        return res.status(400).json({
            status: false,
            message: `Resend email is not configured for this service (${accessKey})`,
            data: {},
            responseCode: "001",
        });
    }

    try {
        await resendHandler(order, req.LogTraceId);
    } catch (error) {
        const statusCode = error?.status_code || 500;
        customLog(req.LogTraceId, "error", {
            corporateTxnId,
            accessKey,
            message: "resendBookingEmail: failed to resend booking confirmation email",
            error: error?.message,
        });
        // Surface our own recoverable 4xx validation messages; keep 5xx/internal
        // and vendor failures generic.
        const isClientError = statusCode >= 400 && statusCode < 500;
        return res.status(isClientError ? statusCode : 500).json({
            status: false,
            message: isClientError
                ? error.message
                : "Unable to resend the booking confirmation email. Please try again later.",
            data: {},
            responseCode: "001",
        });
    }

    return res.status(200).json({
        status: true,
        message: "Booking confirmation email resent successfully",
        data: {},
        responseCode: "000",
    });
});
