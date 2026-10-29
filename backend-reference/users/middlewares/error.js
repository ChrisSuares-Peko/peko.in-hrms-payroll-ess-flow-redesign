/* eslint-disable no-unused-vars */
const { customLog } = require("../utils/loggerHelper");
const ErrorResponse = require("./../utils/error-response");
const logger = require("./../utils/logger");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for development
  customLog(req?.LogTraceId, "error", { error, message:"ERROR FROM ERROR HANDLER MIDDLEWARE" ,errMsg: err?.message, status_code: err?.status_code});


  // Bad ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found.`;
    error = new ErrorResponse(message, 404);
  }

  // Duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new ErrorResponse(message, 400);
  }

  //DB Errors
  if (typeof err?.name === "string" && err.name.startsWith("Sequelize")) {
    const message = "We’re experiencing a temporary issue. Please try again later. If the problem continues, contact us at reach@peko.one.";
    error = new ErrorResponse(message, 500);
  }

  // Validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(message, 400);
  }

  if (err.message === "INVALID AUTHORIZATION") {
    const message = `Something went wrong. Please try again after sometime.`;
    error = new ErrorResponse(message, 200);
  }

  // Set the status code based on the error or use a default value
  const statusCode = error.status_code || err.code || 500;
  // logger.error(err, { req });
  res.status(statusCode).json({
    status: false,
    message: error.message || 'Something went wrong. Please try again after sometime.',
    data: {},
    responseCode: '001'
});
};

module.exports = errorHandler;
