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
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 200));
  }

  const clientID = serviceDetails.vendor.optional1;
  let secretKey = serviceDetails.vendor.optional2;
  secretKey = Buffer.from(secretKey, 'base64')

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded['client-id'] != clientID) {
      return res.status(401).json({ message: 'Unauthorized - Invalid client ID' });
    }
    const tokenCreatedTime = Number(decoded.iat)
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const fifteenMinutesAgo = currentTime - 900; // token valid for 15 minutes 
    
    if (tokenCreatedTime >= fifteenMinutesAgo ) {
      next();
    }else{
      return res.status(401).json({ message: 'Unauthorized - Token Expired' });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
}