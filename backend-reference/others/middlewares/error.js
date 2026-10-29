/* eslint-disable no-unused-vars */
const { customLog } = require('../utils/loggerHelper')
const ErrorResponse = require('./../utils/error-response')
const errorHandler = (err, req, res, next) => {
    let error = { ...err }
    error.message = err.message
    console.log(err, "<<--------------errr is here-------------------------------<<<")
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
        const message = "We’re experiencing a temporary issue. Please try again later. If the problem continues, contact us at reach@peko.one.";
        error = new ErrorResponse(message, 500);
    }
    // F-OTH-10: only a deliberately-constructed ErrorResponse (either the original error, or
    // one of the branches above remapping a known error type) carries a message safe to show
    // the client. Anything else — a raw, unexpected exception — falls back to a generic
    // message instead of leaking internal error details.
    const isSafeToShow = err instanceof ErrorResponse || error instanceof ErrorResponse;
    res.status(err?.status_code ? err?.status_code : 500).json({
        status: false,
        message: isSafeToShow ? error.message : 'Something went wrong. Please try again after sometime.',
        data: {},
        responseCode: '001'
    });
}

module.exports = errorHandler