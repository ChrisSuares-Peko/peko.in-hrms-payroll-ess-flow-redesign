const { customLog } = require('../utils/loggerHelper');
const ErrorResponse = require('../utils/error-response');
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let error = { ...err }
    error.message = err.message
    console.log(err)
    console.log(err.status_code)
    customLog(req?.LogTraceId, "error", { error, message:"ERROR FROM ERROR HANDLER MIDDLEWARE" ,errMsg: err?.message, status_code: err?.status_code});
    //Log to console fro dev
    //console.log(err.stack);

    //Bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found.`
        error = new ErrorResponse(message, 404)
    }
    //duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered'
        error = new ErrorResponse(message, 400)
    }
    //validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message)
        error = new ErrorResponse(message, 400)
    }
    console.log(err.error)
    if (err.message === 'INVALID AUTHORIZATION') {
        const message = `Something went wrong. Please try again after sometime.`
        error = new ErrorResponse(message, 200)
    }
    //DB Errors
    if (typeof err?.name === "string" && err.name.startsWith("Sequelize")) {
        const message = "We're experiencing a temporary issue. Please try again later. If the problem continues, contact us at reach@peko.one.";
        error = new ErrorResponse(message, 500);
    }
    // TraceId Expiration Error
    if (err.isTraceIdExpired || err.responseCode === '005') {
        error = new ErrorResponse("Your search session has expired. Please restart your search and try again.", 400);
        return res.status(400).json({
            status: false,
            message: "Your search session has expired. Please restart your search and try again.",
            data: {},
            responseCode: '005'
        });
    }
    res.status(err?.status_code ? err?.status_code : 500).json({
        status: false,
        message: error.message || 'Something went wrong. Please try again after sometime.',
        data: {},
        responseCode: '001'
    });
}

module.exports = errorHandler