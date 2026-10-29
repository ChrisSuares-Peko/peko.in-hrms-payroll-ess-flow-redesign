/* eslint-disable no-unsafe-optional-chaining */
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const axios = require("axios");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const operatorsData = require("../../utils/operatorsData.json");
const accessKey = operatorsData['leadGeneration']['accessKey']

// Function to generate the jwt token for passing to the api
function generatePaytmJWTToken(clientId, secret) {
  const decodedKey = Buffer.from(secret, 'base64');
  const algorithm = 'HS512';
  const date = Math.floor(new Date().getTime() / 1000)
  const token = jwt.sign({ "client-id": clientId, iat: date }, decodedKey, { algorithm });
  return token;
}

// to generate checksum
function calculateChecksum(requestBody, url, clientKey) {
  try {
    const iv = generateIV(clientKey);
    const cipher = getCipher('encrypt', iv, clientKey);

    // Combine URL and request body for checksum calculation
    const combinedData = url + requestBody;
    const encryptedData = cipher.update(combinedData, 'utf8', 'base64') + cipher.final('base64');

    return Buffer.concat([iv, Buffer.from(encryptedData, 'base64')]).toString('base64');
  } catch (error) {
    console.error(error);
    return null;
  }
}
const AES_ALGORITHM = "aes-256-gcm";
const GCM_TAG_LENGTH = 16;
function getCipher(mode, iv, clientKey) {
  const secretKey = getSecretKey(clientKey);
  const cipher = crypto.createCipheriv(AES_ALGORITHM, secretKey, iv, { authTagLength: GCM_TAG_LENGTH });
  return cipher;
}
function getSecretKey(clientKey) {
  const sha256 = crypto.createHash('sha256');
  const keyBytes = sha256.update(clientKey, 'utf8').digest();
  return crypto.createSecretKey(keyBytes);
}
function generateIV(clientKey) {
  const keyBytes = Buffer.from(clientKey, 'utf8');
  const iv = Buffer.alloc(16);
  for (let i = 0; i < keyBytes.length && i < iv.length; i++) {
    iv[i] = keyBytes[i];
  }
  return iv;
}

//generating lead
exports.leadGenerator = asyncHandler(async (req, res, next) => {
  try {
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }
    const businessName = req.body.businessName;
    const mobileNumber = req.body.mobileNumber;
    const address = req.body.address;
    const productType = req.body.productType;

    const apiUrl = serviceDetails.vendor.apiUrl;
    const clientId = serviceDetails.vendor.optional1;
    const secretKey = serviceDetails.vendor.optional2;

    const requestData = {
      businessName: businessName,
      mobileNumber: mobileNumber,
      address: address,
      productType: productType,
    };

    const clientSecert = generatePaytmJWTToken(clientId, secretKey);
    const URL = `${apiUrl}/MerchantService/v1/aggregator/lead/generate`
    const checksum = calculateChecksum(requestData, URL, secretKey);

    const config = {
      method: "post",
      url: URL,
      headers: {
        "Content-Type": "application/json",
        "Authorization": clientSecert,
        "x-ext-checksum": checksum,
      },
      data: requestData
    };
    let result = await axios(config);
    console.log("🚀 ~ exports.leadGenerator=asyncHandler ~ result:", result)

    const { status, message } = result?.data
    if (status === 200) {
      return res.status(200).json({
        "status": true,
        "data": result?.data,
        "message": message || "Successfull!",
        "responseCode": "000",
      })
    } else {
      return res.status(result?.data?.status || 500).json({
        "status": false,
        "data": result?.data,
        "message": message || "Failed",
        "responseCode": "001",
      })
    }
  } catch (error) {
    console.log(error?.response);
    return res.status(500).json({
      "status": false,
      "data": {},
      "message": "Failed",
      "responseCode": "001",
    })
  }
});

//fetch lead details

exports.getLead = asyncHandler(async (req, res, next) => {
  try {
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }
    const leadId = req.body.leadId;
    if (!leadId) return next(new ErrorResponse('Lead Id not provided', 200));

    const apiUrl = serviceDetails.vendor.apiUrl;
    const clientId = serviceDetails.vendor.optional1;
    const secretKey = serviceDetails.vendor.optional2;

    let requestData = {
      leadId: leadId
    };

    const clientSecert = generatePaytmJWTToken(clientId, secretKey);
    const URL = `${apiUrl}/MerchantService/v1/aggregator/lead/fetch`
    const checksum = calculateChecksum(requestData, URL, secretKey);

    let config = {
      method: "post",
      url: `${apiUrl}/MerchantService/v1/aggregator/lead/fetch`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": clientSecert,
        "x-ext-checksum": checksum,
      },
      data: requestData,
    };
    let result = await axios(config);

    const { status, message } = result?.data
    if (status === 200) {
      return res.status(200).json({
        "status": true,
        "data": result?.data,
        "message": "Successfully fetch lead details!",
        "responseCode": "000",
      })
    } else {
      return res.status(result?.data?.status || 500).json({
        "status": false,
        "data": result?.data,
        "message": message || "Failed",
        "responseCode": "001",
      })
    }
  } catch (error) {
    console.log(error?.response);
    return res.status(500).json({
      "status": false,
      "data": {},
      "message": "Failed",
      "responseCode": "001",
    })
  }
});


//api to give callback upon mid creation
exports.callbackApiOnMidCreation = asyncHandler(async (req, res) => {
  try {
   
    
    console.log(req.body);
    // Perform necessary validations and logic 
    return res.status(200).json({ 'status': 200 });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      'status': 'error',
      'message': 'Internal Server Error',
    });
  }
});
// api to give callback upon Device Activation
exports.callbackApiOnDeviceActivation = asyncHandler(async (req, res, next) => {
  try {
    const leadId = req.body.leadId;
  

    console.log(req.body);
    if(!leadId){
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }
    // Perform operations ....
    return res.status(200).json({ 'status': 200 });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      'status': 'error',
      'message': 'Internal Server Error',
    });
  }
});