/* eslint-disable no-undef */
/* eslint-disable no-prototype-builtins */
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { fetchServiceDetails, findServiceOperatorByAccessKey } = require("../../utils/checkAndFetchServiceDetails");
const axios = require("axios");
const jwt = require('jsonwebtoken');
const { DateTime } = require('luxon');
const { customLog } = require('../../utils/loggerHelper');
const { findCorporateUserByEmail } = require('../../models/use-cases/corporateUser');
const kybVerifications = require('../../models/entities/kybVerification');
const operatorsData = require("../../utils/operatorsData.json");
let accessKey = 'paytm_kyc'
// Vendor calls must not wait forever when the vendor is slow or down (F-KYC-04).
const VENDOR_TIMEOUT_MS = 30000

// Function to generate the client-secret token 
function generateToken(secretKey) {
    const currentTime = DateTime.local();
    const token = jwt.sign(
        {
            iss: 'CTS',
            timestamp: currentTime.toISO(),
        },
        secretKey,
        {
            algorithm: 'HS512',
        }
    );
    return token;
}

//pan validation
function validatePAN(panNumber) {
    var panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
    if (panRegex.test(panNumber.toUpperCase())) {
        return true;
    } else {
        return false;
    }
}


//gst validation
function validateGST(gstNumber) {
    var gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    if (gstRegex.test(gstNumber.toUpperCase())) {
        return true;
    } else {
        return false;
    }
}




// To get the GST details of a GST number
exports.getGstDetails = asyncHandler(async (req, res, next) => {
    try {
        const GSTIN = req.body.gstinNo
        const  gstValidation = validateGST(GSTIN);
        if(gstValidation === false){
            return next(new ErrorResponse('please enter a valid GST number', 400));
        }
        const credentialId = req.user.id;
        const packageId = req.user.packageId;
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId
        });
        if (serviceDetails.hasOwnProperty('error')) {
            return next(new ErrorResponse(serviceDetails['error'], 400));
        }

        const apiUrl = serviceDetails.vendor.apiUrl
        const clientId = serviceDetails.vendor.optional1
        const authKey = serviceDetails.vendor.optional2
        const X_Tags = serviceDetails.vendor.optional3

        const clientSecert = generateToken(authKey);

        let config = {
            method: 'post',
            timeout: VENDOR_TIMEOUT_MS,
            url: `${apiUrl}/gst/v2/gstin-details`,
            headers: {
                'Content-Type': 'application/json',
                'client-id': clientId,
                'client-secret': clientSecert,
                'x-tags': X_Tags
            },
            data: {
                "consent": "Y",
                "gstin": GSTIN,
                "additionalData": false,// Optional. Send to true only if this is required, else the cost of this API will be much higher and corresponding
                //cost will be tagged to calling client. Client have to provide the explanation before using this feature
            }
        };
        let result = await axios(config)

        if (result?.data && result?.data?.errorResponse) {
            customLog(req?.LogTraceId, "error", {
                message: "getGstDetails vendor verification failed",
                vendorResponse: result?.data,
                credentialId,
            }, "VENDOR");
            return res.status(400).json({
                'status': false,
                'message': "Something went wrong, please try after some time",
                'data': {gstVerified: false},
                'responseCode': '001'
            })
        } else {
            return res.status(200).json({
                'status': true,
                'data': {gstVerified: true},
                'message': 'gst verfication completed succssfully',
                'responseCode': '000'
            })
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", {
            message: "Error in getGstDetails",
            vendorStatus: error?.response?.status ?? null,
            vendorResponse: error?.response?.data ?? null,
            errorMessage: error?.message,
            stack: error?.stack,
            credentialId: req?.user?.id,
        }, "VENDOR");
        return res.status(400).json({
            'status': false,
            'data': {gstVerified: false},
            'message': "Something went wrong, please try after some time",
            'responseCode': '001'
        })
    }
})

//API to validate PAN
exports.validatePAN = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id;
        const packageId = req.user.packageId;
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId
        });
        if (serviceDetails.hasOwnProperty('error')) {
            return next(new ErrorResponse(serviceDetails['error'], 400));
        }
        const PAN_NO = req.body.panNo
        const panValidation = validatePAN(PAN_NO);
        if(panValidation === false){
            return next(new ErrorResponse('please enter a valid PAN number', 400));
        }
        const apiUrl = serviceDetails.vendor.apiUrl
        const clientId = serviceDetails.vendor.optional1
        const authKey = serviceDetails.vendor.optional2
        const X_Tags = serviceDetails.vendor.optional3

        const clientSecert = generateToken(authKey);
        const requsetId = new Date().valueOf();
        let config = {
            method: 'post',
            timeout: VENDOR_TIMEOUT_MS,
            url: `${apiUrl}/pan/api/v1/pan/verify?adharLinkage=true`, // adharLinkage - default false ** Pass this only pan-adhaar link is required, otherwise do not pass request param as cost per hit will be too high.
            headers: {
                'Content-Type': 'application/json',
                'client-id': clientId,
                'client-secret': clientSecert,
                'x-tags': X_Tags,
                'x-cache': false,
                // 'x-vendor-priority': "SIGNZY, KARZA",
                'x-vendor-priority': "KARZA",
                'x-source': 'OCL',
                'X-REQUEST-ID': requsetId
            },
            data: {
                "pan": PAN_NO,
                "maxDays": 2 // Number
            }
        };
        let result = await axios(config)

        if (result?.data && result?.data?.status === "SUCCESS") {
            return res.status(200).json({
                'status': true,
                'data': {panVerified : true},
                'message': 'pan verification successfull',
                'responseCode': '000'
            })
        } else {
            customLog(req?.LogTraceId, "error", {
                message: "validatePAN vendor verification failed",
                vendorResponse: result?.data,
                credentialId,
            }, "VENDOR");
            return res.status(400).json({
                'status': false,
                'data': {panVerified: false},
                'message': "Something went wrong, please try after some time",
                'responseCode': '001'
            })
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", {
            message: "Error in validatePAN",
            vendorStatus: error?.response?.status ?? null,
            vendorResponse: error?.response?.data ?? null,
            errorMessage: error?.message,
            stack: error?.stack,
            credentialId: req?.user?.id,
        }, "VENDOR");
        return res.status(400).json({
            'status': false,
            'data': {panVerified: false},
            'message': "Something went wrong, please try after some time",
            'responseCode': '001'
        })
    }
})

// This API is used to Initiate Digio Request To get deeplink
exports.digioReqest = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id;
        const packageId = req.user.packageId;
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId
        });
        if (serviceDetails.hasOwnProperty('error')) {
            return next(new ErrorResponse(serviceDetails['error'], 400));
        }

        const apiUrl = serviceDetails.vendor.apiUrl
        const clientId = serviceDetails.vendor.optional1
        const authKey = serviceDetails.vendor.optional2
        const X_Tags = serviceDetails.vendor.optional3

        const clientSecert = generateToken(authKey);
        const returnURL = process.env.NODE_ENV == 'staging' ? process.env.STAGING_URL + '/api/v1/kyc/digio/callback' : process.env.PRODUCTION_URL + '/api/v1/kyc/digio/callback'
        const requsetId = new Date().valueOf();

        let config = {
            method: 'post',
            timeout: VENDOR_TIMEOUT_MS,
            url: `${apiUrl}/digilocker-tool/api/v1/initiate?fetchAadhaar=false&fetchPan=false`,
            headers: {
                'Content-Type': 'application/json',
                'client-id': clientId,
                'client-secret': clientSecert,
                'x-tags': X_Tags,
                'x-user-id': req.user.id,    //Mandatory
                'x-entity': 'ocl'  // pml / ocl   
            },
            data: {
                "mobile": req.body.mobile, //Either mobile or email should be present
                "email": req.body.email,
                "customerName": req.body.customerName,
                "requestId": requsetId,                       //Mandatory
                "returnUrl": encodeURIComponent(returnURL),  //Mandatory Url where user will be redirected back from digio's page; should be URL encoded; URL's host should end with `.paytm.com`
                "responseFormat": "JSON"     //Mandatory
            }
        };

        // fetchAadhaar true/false  ** Pass this only if aadhaarBase64  is required, otherwise do not
        // pass request param as cost per hit will be too high.
        // fetchPan true/false  ** Pass this only if panBase64 is required along with
        // aadhaarBase64, otherwise do not pass request param as cost per hit will be too high.

        let result = await axios(config)

        if (result?.data && result?.data?.status === "SUCCESS") {
            return res.status(200).json({
                'status': true,
                'data': result.data,
                'message': 'Digio Request successfull',
                'responseCode': '000'
            })
        } else {
            customLog(req?.LogTraceId, "error", {
                message: "digioRequest vendor request failed",
                vendorResponse: result?.data,
                credentialId,
            }, "VENDOR");
            return res.status(200).json({
                'success': false,
                'message': "Something went wrong, please try after some time",
                'data': {},
                'responseCode': '001'
            })
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", {
            message: "Error in digioRequest",
            vendorStatus: error?.response?.status ?? null,
            vendorResponse: error?.response?.data ?? null,
            errorMessage: error?.message,
            stack: error?.stack,
            credentialId: req?.user?.id,
        }, "VENDOR");
        return res.status(200).json({
            'success': false,
            'data': {},
            'message': "Something went wrong, please try after some time",
            'responseCode': '001'
        })
    }
})

//This API is used to Give Callback to clients with KYC Details
exports.digioCallback = asyncHandler(async (req, res) => {

    // Never log the callback body: it carries Aadhaar number, DOB, address and photo (F-KYC-02).
    customLog(req?.LogTraceId, "info", {
        message: "digioCallback",
        status: req.body?.status,
        statusCode: req.body?.statusCode,
        referenceId: req.body?.result?.referenceId,
    }, "VENDOR")


    if (req.body.status === "SUCCESS") {

        //  req.body.result  contains kyc details
        // perform operations ....
        return res.status(200).send('ok')
    }

    // Always answer the callback, so a non-success status does not leave the request hanging (F-KYC-03).
    return res.status(200).send('ok')

    // # sample of req.body
    // {
    //     "status": "SUCCESS",
    //     "statusCode": "DIT-200",
    //     "result": {
    //         "transactionId": "", //Tools Request Id
    //         "referenceId": "", //client Request Id
    //         "aadharXml": "", // digilocker xml only if xml response is required in callback.
    //         "panBase64": "", // base64 String; only present if parameter fetchPan is sent as true while initiating
    //         "aadhaarBase64": "", // base64 String; only present if parameter fetchAadharr is sent as true while initiating
    //         "details": {
    //             "aadhaar": { //only if JSON response is required in Callback.
    //                 "idNumber": "xxxxxxxx3568",
    //                 "careOf": "Name", //Optional
    //                 "gender": "FEMALE", //MALE,FEMALE,TRANSGENDER
    //                 "image": "base64 of user image",
    //                 "name": "Richa Sharma",
    //                 "dob": "DD-MM-YYYY", // DD-MM-YYYY/YYYY Format
    //                 "address": {
    //                     "landmark": "", //Optional
    //                     "city": "",
    //                     "houseNumber": "", //Optional
    //                     "street": "", //Optional
    //                     "locality": "", //Optional
    //                     "subDistrict": "",
    //                     "district": "",
    //                     "state": "",
    //                     "country": "",
    //                     "pincode": ""
    //                 }
    //             },
    //             "pan": { //irrespective of responseFormat. In-case, fetchPan is sent as TRUE, pan-details will get populated over here.
    //                 "name": "Richa Sharma",
    //                 "dob": "DD-MM-YYYY", //DD-MM-YYYY Format
    //                 "gender": "F", //M, F, O
    //                 "panNumber": "BHYKT2890Z"
    //             }
    //         }
    //     }
    // }
})


//verify both gst and pan
exports.verifyBothGstAndPan = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id;
        const packageId = req.user.packageId;
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId
        });
        if (serviceDetails.hasOwnProperty('error')) {
            return next(new ErrorResponse(serviceDetails['error'], 400));
        }

        const GSTIN = req.body.gstinNo;
        const PAN_NO = req.body.panNo;
        const apiUrl = serviceDetails.vendor.apiUrl;
        const clientId = serviceDetails.vendor.optional1;
        const authKey = serviceDetails.vendor.optional2;
        const X_Tags = serviceDetails.vendor.optional3;
        const clientSecret = generateToken(authKey);

        const gstConfig = {
            method: 'post',
            timeout: VENDOR_TIMEOUT_MS,
            url: `${apiUrl}/gst/v2/gstin-details`,
            headers: {
                'Content-Type': 'application/json',
                'client-id': clientId,
                'client-secret': clientSecret,
                'x-tags': X_Tags
            },
            data: {
                "consent": "Y",
                "gstin": GSTIN,
                "additionalData": false
            }
        };

        const panConfig = {
            method: 'post',
            timeout: VENDOR_TIMEOUT_MS,
            url: `${apiUrl}/pan/api/v1/pan/verify?adharLinkage=true`,
            headers: {
                'Content-Type': 'application/json',
                'client-id': clientId,
                'client-secret': clientSecret,
                'x-tags': X_Tags,
                'x-cache': false,
                'x-vendor-priority': 'KARZA',
                'x-source': 'OCL',
                'X-REQUEST-ID': new Date().valueOf()
            },
            data: {
                "pan": PAN_NO,
                "maxDays": 2
            }
        };

        const [gstResult, panResult] = await Promise.all([axios(gstConfig), axios(panConfig)]);

        const results = [];
        if (gstResult?.data && gstResult?.data?.status === "SUCCESS") {
            results.push({
                'type': 'GST',
                'data': gstResult.data.result || gstResult.data
            });
        } else {
            customLog(req?.LogTraceId, "error", {
                message: "verifyBothGstAndPan GST verification failed",
                vendorResponse: gstResult?.data,
                credentialId,
            }, "VENDOR");
            results.push({
                'type': 'GST',
                'data': {},
                'error': 'GST verification failed'
            });
        }

        if (panResult?.data && panResult?.data?.status === "SUCCESS") {
            results.push({
                'type': 'PAN',
                'data': panResult.data.result || panResult.data
            });
        } else {
            customLog(req?.LogTraceId, "error", {
                message: "verifyBothGstAndPan PAN verification failed",
                vendorResponse: panResult?.data,
                credentialId,
            }, "VENDOR");
            results.push({
                'type': 'PAN',
                'data': {},
                'error': 'PAN verification failed'
            });
        }

        return res.status(200).json({
            'status': true,
            'results': results,
            'message': 'Verification completed',
            'responseCode': '000'
        });

    } catch (error) {
        customLog(req?.LogTraceId, "error", {
            message: "Error in verifyBothGstAndPan",
            vendorStatus: error?.response?.status ?? null,
            vendorResponse: error?.response?.data ?? null,
            errorMessage: error?.message,
            stack: error?.stack,
            credentialId: req?.user?.id,
        }, "VENDOR");
        return res.status(200).json({
            'status': false,
            'data': {},
            'message': "Something went wrong, please try after some time",
            'responseCode': '001'
        });
    }
});

function generateVerificationId() {
    const timestamp = Date.now().toString(); 
    const random = Math.random().toString(36).substring(2, 10).toUpperCase(); 
    return `${timestamp}${random}`.substring(0, 50);
  }

exports.verifyTaxId = async (req, res, next) => {
    try {
        const accessKey = operatorsData["taxIdVerification"]["accessKey"];
    
        const { type, value } = req.body;
        if (!type || !value) {
            return res.status(400).json({
                'status': false,
                'message': "Type and value are required",
                'data': {},
                'responseCode': '001'
            })
        }
        let email
        if (req.user?.role === "ADMIN"|| req.user?.role === "SYSTEM_USER") {
            email = req.body.email
        }else{
            email = req.user.email
        }

        const user = await findCorporateUserByEmail(email);
        if (!user) {
            return res.status(400).json({
                'status': false,
                'message': "Corporate user not found",
                'data': {},
                'responseCode': '001'
            })
        }
        const { name, contactPersonName,companyName } = user; 

        const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
        if (!serviceDetails || !serviceDetails.vendor) {
            return res.status(400).json({
                'status': false,
                'message': "Service operator details not found",
                'data': {},
                'responseCode': '001'
            })
        }
  
        let clientId = serviceDetails.vendor.optional1;
        let clientSecret = serviceDetails.vendor.optional2;
        let baseUrl = serviceDetails.vendor.apiUrl;
        let finalResponseData = {}; 

        // Handle GSTIN verification
        if (type === "gst") {
            const fullUrl = `${baseUrl}/verification/gstin`;
            const config = {
                method: "post",
                timeout: VENDOR_TIMEOUT_MS,
                url: fullUrl,
                headers: {
                    "x-client-id": clientId,
                    "x-client-secret": clientSecret,
                    "Content-Type": "application/json",
                },
                data: {
                    GSTIN: value, 
                    business_name: name
                },
            };
    
            try {
                const response = await axios(config);

                // Check if the verification was successful
                if (response.status !== 200) {
                    return next(
                        new ErrorResponse("Something went wrong, please try after some time", 400)
                    );
                }

                await kybVerifications.create({
                    documentType: type,
                    documentNumber: value,
                    legalNameOfBusiness: response.data.legal_name_of_business || null,
                    nameMatchingScore: response.data.name_match_score || null,
                    verificationResponse: response.data,
                    corporateUserId: user.id,
                });
                
                finalResponseData = {
                    gstNumber: value,
                    response: response.data,
                    accessKey: operatorsData["gstinVerify"]["accessKey"],
                    serviceName: "GSTIN"
                };
                
                if (response.data.legal_name_of_business !== name) {
                    return res.status(200).json({
                        'status': true,
                        'responseCode': '000',
                        'message': 'Verify your GST details',
                        'data': finalResponseData
                    })
                }
    
            } catch (error) {
                customLog(req?.LogTraceId, "error", {
                    message: "Error verifying GSTIN",
                    vendorStatus: error?.response?.status ?? null,
                    vendorResponse: error?.response?.data ?? null,
                    errorMessage: error?.message,
                    stack: error?.stack,
                    corporateUserId: user.id,
                    type,
                }, "VENDOR");
                return next(
                    new ErrorResponse("Something went wrong, please try after some time", 400)
                );
            }
        }
  
        // Handle PAN verification
        if (type === "pan") {
            const fullUrl = `${baseUrl}/verification/pan`;
    
            const config = {
                method: "post",
                timeout: VENDOR_TIMEOUT_MS,
                url: fullUrl,
                headers: {
                    "x-client-id": clientId,
                    "x-client-secret": clientSecret,
                    "Content-Type": "application/json",
                },
                data: {
                    pan: value,
                    name: contactPersonName,
                    verification_id: generateVerificationId()
                },
            };
    
            try {
                const response = await axios(config);

                customLog(req?.LogTraceId, "info", {
                    message: "PAN verification API response",
                    status: response.status,
                    vendorStatus: response.data?.status,
                    valid: response.data?.valid,
                    corporateUserId: user.id
                });
    
                // Check if the verification was successful
                if (response.status !== 200) {
                    return next(
                        new ErrorResponse("Something went wrong, please try after some time", 400)
                    );
                }

                // Check if PAN verification failed
                if (response.data.valid === false || response.data.status === "INVALID") {
                    finalResponseData = {
                        panNumber: value,
                        response: response.data,
                        accessKey: operatorsData["panVerify"]["accessKey"],
                        serviceName: "PAN"
                    };
                    return res.status(400).json({
                        status: false,
                        message: "Please provide a valid Corporate/Business PAN",
                        data: finalResponseData,
                        responseCode: "001",
                    });
                }

                if (response.data.type && response.data.type.toLowerCase().includes("individual")) {
                    return res.status(400).json({
                        status: false,
                        message: "Please provide a valid Corporate/Business PAN",
                        data: {},
                        responseCode: "001",
                    });
                }
                
                if (response.data.valid === true || response.data.status === "VALID") {
                    await kybVerifications.create({
                        documentType: type,
                        documentNumber: value,
                        legalNameOfBusiness: response.data.registered_name || null,
                        nameMatchingScore: response.data?.name_match_score || null,
                        verificationResponse: response.data,
                        corporateUserId: user.id,
                    });
                    finalResponseData = {
                        panNumber: value,
                        response: response.data,
                        accessKey: operatorsData["panVerify"]["accessKey"],
                        serviceName: "PAN"
                    };      
                    return res.status(200).json({
                        status: true,
                        message: "Verify your PAN details",
                        data: finalResponseData,
                        responseCode: "000",
                    });
                }
            
            } catch (error) {
                customLog(req?.LogTraceId, "error", {
                    message: "Error verifying PAN",
                    vendorStatus: error?.response?.status ?? null,
                    vendorResponse: error?.response?.data ?? null,
                    errorMessage: error?.message,
                    stack: error?.stack,
                    corporateUserId: user.id,
                    type,
                }, "VENDOR");
                return next(
                    new ErrorResponse(
                        "Something went wrong, please try after some time",
                        500
                    )
                );
            }
        }
  
        if (type === "cin") {
            const fullUrl = `${baseUrl}/verification/cin`;
    
            const config = {
                method: "post",
                timeout: VENDOR_TIMEOUT_MS,
                url: fullUrl,
                headers: {
                    "x-client-id": clientId,
                    "x-client-secret": clientSecret,
                    "Content-Type": "application/json",
                },
                data: {
                    cin: value,
                    verification_id: generateVerificationId()
                },
            };
    
            try {
                const response = await axios(config);
             
                // Check if the verification was successful based on the 'valid' field
                if (!response.data || !response.data.status) {
                    return res.status(400).json({
                        'status': false,
                        'message': "Unable to verify your request",
                        'data': {},
                        'responseCode': '001'
                    })
                }
    
                await kybVerifications.create({
                    documentType: type,
                    documentNumber: value,
                    legalNameOfBusiness: response.data.company_name || null,
                    nameMatchingScore:  null,
                    verificationResponse: response.data,
                    corporateUserId: user.id,
                });
                finalResponseData = {
                    cinNumber: value,
                    response: response.data,
                    accessKey: operatorsData["cinVerify"]["accessKey"],
                    serviceName: "CIN"
                  };
                if (response.data.company_name !== companyName) {
                    return res.status(200).json({
                        status: true,
                        message: "Verify your CIN",
                        data: finalResponseData,
                        responseCode: "000",
                    });
                }
            
            } catch (error) {
                customLog(req?.LogTraceId, "error", {
                    message: "Error verifying CIN",
                    vendorStatus: error?.response?.status ?? null,
                    vendorResponse: error?.response?.data ?? null,
                    errorMessage: error?.message,
                    stack: error?.stack,
                    corporateUserId: user.id,
                    type,
                }, "VENDOR");
                return next(
                    new ErrorResponse(
                        "Something went wrong, please try after some time",
                        500
                    )
                );
            }
        }
        const messageMap = {
            pan: "PAN verified successfully",
            gst: "GST verified successfully",
            cin: "CIN verified successfully",
          };
        return res.status(200).json({
            status: true,
            message : messageMap[type] || "Verification successful",
            data: {
                ...finalResponseData,
                gstNumber: user.gstNumber,
                panNumber: user.panNumber,
                cinNumber:user?.cinNumber,
            },
            responseCode: "000",
        });

    } catch (error) {
      customLog(req?.LogTraceId, "error", {
        message: "Error in verifyTaxId",
        type: req?.body?.type,
        errorMessage: error?.message,
        vendorStatus: error?.response?.status ?? null,
        vendorResponse: error?.response?.data ?? null,
        stack: error?.stack,
      });
      return next(new ErrorResponse("Something went wrong, please try after some time", 400));
    }
  };


  exports.savePanGst = async (req, res, next) => {
    try {
    
        const { type } = req.body;
        const data = req.body;
        if (!type ) {
            return res.status(400).json({
                'status': false,
                'message': "Type and value are required",
                'data': {},
                'responseCode': '001'
            })
        }
        let email
        if (req.user?.role === "ADMIN"|| req.user?.role === "SYSTEM_USER") {
            email = req.body.email
        }else{
            email = req.user.email
        }
        const user = await findCorporateUserByEmail(email);
        if (!user) {
            return res.status(400).json({
                'status': false,
                'message': "Corporate user not found",
                'data': {},
                'responseCode': '001'
            })
        }
        if(type === "gst") {
            user.gstNumber = data.gst;
            user.gstVerified = true;
        } else if(type === "pan") {
            // Only a PAN that passed /gstPanVerification for this user can be marked verified (F-KYC-01).
            const panVerification = data.pan
                ? await kybVerifications.findOne({
                    where: { documentType: "pan", documentNumber: data.pan, corporateUserId: user.id },
                    attributes: ["id"],
                })
                : null;
            if (!panVerification) {
                return res.status(400).json({
                    status: false,
                    message: "Please verify your PAN before saving.",
                    data: {},
                    responseCode: "001",
                });
            }
            user.panNumber = data.pan;
            user.panVerified = true;
        } else if(type === "cin") {
            user.cinNumber = data.cin;
            user.cinVerified = true;
        }
        // Wait for the save, so a failed save is never reported as "verified" (F-KYC-01).
        try {
            await user.save();
        } catch (saveError) {
            if (saveError?.name === "SequelizeUniqueConstraintError") {
                return res.status(409).json({
                    status: false,
                    message: `This ${String(type).toUpperCase()} is already registered with another account.`,
                    data: {},
                    responseCode: "001",
                });
            }
            throw saveError;
        }
        const messageMap = {
            pan: "PAN verified successfully",
            gst: "GST verified successfully",
            cin: "CIN verified successfully",
          };
        return res.status(200).json({
            status: true,
            message : messageMap[type] || "Verification successful",
            data: {
                gstVerified: user.gstVerified, 
                gstNumber: user.gstNumber, 
                panNumber: user.panNumber,
                cinNumber:user?.cinNumber,
                panVerified: user.panVerified,
                cinVerified: user?.cinVerified,
            },
            responseCode: "000",
        });

    } catch (error) {
      customLog(req?.LogTraceId, "error", {
        message: "Error in savePanGst",
        errorMessage: error?.message,
        stack: error?.stack,
      });
      return next(new ErrorResponse("Something went wrong, please try after some time", 400));
    }
  };