/* eslint-disable no-unused-vars */
const ErrorResponse = require("../utils/error-response");

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    console.error(error);

    if (err.name === 'CastError') {
        error = new ErrorResponse('Invalid data type provided', 422);
    }

    // Schema validation failures describe the client's input (missing field, bad enum value),
    // so they're returned as a 400 with their message rather than a hidden 500.
    if (err.name === 'ValidationError') {
        error = new ErrorResponse(err.message, 400);
    }

    if (err.name === 'MongoServerError' && err.code === 11000) {
        let fieldName = 'Field';
        const errorMessage = err.message.match(/index: (.+?) dup key/);
        if (errorMessage && errorMessage.length > 1) {
            const parts = errorMessage[1].split('_');
            fieldName = parts[0];
        }
        error = new ErrorResponse(`Duplicate key error. The ${fieldName} must be unique.`, 400);
    }

    if (err.name === 'MulterError') {
        error = err.code === 'LIMIT_FILE_SIZE'
            ? new ErrorResponse('File too large. Maximum allowed size is 10 MB.', 413)
            : new ErrorResponse(err.message || 'Invalid file upload', 400);
    }

    const statusCode = error.status_code || 500;

    return res.status(statusCode).json({
        status: false,
        responseCode: '001',
        // Never leak internal error details to the client; the real error is logged above
        // ErrorResponse messages are written by us for the user, so they're always shown.
        message: statusCode >= 500 && !(err instanceof ErrorResponse)
            ? 'Something went wrong. Please try again later.'
            : error.message || 'Something went wrong',
        data: {},
    });
};

module.exports = errorHandler;
