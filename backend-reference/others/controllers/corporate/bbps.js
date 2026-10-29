// /* eslint-disable no-prototype-builtins */
// /* eslint-disable no-undef */
// const axios = require('axios');
// const asyncHandler = require('./../../middlewares/async');
// const ErrorResponse = require('./../../utils/error-response');
// const redis = require("async-redis");
// const { fetchServiceDetails } = require('../../utils/checkAndFetchServiceDetails');
// const { createWalletTransaction } = require('../../utils/walletTransaction');
// let accessKey = 'bbps_telecom_postpaid'


// let client;
// if (process.env.NODE_ENV == 'production') {
//     client = redis.createClient({
//         host: process.env.REDIS_HOSTNAME,
//         port: process.env.REDIS_PORT,
//         password: process.env.REDIS_PASSWORD
//     })
// } else {
//     client = redis.createClient({
//         host: process.env.REDIS_HOSTNAME,
//         port: process.env.REDIS_PORT,
//         password: process.env.REDIS_PASSWORD,
//         tls: { servername: process.env.REDIS_HOSTNAME },
//     });
// }

// // retrive access token from redis client
// let getValue = async (key) => {
//     return await client.get(key);
// };
// // save access token to redis client
// let setValue = async (key, expiry, value) => {
//     await client.setex(key, expiry, value);
// };

// async function token(details) {
//     try {
//         let isTokenData = await getValue('bbps_token');
//         if (isTokenData) {
//             return isTokenData
//         } else {
//             let data = JSON.stringify({
//                 "clientId": details['optional1'],
//                 "secret": details['optional2'],
//             });

//             let config = {
//                 method: 'post',
//                 url: `${details['optional4']}auth/token`,
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 data: data
//             }

//             let response = await axios(config);
//             if (response && response.data && response.data.token) {
//                 let tokenData = response.data.token
//                 let expiry = response.data.expiresIn
//                 await setValue(`bbps_token`, expiry, tokenData);
//                 return tokenData
//             } else {
//                 return false
//             }
//         }
//     } catch (error) {
//         return false;
//     }
// }

// // rember we are using this recusive function for both fetch bill and payment api in bbps
// async function recursiveFetch(result, token, url, serviceDetails) {
//     try {
//         const startTime = Date.now();
//         const timeout = 3 * 60 * 1000; // 3 minutes in milliseconds

//         // We are calling BBPS API for 3 minutes in each 5 seconds.
//         while (
//             Date.now() - startTime < timeout &&
//             result.data.success &&
//             (result.data.data.status === 'Processing' || !result.data.data.status)
//         ) {
//             console.log(result.data.success && (result.data.data.status == 'Processing' || !result.data.data.status), '------------->>')
//             console.log(result.data);
//             let fetchBillResponseOptions = {
//                 method: 'POST',
//                 url: url,
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': '*/*',
//                     'Authorization': `Bearer ${token}`,
//                     'X-PARTNER-ID': serviceDetails.vendor['optional3']
//                 },
//                 data: JSON.stringify({
//                     refId: result.data.data.refId
//                 })
//             };
//             await new Promise((resolve) => setTimeout(resolve, 5000));
//             result = await axios(fetchBillResponseOptions);
//         }
//         return result;
//     } catch (error) {
//         console.error('Error during recursive fetch:', error);
//         return { data: { success: false } };
//     }
//     // console.log(result.data.success && (result.data.data.status == 'Processing' || !result.data.data.status), '------------->>')
//     // if (result.data.success && (result.data.data.status == 'Processing' || !result.data.data.status)) {
//     //     let fetchBillResponseOptions = {
//     //         method: 'POST',
//     //         url: url,
//     //         headers: {
//     //             'Content-Type': 'application/json',
//     //             'Accept': '*/*',
//     //             'Authorization': `Bearer ${token}`,
//     //             'X-PARTNER-ID': serviceDetails.vendor['optional3']
//     //         },
//     //         data: JSON.stringify({
//     //             refId: result.data.data.refId
//     //         })
//     //     };
//     //     await new Promise((resolve) => setTimeout(resolve, 5000));
//     //     result = await axios(fetchBillResponseOptions);
//     //     result = await recursiveFetch(result, token, url, serviceDetails);
//     // }
//     // return result
// }

// //for fetching bill details from bbps
// exports.fetchBillFromApi = async (serviceDetails, fetchBillRequestBody) => {
//     try {
//         let getToken = await token(serviceDetails.vendor);
//         if (!getToken) {
//             throw {
//                 success: false,
//                 error: 'Something went wrong while getting token'
//             };
//         }

//         let URL = serviceDetails.vendor.apiUrl;
//         let fetchBillUrl = `${URL}bills/fetch/request`;

//         let fetchBillOptions = {
//             method: 'POST',
//             url: fetchBillUrl,
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Accept': '*/*',
//                 'Authorization': `Bearer ${getToken}`,
//                 'X-PARTNER-ID': serviceDetails.vendor['optional3']
//             },
//             data: JSON.stringify(fetchBillRequestBody)
//         };

//         const fetchBillResponse = await axios(fetchBillOptions);
//         const refId = fetchBillResponse.data.data.refId;
//         if (!refId) {
//             throw {
//                 success: false,
//                 error: 'No refId in the fetchBill response'
//             };
//         }

//         let fetchBillResponseUrl = `${URL}bills/fetch/response`;
//         const fetchBillResponseResult = await recursiveFetch(fetchBillResponse, getToken, fetchBillResponseUrl, serviceDetails);

//         if (fetchBillResponseResult.data.data.status == 'Success') {
//             return {
//                 success: true,
//                 data: fetchBillResponseResult.data
//             };
//         } else {
//             console.log(fetchBillResponseResult.data, 'fetchBillResponseResult');
//             throw {
//                 success: false,
//                 error: 'Something went wrong while fetching bill'
//             };
//         }
//     } catch (error) {
//         console.log(error.response.data.error.message, 'catch--error.message');
//         return {
//             success: false,
//             error: error.response.data.error.message || 'Something went wrong while fetching bill'
//         };
//     }
// }

// // for payment 
// exports.paymentApi = async (serviceDetails, apiReqBody) => {
//     try {
//         const getToken = await token(serviceDetails.vendor);

//         if (!getToken) {
//             return {
//                 success: false,
//                 data: { message: 'Something went wrong while getting token' }
//             };
//         }

//         const URL = serviceDetails.vendor.apiUrl;
//         const paymentUrl = `${URL}bills/payment/request`;

//         const paymentOptions = {
//             method: 'POST',
//             url: paymentUrl,
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Accept': '*/*',
//                 'Authorization': `Bearer ${getToken}`,
//                 'X-PARTNER-ID': serviceDetails.vendor['optional3']
//             },
//             data: JSON.stringify(apiReqBody)
//         };

//         const payBillResponse = await axios(paymentOptions);
//         const refId = payBillResponse?.data?.data?.refId;

//         if (!refId) {
//             return {
//                 success: false,
//                 data: { message: 'No refId in the fetchBill response' }
//             };
//         }

//         const paymentResponseUrl = `${URL}bills/payment/response`;
//         const fetchBillResponseResult = await recursiveFetch(payBillResponse, getToken, paymentResponseUrl, serviceDetails);
//         console.log(fetchBillResponseResult.data, '!!!!!!!!!!!!!!!!!!!!');

//         const status = fetchBillResponseResult.data.data.status;
//         const message = status === 'Success' ? 'Payment Successful' : 'Payment Failed';

//         return {
//             success: status === 'Success',
//             data: { ...fetchBillResponseResult.data, message }
//         };
//     } catch (error) {
//         console.error(error?.response?.data);
//         console.error(error.message);
//         return {
//             success: false,
//             data: { message: error.message || 'Something went wrong' }
//         };
//     }
// };

// //for bbps complaint register
// exports.dispute = asyncHandler(async (req, res, next) => {
//     try {
//         const credentialId = req.user.id;
//         const packageId = req.user.packageId;
//         const serviceDetails = await fetchServiceDetails({
//             credentialId,
//             accessKey,
//             packageId
//         })
//         if (serviceDetails.hasOwnProperty('error')) {
//             return next(new ErrorResponse(serviceDetails['error'], 400))
//         }

//         let getToken = await token(serviceDetails.vendor);
//         let URL = serviceDetails.vendor.apiUrl;
//         const requestBody = {
//             txnReferenceId: req.body.txnReferenceId,
//             disputeType: req.body.disputeType,
//             description: req.body.description
//         };

//         let url = `${URL}bills/complaint/request`;

//         let options = {
//             'method': 'POST',
//             'url': url,
//             'headers': {
//                 'Content-Type': 'application/json',
//                 'Accept': '*/*',
//                 'Authorization': `Bearer ${getToken}`,
//                 'X-PARTNER-ID': serviceDetails.vendor['optional3']
//             },
//             data: JSON.stringify(requestBody)
//         };
//         const response = await axios(options)
//         console.log(response.data);
//         return response.data
//     } catch (error) {
//         return error.response.data
//     }
// });

// //bbps complaint Status check
// exports.disputeStatus = asyncHandler(async (req, res, next) => {
//     const credentialId = req.user.id;
//     const packageId = req.user.packageId;
//     const serviceDetails = await fetchServiceDetails({
//         credentialId,
//         accessKey,
//         packageId
//     })
//     if (serviceDetails.hasOwnProperty('error')) {
//         return next(new ErrorResponse(serviceDetails['error'], 400))
//     }

//     let getToken = await token(serviceDetails.vendor);
//     let URL = serviceDetails.vendor.apiUrl;

//     const requestBody = {
//         refId: req.body.refId

//     };

//     let url = `${URL}bills/complaint/response`;

//     let options = {
//         'method': 'POST',
//         'url': url,
//         'headers': {
//             'Content-Type': 'application/json',
//             'Accept': '*/*',
//             'Authorization': `Bearer ${getToken}`
//         },
//         body: JSON.stringify(requestBody)
//     };

//     axios(options)
//         .then(async function (response) {
//             return res.status(200).json({
//                 'success': true,
//                 'data': response.data
//             })
//         })
//         .catch(function (error) {
//             console.log(error);
//             return res.status(200).json({
//                 'success': false,
//                 'data': {}
//             })
//         });


// });


// //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// //list all biller categories
// exports.category = asyncHandler(async (req, res, next) => {
//     const credentialId = req.user.id;
//     const packageId = req.user.packageId;
//     const serviceDetails = await fetchServiceDetails({
//         credentialId,
//         accessKey,
//         packageId
//     })
//     if (serviceDetails.hasOwnProperty('error')) {
//         return next(new ErrorResponse(serviceDetails['error'], 400))
//     }
//     let getToken = await token(serviceDetails.vendor)
//     let URL = serviceDetails.vendor.apiUrl
//     let url = `${URL}/categories`
//     let config = {
//         method: 'get',
//         url: url,
//         headers: {
//             'Content-Type': 'application/json',
//             'Accept': '*/*',
//             'Authorization': `Bearer ${getToken}`,
//         }
//     };
//     axios(config)
//         .then(async function (response) {
//             return res.status(200).json({
//                 'success': true,
//                 'data': response.data
//             })
//         })
//         .catch(function (error) {
//             console.log(error);
//             return res.status(200).json({
//                 'success': false,
//                 'data': {}
//             })
//         });
// })

// //list all billers
// exports.billers = asyncHandler(async (req, res, next) => {
//     const credentialId = req.user.id;
//     const packageId = req.user.packageId;
//     const serviceDetails = await fetchServiceDetails({
//         credentialId,
//         accessKey,
//         packageId
//     })
//     if (serviceDetails.hasOwnProperty('error')) {
//         return next(new ErrorResponse(serviceDetails['error'], 400))
//     }

//     let searchQuery = '', categoryName = ''
//     if (req.query.categoryName) {
//         categoryName = req.query.categoryName
//     }
//     if (req.query.q) {
//         searchQuery = req.query.q
//     }
//     let getToken = await token(serviceDetails.vendor)
//     let URL = serviceDetails.vendor.apiUrl
//     let url = `${URL}/billers?categoryName=${categoryName}&search=${searchQuery}`
//     let config = {
//         method: 'get',
//         url: url,
//         headers: {
//             'Content-Type': 'application/json',
//             'Accept': '*/*',
//             'Authorization': `Bearer ${getToken}`,
//             'X-PARTNER-ID': serviceDetails.vendor['optional3']
//         }
//     };
//     axios(config)
//         .then(async function (response) {
//             let billersArray = response.data.data.billers
//             console.log('total billers in selected category   -------> ' + billersArray.length);
//             if (categoryName == "Electricity") {
//                 if (req.query.state) {
//                     billersArray = billersArray.filter(item => item.coverage === `IND-${req.query.state}`);
//                 }
//             }
//             return res.status(200).json({
//                 'success': true,
//                 'data': billersArray
//             })
//         })
//         .catch(function (error) {
//             console.log(error.response.data);
//             return res.status(200).json({
//                 'success': false,
//                 'data': {}
//             })
//         });
// });

// //list all transactions
// exports.transactions = asyncHandler(async (req, res, next) => {
//     const credentialId = req.user.id;
//     const packageId = req.user.packageId;
//     const serviceDetails = await fetchServiceDetails({
//         credentialId,
//         accessKey,
//         packageId
//     })
//     if (serviceDetails.hasOwnProperty('error')) {
//         return next(new ErrorResponse(serviceDetails['error'], 400))
//     }
//     let getToken = await token(serviceDetails.vendor)
//     let URL = serviceDetails.vendor.apiUrl
//     let url = `${URL}/transactions`
//     let config = {
//         method: 'get',
//         url: url,
//         headers: {
//             'Content-Type': 'application/json',
//             'Accept': '*/*',
//             'Authorization': `Bearer ${getToken}`,
//         }
//     };
//     axios(config)
//         .then(async function (response) {
//             return res.status(200).json({
//                 'success': true,
//                 'data': response.data
//             })
//         })
//         .catch(function (error) {
//             console.log(error);
//             return res.status(200).json({
//                 'success': false,
//                 'data': {}
//             })
//         });
// })

// //list all complaints
// exports.disputes = asyncHandler(async (req, res, next) => {
//     const credentialId = req.user.id;
//     const packageId = req.user.packageId;
//     const serviceDetails = await fetchServiceDetails({
//         credentialId,
//         accessKey,
//         packageId
//     })
//     if (serviceDetails.hasOwnProperty('error')) {
//         return next(new ErrorResponse(serviceDetails['error'], 400))
//     }
//     let getToken = await token(serviceDetails.vendor)
//     let URL = serviceDetails.vendor.apiUrl
//     let url = `${URL}/disputes`
//     let config = {
//         method: 'get',
//         url: url,
//         headers: {
//             'Content-Type': 'application/json',
//             'Accept': '*/*',
//             'Authorization': `Bearer ${getToken}`,
//         }
//     };
//     axios(config)
//         .then(async function (response) {
//             return res.status(200).json({
//                 'success': true,
//                 'data': response.data
//             })
//         })
//         .catch(function (error) {
//             console.log(error);
//             return res.status(200).json({
//                 'success': false,
//                 'data': {}
//             })
//         });
// })

// exports.directBillPay = asyncHandler(async (req, res, next) => {
//     const credentialId = req.user.id;
//     const packageId = req.user.packageId;
//     const serviceDetails = await fetchServiceDetails({
//         credentialId,
//         accessKey,
//         packageId
//     })
//     if (serviceDetails.hasOwnProperty('error')) {
//         return next(new ErrorResponse(serviceDetails['error'], 400))
//     }

//     let commissionType = serviceDetails.commissionType
//     let cashbackType = serviceDetails.cashbackType
//     let providerCommission = serviceDetails.providerCommission
//     let corporateCashback = serviceDetails.cashback
//     let serviceOperatorId = serviceDetails.id

//     let getToken = await token(serviceDetails.vendor);
//     let URL = serviceDetails.vendor.apiUrl;

//     const requestBody = {
//         agent: {
//             channel: rq.body.channel,
//             id: req.body.id,
//             imei: req.body.imei,
//             ip: req.body.ip,
//             os: req.body.os,
//             app: req.body.app,
//         },
//         biller: { id: req.body.billersId },
//         customer: {
//             billParameters: [{ name: req.body.name, value: req.body.value }],
//             mobile: req.body.mobile,
//         },
//         paymentDetails: {
//             amount: req.body.amount,
//             mode: req.body.mode,
//             paymentRefId: req.body.paymentRefId,
//             timestamp: req.body.timestamp,
//         },
//     };
//     let transactionResponse = {};
//     transactionResponse = await createWalletTransaction({
//         //corporateTxnId,
//         credentialId,
//         serviceOperatorId,
//         corporateCashback,
//         accountNo: req.body.account,
//         transactionCategory: req.body.mode,
//         amount: req.body.amount,
//         commissionType,
//         cashbackType,
//         providerCommission,
//         // payCashback,
//         // surcharge
//     })


//     if (transactionResponse && transactionResponse.hasOwnProperty('error')) {
//         return next(new ErrorResponse(transactionResponse['error'], 200))
//     }

//     let url = `${URL}bills/payment/request`;

//     let options = {
//         'method': 'POST',
//         'url': url,
//         'headers': {
//             'Content-Type': 'application/json',
//             'Accept': '*/*',
//             'Authorization': `Bearer ${getToken}`
//         },
//         body: JSON.stringify(requestBody)
//     };

//     axios(options)
//         .then(async function (response) {
//             return res.status(200).json({
//                 'success': true,
//                 'data': response.data
//             })
//         })
//         .catch(function (error) {
//             console.log(error);
//             return res.status(200).json({
//                 'success': false,
//                 'data': {}
//             })
//         });

// })
