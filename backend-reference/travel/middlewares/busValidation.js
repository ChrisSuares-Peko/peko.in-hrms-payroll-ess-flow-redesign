const { customLog } = require('../utils/loggerHelper');

function sendError(res, traceId, message, statusCode = 400) {
    customLog(traceId, 'error', { message });
    return res.status(statusCode).json({
        status: false,
        data: {},
        message,
        statusCode: '001',
    });
}

const validateCancelTicket = (req, res, next) => {
    const { tin, seatsToCancel, corporateTxnId } = req.body;

    if (!tin) return sendError(res, req.LogTraceId, 'Ticket number (tin) is required');
    if (!corporateTxnId) return sendError(res, req.LogTraceId, 'corporateTxnId is required');
    if (!seatsToCancel) return sendError(res, req.LogTraceId, 'seatsToCancel is required');
    if (!Array.isArray(seatsToCancel) || seatsToCancel.length === 0)
        return sendError(res, req.LogTraceId, 'seatsToCancel must be a non-empty array');

    return next();
};

module.exports = { validateCancelTicket };
