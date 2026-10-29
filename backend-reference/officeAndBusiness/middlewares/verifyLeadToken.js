/* eslint-disable no-prototype-builtins */
const jwt = require('jsonwebtoken');
const operatorsData = require("../utils/operatorsData.json");
const { findServiceOperatorByAccessKey } = require('../utils/checkAndFetchServiceDetails');
const ErrorResponse = require('../utils/error-response');
const accessKey = operatorsData['leadGeneration']['accessKey']

exports.verifyToken = async (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - Missing token' });
  }

  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
  }

  let secretKey = serviceDetails.vendor.optional2;
  secretKey = Buffer.from(secretKey, 'base64')

  try {
    // eslint-disable-next-line no-unused-vars
    const decoded = jwt.verify(token, secretKey);
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
}