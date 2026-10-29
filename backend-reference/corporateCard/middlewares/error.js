const { customLog } = require('../utils/loggerHelper');
const RESPONSE_CODE = require('../constants/responseCodes');
const ErrorResponse = require('./../utils/error-response');
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let error = { ...err }
    error.message = err.message
    console.log(err)
    customLog(req?.LogTraceId, "error", { error, message:"ERROR FROM ERROR HANDLER MIDDLEWARE" ,errMsg: err?.message, status_code: err?.status_code});

    if (err.name === 'CastError') {
        const message = `Resource not found.`
        error = new ErrorResponse(message, 404)
    }
    if (err.code === 11000) {
        const message = 'Duplicate field value entered'
        error = new ErrorResponse(message, 400)
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message)
        error = new ErrorResponse(message, 400)
    }
    if (err.message === 'INVALID AUTHORIZATION') {
        const message = `Something went wrong. Please try again after sometime.`
        error = new ErrorResponse(message, 200)
    }
    if (err.name === "SequelizeConnectionError" || err.name === "SequelizeAccessDeniedError" || err.name?.startsWith("Sequelize")) {
        const message = "We’re experiencing a temporary issue. Please try again later. If the problem continues, contact us at reach@peko.one.";
        error = new ErrorResponse(message, 500);
    }
    const statusCode = err?.status_code ? err?.status_code : 500
    res.status(statusCode).json({
        status: false,
        message: error.message || 'Something went wrong. Please try again after sometime.',
        data: {},
        responseCode: statusCode === 403 ? RESPONSE_CODE.FORBIDDEN : RESPONSE_CODE.ERROR
    });
}

module.exports = errorHandler
