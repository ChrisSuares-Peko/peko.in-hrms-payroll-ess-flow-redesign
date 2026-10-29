const axios = require("axios");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const { createLeanPayout } = require("../../models/use-cases/payout");
const { findDefaultBankAccount } = require("../../models/use-cases/bankDetails");
const leanAppToken = process.env.LEAN_APP_TOKEN;
const accessKey = "lean_payment";
const fs = require('fs')
const https = require('https')
const path = require('path');

// Construct the path to the cert.crt file using the process.cwd()
const certPath = path.join(process.cwd(), 'secret', 'cert.crt')
const keyPath = path.join(process.cwd(), 'secret', 'key.pem')
const caPath = path.join(process.cwd(), 'secret', 'ca.pem')

function getHttpAgent() {
  try {
    return new https.Agent({
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
      ca: fs.readFileSync(caPath),
    })

  } catch (error) {
    console.log(error)
    return false
  }
}

exports.createOrder = asyncHandler(async (req, res, next) => {
  try {
    //        Amazon  --- customer or corporate (step 1)
    //         /
    //        /
    //     JHON DOE   ---- Maker or employee  (step 2)
    //      /
    //     /
    //   person 3  --- Authorizer (step 3)    It may be the same person is responsible for both queuing and authorizing.

    const credentialId = req.user.id; //will come from userObject
    const packageId = req.user.packageId; //will come from userObject

    //before proceeding with lean payment, first ensure that user have a default bank account with destinationIdLean
    // 'destinationIdLean' is used for refund if failure
    if (process.env.IS_VALID_LEAN_BANK == 'true') {
      let defaultBankAccount = await findDefaultBankAccount({ id: credentialId })
      console.log({ defaultBankAccount })
      if (!defaultBankAccount || !defaultBankAccount.destinationIdLean) {
        return next(new ErrorResponse(`Please add your default bank account under profile section to use bank payment`, 200));
      }
    }



    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
    });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse(serviceDetails["error"], 200));
    }
    const URL = serviceDetails.vendor.apiUrl
    // step 1 - retrive customer details and create customer if it not existing
    let customerDetailsConfig = {
      method: "get",
      url: `${URL}/customers/v1/app-user-id/${req.user.id}/`, // app user id from db
      headers: {
        "Content-Type": "application/json",
        "lean-app-token": leanAppToken,
      },
    };
    // Conditionally add httpsAgent for production environment
    if (process.env.NODE_ENV === 'production') {
      const httpsAgent = getHttpAgent();
      if (!httpsAgent) return next(new ErrorResponse(`Something went wrong with httpsAgent`, 200));
      customerDetailsConfig = {
        ...customerDetailsConfig,
        httpsAgent,
      };
    }

    let customerId;
    await axios(customerDetailsConfig)
      .then((response) => {
        console.log(response.data);
        if (response.data.customer_id) {
          customerId = response.data.customer_id;
        }
      })
      .catch(async (err) => {
        console.log(err.response.data);
        if (err.data?.metadata == null) {
          // need to create a new customer
          let createCustomerConfig = {
            method: "post",
            url: `${URL}/customers/v1/`,
            headers: {
              "Content-Type": "application/json",
              "lean-app-token": leanAppToken,
            },
            data: {
              app_user_id: req.user.id, // unique id from the database
            },
          };
          if (process.env.NODE_ENV === 'production') {
            const httpsAgent = getHttpAgent();
            if (!httpsAgent) return next(new ErrorResponse(`Something went wrong with httpsAgent`, 200));
            createCustomerConfig = {
              ...createCustomerConfig,
              httpsAgent,
            };
          }
          const createCustomerResponse = await axios(createCustomerConfig);
          if (createCustomerResponse.data && createCustomerResponse.data.customer_id) {
            customerId = createCustomerResponse.data.customer_id;
          }
        }
      });

    //step 2 create an end-user for the customer
    let endUserId;
    let endUserConfig = {
      method: "post",
      url: `${URL}/customers/v1/end-users`,
      headers: {
        "Content-Type": "application/json",
        "lean-app-token": leanAppToken,
      },
      data: {
        customer_id: customerId,
        reference: req.user.name, // give user name for end user
      },
    };
    if (process.env.NODE_ENV === 'production') {
      const httpsAgent = getHttpAgent();
      if (!httpsAgent) return next(new ErrorResponse(`Something went wrong with httpsAgent`, 200));
      endUserConfig = { ...endUserConfig, httpsAgent };
    }
    await axios(endUserConfig)
      .then((response) => {
        console.log(response.data);
        if (response.data && response.data.id) {
          endUserId = response.data.id;
        }
      })
      .catch((err) => {
        console.log(err.response);
        return next(new ErrorResponse("Something went wrong", 501));
      });

    // pass customer id and end user id into frontend
    if (customerId && endUserId) {
      res.status(200).json({
        success: true,
        customer_id: customerId,
        end_user_id: endUserId,
      });
    } else {
      res.status(500).json({
        status: false,
        message: "Failed to create customer id",
        data:{},
        responseCode:'001'
      });
    }
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse("Failed to create customer id", 501));
  }
});

exports.createIntentId = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id; //will come from userObject
    const packageId = req.user.packageId; //will come from userObject

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
    });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse(serviceDetails["error"], 200));
    }
    const URL = serviceDetails.vendor.apiUrl
    const paymentData = req.body;
    delete paymentData._csrf;
    delete paymentData.orderBody;
    //  api to create payment intent id
    let config = {
      method: "post",
      url: `${URL}/payments/v1/intents`,
      headers: {
        "Content-Type": "application/json",
        "lean-app-token": leanAppToken,
      },
      data: paymentData,
    };
    if (process.env.NODE_ENV === 'production') {
      const httpsAgent = getHttpAgent();
      if (!httpsAgent) return next(new ErrorResponse(`Something went wrong with httpsAgent`, 200));
      config = { ...config, httpsAgent };
    }
    const response = await axios(config);
    if (response.data && response.data.payment_intent_id) {
      //   const result = await createTempOrder(orderBody, response.data.payment_intent_id, req.user.id);
      //   if (!result) {
      //     return next(new ErrorResponse("Failed to create order", 200));
      //   }
      res.status(200).json({
        success: true,
        payment_intent_id: response.data.payment_intent_id,
      });
    } else {
      res.status(200).json({
        success: false,
        Message: "failed to generate payment intent",
      });
    }
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse("Something went wrong", 501));
  }
});

exports.queuedPayments = asyncHandler(async (req, res) => {
  const intentId = req.body.paymentIntentId;
  res.status(200).json({
    success: true,
    queued_Payments: [intentId],
  });
  // const customerId = req.body.customerId
  // let config = {
  //     method: 'get',
  //     url: `https://sandbox.leantech.me/payments/v1/customers/${customerId}/queued-payments`,
  //     headers: {
  //         'Content-Type': 'application/json',
  //         'lean-app-token': leanAppToken
  //     }
  // };
  // if (process.env.NODE_ENV === 'production') {
  //   const httpsAgent = getHttpAgent();
  //   if (!httpsAgent) return next(new ErrorResponse(`Something went wrong with httpsAgent`, 200));
  //   config = {
  //     ...config,
  //     httpsAgent,
  //   };
  // }
  // const response = await axios(config)
  // if (true) {
  // const paymentIntentIds = response.data.queued_payments.map(item => item.payment_intent_id);
  // console.log(paymentIntentIds);
  //   res.status(200).json({
  //     success: true,
  //     queued_Payments: true,
  //   });
  // } else {
  //   res.status(501).json({
  //     success: false,
  //     Message: "failed to fetch queued payment",
  //   });
  // }
});

exports.getPaymentDetails = asyncHandler(async (paymentIntentId, user) => {
  try {
    const credentialId = user.id; //will come from userObject
    const packageId = user.packageId; //will come from userObject

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
    });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return new ErrorResponse(serviceDetails["error"]);
    }
    const URL = serviceDetails.vendor.apiUrl
    let config = {
      method: "get",
      url: `${URL}/payments/v1/intents/${paymentIntentId}/`, // app user id from db
      headers: {
        "Content-Type": "application/json",
        "lean-app-token": leanAppToken,
      },
    };
    if (process.env.NODE_ENV === 'production') {
      const httpsAgent = getHttpAgent();
      if (!httpsAgent) return new ErrorResponse(`Something went wrong with httpsAgent`);
      config = { ...config, httpsAgent };
    }

    const response = await axios(config);
    return response
  } catch (error) {
    console.log(error, "<<--- Catch from intents --->>");
    return error
  }
})

exports.fetchBankList = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id; //will come from userObject
    const packageId = req.user.packageId; //will come from userObject

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
    });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse(serviceDetails["error"], 200));
    }
    const URL = serviceDetails.vendor.apiUrl
    let config = {
      method: "get",
      url: `${URL}/banks/v1/`,
      headers: {
        "Content-Type": "application/json",
        "lean-app-token": leanAppToken,
      },
    };
    if (process.env.NODE_ENV === 'production') {
      const httpsAgent = getHttpAgent();
      if (!httpsAgent) return next(new ErrorResponse(`Something went wrong with httpsAgent`, 200));
      config = { ...config, httpsAgent };
    }
    console.log({ config })
    const response = await axios(config);
    if (response.data && response) {
      res.status(200).json({
        success: true,
        data: response.data,
      });
    } else {
      return next(new ErrorResponse("Something went wrong", 200));
    }
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse("Something went wrong", 200));
  }
});

exports.createDestination = asyncHandler(async (params, user) => {
  try {
    let { bankIdentifier, accountHolderName, iban, swiftCode, accountNumber, bankAddress, city } = params;
    let bodyParams = [
      {
        bank_identifier: bankIdentifier,
        branch_address: bankAddress,
        name: accountHolderName,
        iban: iban,
        display_name: accountHolderName,
        address: city + "," + "United Arab Emirates",
        city: city,
        country: "ARE", //united arab emirates
        swift_code: swiftCode,
        account_number: accountNumber,
      },
    ];

    const credentialId = user.id; //will come from userObject
    const packageId = user.packageId; //will come from userObject

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
    });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      //return new ErrorResponse(serviceDetails["error"]);
      throw new Error(serviceDetails.error);
    }
    const URL = serviceDetails.vendor.apiUrl

    let config = {
      method: "POST",
      url: `${URL}/payouts/v1/payment/destinations/`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "lean-app-token": leanAppToken,
      },
      data: JSON.stringify(bodyParams),
    };
    if (process.env.NODE_ENV === 'production') {
      const httpsAgent = getHttpAgent();
      if (!httpsAgent) {
        throw new Error('Something went wrong with httpsAgent');
      }
      config = { ...config, httpsAgent };
    }
    console.log(config, "<<config passed....");
    const response = await axios(config);
    if (response.data.length && response.data[0].status == "CONFIRMED") {
      console.log(response.data[0])
      return {
        success: true,
        message: 'Success',
        id: response.data[0].destination_id
      }; //success case //if status is confirmed and send id
    } else {
      console.log(response?.data[0])
      if (response?.data[0]?.error_message) {
        throw new Error(getErrorMessage(response?.data[0]?.error_message))
      } else {
        throw new Error('Invalid entry');
      }
    }
  } catch (error) {
    console.log(error, "<<---------------catch from destination creating lean");
    return {
      status: false,
      message: error?.message || "Something went wrong.",
      data:{},
      responseCode:'001'
    };
  }
});
function getErrorMessage(errorMessage) {
  try {
    const jsonString = errorMessage.match(/{[^}]+}/)?.[0].replace(/\\"/g, '"');
    const parsedErrorMessage = JSON.parse(jsonString);
    return parsedErrorMessage?.message || 'Something went wrong';
  } catch (error) {
    console.error('Error parsing or retrieving message:', error);
    return 'Something went wrong or invalid entry';
  }
}

// createPayout({destinationIdLean, amount, description}, req.user)
exports.createPayout =  asyncHandler(async (data, credentialId) => {
  try {
    const packageId = 1;
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
    });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return new ErrorResponse(serviceDetails["error"]);
    }
    const URL = serviceDetails.vendor.apiUrl
    const accountId = serviceDetails.vendor.optional1
    const bodyParams = {
      payment_details: [
        {
          destination_details: [
            {
              payment_destination_id: data.destinationIdLean,
              amount: data.amount,
              description: data.description,
              authorize_payment: true, //for auto authorize
            },
          ],
          account_id: accountId, //our account_id
        },
      ],
    };
    let config = {
      method: "post",
      url: `${URL}/payouts/v1/payment/`,
      headers: {
        "Content-Type": "application/json",
        "lean-app-token": leanAppToken,
      },
      data: JSON.stringify(bodyParams),
    };
    if (process.env.NODE_ENV === 'production') {
      const httpsAgent = getHttpAgent();
      if (!httpsAgent) return new ErrorResponse(`Something went wrong with httpsAgent`);
      config = { ...config, httpsAgent };
    }
    const response = await axios(config);
    if (response.data && response) {
      return response.data
    } else {
      return false;
    }
  } catch (error) {
    console.log(error, "<-----------error from  createPayout");
    return false;
  }
});



exports.createLeanPayoutRequest = async (leanAmount, credentialId, orderId, updateDetails, destinationIdLean) => {
  try {
    /**
     *  destinationIdLean is utilized only for e-commerce manager refunds as of now.
     *  It's used when the manager manually selects a preferred bank.
     *  Otherwise, the default user bank is chosen for transactions
     */
    if (!destinationIdLean) {
      let defaultBankAccount = await findDefaultBankAccount({ id: credentialId })
      if (!defaultBankAccount || !defaultBankAccount.destinationIdLean) {
        return {
          status: false,
          message: 'Refund faild, No default bank added for this user.'
        }
      }
      destinationIdLean = defaultBankAccount.destinationIdLean
    }


    let payoutResponse = await this.createPayout({ destinationIdLean: destinationIdLean, amount: leanAmount, description: "REFUND INITIATED" }, credentialId)
    if (!payoutResponse) {
      return {
        status: false,
        message: 'Something went wrong while returning lean transaction'
      }
    }
    const paymentRefId = payoutResponse.payouts_payment_details[0].payment_intent_id
    const stringifiedResponse = JSON.stringify(payoutResponse)
    let createLeanPayoutRes = await createLeanPayout({ orderId, paymentRefId, payoutResponse: stringifiedResponse, updateDetails, status: "INITIATED" }) //for creating data for payout
    if (createLeanPayoutRes && createLeanPayoutRes?.status == 'INITIATED') {
      return {
        status: true,
        message: 'Successfully created lean payout.'
      }
    } else {
      return {
        status: false,
        message: 'Something went wrong in createLeanPayout.'
      }
    }
  } catch (error) {
    console.log({ error })
    return {
      status: false,
      message: error?.message || 'Something went wrong.'
    }
  }
}