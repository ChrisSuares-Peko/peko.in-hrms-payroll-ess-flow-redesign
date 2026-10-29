const axios = require("axios");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const accessKey = "carbon_footprint";

const {
  fetchServiceDetails,
} = require("../../utils/checkAndFetchServiceDetails");
const {
  createWalletTransaction,
  updateWalletTransaction,
  refundWalletTransaction,
} = require("../../utils/walletTransaction");
const { createRazorPayTransaction } = require("../../utils/dapiTransaction");
const {
  createPGTransaction,
  createPaytmTransaction,
} = require("../../utils/pamentGatewayTransaction");
const {
  updateCorporateDetails,
} = require("../../models/use-cases/corporateUser");
const emailer = require("../../utils/emailer");
const { resolveCarbonCreditPurchaseEmail } = require("../../utils/emailTemplates/carbonFootprint");
const { resolvePaymentFailedEmail } = require("../../utils/emailTemplates/common");
const { EMAIL_TEMPLATE_SERVICES, EMAIL_TEMPLATE_KEYS } = require("../../utils/emailTemplateKeys");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");
const wallet = require("../../models/entities/wallet");
const { refundGatewayTransaction } = require("./pluralGateway");
const { createNotification } = require("../../models/use-cases/notification");
const { setValue, getValue } = require("../../utils/cacheDataMethods");

exports.getQuestions = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const type = req.query.type;

  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
  }
  const URL = serviceDetails.vendor.apiUrl;
  const token = await getToken(serviceDetails.vendor, accessKey);
  if (token) {
    let options = {
      method: "GET",
      url: `${URL}/api/v1/partner/corporate/calculator?advanced=${
        type == "BASIC" ? "false" : "true"
      }`,
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    };

    axios(options)
      .then(function (response) {
        return res.send({
          status: true,
          message: "Fetched all questions successfully",
          data: response.data,
          responseCode: "000",
        });
      })
      .catch(function (error) {
        console.log(error);
        return res.send({
          status: false,
          message: error.message,
          data: {},
          responseCode: "001",
        });
      });
  } else {
    res.send({
      status: false,
      message: "something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.submitAnswers = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const data = req.body;
  const username = req.user.username;

  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
  }
  const URL = serviceDetails.vendor.apiUrl;
  const token = await getToken(serviceDetails.vendor, accessKey);
  if (token) {
    let options = {
      method: "post",
      url: `${URL}/api/v1/partner/corporate/calculator/${username}`,
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
      data: data,
    };
    axios(options)
      .then(function (response) {
        if (response?.data?.success) {
          return res.send({
            status: true,
            message: "submit answers successfully",
            data: response.data,
            responseCode: "000",
          });
        } else {
          return res.send({
            status: false,
            message: response?.data?.error,
            data: {},
            responseCode: "001",
          });
        }
      })
      .catch(function (error) {
        console.log(error);
        return res.send({
          status: false,
          message: error.message,
          data: {},
          responseCode: "001",
        });
      });
  } else {
    res.send({
      status: false,
      message: "something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.getProjects = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  let { itemsPerPage, page, searchQuery } = req.query;
  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
  }
  const URL = serviceDetails.vendor.apiUrl;
  const token = await getToken(serviceDetails.vendor, accessKey);
  if (token) {
    let options = {
      method: "GET",
      url: `${URL}/api/v1/partner/corporate/project?itemsPerPage=${itemsPerPage}&page=${page}&searchQuery=${searchQuery}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    };

    axios(options)
      .then(function (response) {
        return res.send({
          status: true,
          message: "Fetched projects successfully",
          data: response.data,
          responseCode: "000",
        });
      })
      .catch(function (error) {
        console.log(error);
        return res.send({
          status: false,
          message: error?.message,
          data: {},
          responseCode: "001",
        });
      });
  } else {
    res.send({
      status: false,
      message: "something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.payment = asyncHandler(async (req, res, next) => {
  let transactionCategory = "Others";
  const transactionId = req.body.transactionId;
  const providerId = transactionId;
  const account = "NA";
  const amount = parseFloat(req.body.amount);
  let convertedAmount = parseFloat(req.body.amountInInr);
  const payCashback = req.body.payCashback;
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const username = req.user.username;
  const selectedPackage = req.body.selectedPackage;
  const selectedProject = req.body.selectedProject;
  const name = req.user.name;
  const emailId = req.user.email;
  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
  }
  const URL = serviceDetails.vendor.apiUrl;
  const token = await getToken(serviceDetails.vendor, accessKey);
  const aredId = serviceDetails.vendor.optional3;
  if (token) {
    let commissionType = serviceDetails.commissionType;
    let cashbackType = serviceDetails.cashbackType;
    let providerCommission = serviceDetails.providerCommission;
    let corporateCashback = serviceDetails.cashback;
    let serviceOperatorId = serviceDetails.id;
    let surcharge = serviceDetails.surcharge;
    const data = {
      projectId: selectedProject.id,
      userId: username, //username of corporate
      amount: amount,
      co2Offset: req.body.co2Offset,
      credentialId: aredId,
      packageId: selectedPackage?.id,
    };

    //first we will  do transaction
    let corporateTxnId = new Date().valueOf();
    let transactionResponse = {};
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      accountNo: account,
      transactionCategory,
      orderAmount: convertedAmount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
    };
    if (Object.prototype.hasOwnProperty.call(req.body, "razorPay")) {
      transactionResponse = await createRazorPayTransaction({
        ...commonParams,
        razorPayAmount: req.body.razorPayAmount,
        razorPayResponse: req.body.razorPay,
      });
    } else if (
      Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")
    ) {
      transactionResponse = await createPGTransaction({
        ...commonParams,
        pgAmount: req.body.pgAmount,
        pgResponse: req.body.paymentGatewayResponse,
      });
    } else if (
      Object.prototype.hasOwnProperty.call(req.body, "paytmResponse")
    ) {
      transactionResponse = await createPaytmTransaction({
        ...commonParams,
        paytmAmount: req.body.paytmAmount,
        paytmResponse: req.body.paytmResponse,
      });
    } else {
      transactionResponse = await createWalletTransaction({
        ...commonParams,
        amount,
      });
    }
    if (
      transactionResponse &&
      Object.prototype.hasOwnProperty.call(transactionResponse, "error")
    ) {
      return next(new ErrorResponse(transactionResponse["error"], 200));
    }
    const config = {
      method: "post",
      url: `${URL}/api/v1/partner/corporate/neutralize/transact`,
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
      data: data,
    };
    let result = await axios(config);

    let updateDetails = {};
    if (
      !result ||
      (Object.prototype.hasOwnProperty.call(result, "data") &&
        Object.prototype.hasOwnProperty.call(result.data, "success") &&
        !result.data.success)
    ) {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: "Not Available",
        message: result?.data?.data?.status,
        registeredById: req.user.registeredBy,
      };
      if (
        Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")
      ) {
        let refundPGResponse = await refundGatewayTransaction(
          req,
          req.body.paymentGatewayResponse
        );
        if (
          refundPGResponse?.ppc_PinePGTxnStatus == 6 &&
          refundPGResponse.ppc_TxnResponseCode == 1
        ) {
          await refundWalletTransaction(updateDetails);
        }
      } else {
        await refundWalletTransaction(updateDetails);
      }
    } else {
      transactionResponse.datetime = new Date();
      updateDetails = {
        corporateTxnId,
        providerId: result.data.data.internalId
          ? result.data.data.internalId
          : "Not Available",
        status: "SUCCESS",
        orderResponse: JSON.stringify({
          data: result.data,
          planDetails: selectedPackage,
          project: req.body.selectedProject,
        }),
        message: "Payment Successful",
      };
      if (updateDetails.message == "Payment Successful") {
        const paymentDetails = {
          transactionId: corporateTxnId,
          account: account,
          amount: (
            (parseFloat(convertedAmount) || 0) + (parseFloat(surcharge) || 0)
          ).toFixed(2),
        };

        const to = emailId; // Set recipient email address
        const partnerDetails = req.user.registeredBy
          ? await fetchPartnerDetails(req.user.registeredBy)
          : await partnerLogos();
        const { subject, html, sender } = await resolveCarbonCreditPurchaseEmail(
          name,
          paymentDetails.transactionId,
          paymentDetails.amount,
          partnerDetails,
          { partnerId: req.user.registeredBy || null, logTraceId: req?.LogTraceId }
        );
        emailer.email(to, subject, html, function () {}, sender);
        const notificationData = {
          notificationTitle: "Payment Successful",
          notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Zero Carbon with transaction ID ${paymentDetails.transactionId} was successful`,
          notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
          notificationCategory: "CORPORATE", // Replace with the relevant category
          notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
        };
        createNotification(notificationData);
      }
      await updateWalletTransaction(updateDetails);
    }

    if (updateDetails.message !== "Payment Successful") {
      const paymentDetails = {
        transactionId: corporateTxnId,
        account: account,
        amount: (parseFloat(convertedAmount) + parseFloat(surcharge)).toFixed(
          2
        ),
      };

      const notificationData = {
        notificationTitle: "Payment Failed",
        notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Zero Carbon with transaction ID ${paymentDetails.transactionId} was Failed`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      let serviceUrl = "";
      const to = emailId;
      if (process.env.NODE_ENV === "staging") {
        serviceUrl = process.env.FRONTEND_STAGING_URL;
      } else if (process.env.NODE_ENV === "production") {
        serviceUrl = process.env.FRONTEND_PRODUCTION_URL;
      }
      const partnerDetails = req.user.registeredBy
        ? await fetchPartnerDetails(req.user.registeredBy)
        : await partnerLogos();
      const { subject, html, sender } = await resolvePaymentFailedEmail({
        key: EMAIL_TEMPLATE_KEYS.CARBON_FOOTPRINT_PAYMENT_FAILED,
        service: EMAIL_TEMPLATE_SERVICES.CARBON_FOOTPRINT,
        name,
        serviceName: "Carbon footprint",
        url: serviceUrl,
        partnerDetails,
        partnerId: req.user.registeredBy || null,
        logTraceId: req?.LogTraceId,
        fallbackSubject: "Payment Failed",
      });

      emailer.email(to, subject, html, function () {
        console.log("Email sent to " + to);
      }, sender);
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });
      if (
        Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")
      ) {
        res.redirect(
          `${req.body.pageAddress}?status="failure"&transactionId=${corporateTxnId}`
        );
      } else
        return res.status(200).json({
          status: false,
          data: {
            ...{},
            corporateFinalBalance: walletDetails["balance"],
          },
          message: "payment failed",
          responseCode: "001",
        });
    } else {
      if (
        Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")
      ) {
        res.redirect(
          `${req.body.pageAddress}?status="success"&transactionId=${corporateTxnId}`
        );
      } else
        return res.status(200).json({
          status: true,
          data: {
            ...{},
            ...transactionResponse,
            resultData: result.data.data,
            corporateTxnId,
          },
          message: "payment successfull",
          responseCode: "000",
        });
    }
  } else {
    res.send({
      status: false,
      data: {},
      message: "something went wrong!!",
      responseCode: "001",
    });
  }
});

exports.details = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const username = req.user.username;

  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
  }
  const URL = serviceDetails.vendor.apiUrl;
  const token = await getToken(serviceDetails.vendor, accessKey);
  if (token) {
    let options = {
      method: "GET",
      url: `${URL}/api/v1/partner/corporate/dashboard/${username}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    };

    axios(options)
      .then(function (response) {
        return res.send({
          status: true,
          message: "Fetched details successfully",
          data: response.data,
          responseCode: "000",
        });
      })
      .catch(function (error) {
        console.log(error);
        return res.send({
          status: false,
          message: error.message,
          data: {},
          responseCode: "001",
        });
      });
  } else {
    res.send({
      status: false,
      message: "something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.checkUserExists = asyncHandler(async (req, res) => {
  try {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const userData = req.user;

    const corporateUserId = req.user.corporateId;

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      res.send({
        status: false,
        message: "something went wrong",
        data: {},
        responseCode: "001",
      });
    }
    const { status, message, error } = await isAredCredentialExists(
      serviceDetails.vendor,
      userData
    );
    if (!status) {
      res.send({
        status: false,
        message: message || error,
        data: {},
        responseCode: "001",
      });
    }
    res.send({
      status: true,
      message: "successfull",
      data: {},
      responseCode: "000",
    });
  } catch (error) {
    res.send({
      status: false,
      message: "something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.merchantBalance = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;

  let { amount, projectId, credits } = req.body;

  amount = parseFloat(amount);
  credits = parseFloat(credits);
  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
  }
  const URL = serviceDetails.vendor.apiUrl;
  const token = await getToken(serviceDetails.vendor, accessKey);
  if (token) {
    let options = {
      method: "GET",
      url: `${URL}/api/v1/partner/inventoryStock/${projectId}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    };

    axios(options)
      .then(function (response) {
        if (
          !response.data.success ||
          Object.prototype.hasOwnProperty.call(response.data, "error")
        ) {
          return next(
            new ErrorResponse(
              "Something went wrong, please try again later.",
              500
            )
          );
        }
        let balance = response.data.data?.balance;
        let inventoryStock = response.data.data?.inventoryStock;
        if (balance && inventoryStock) {
          balance = parseFloat(balance);
          inventoryStock = parseFloat(inventoryStock);
          if (balance >= amount && inventoryStock >= credits) {
            return res.status(200).json({
              status: true,
              data: {},
              message: "Proceed to payment",
              responseCode: "000",
            });
          } else {
            return next(
              new ErrorResponse(
                "Something went wrong, please try again later.",
                500
              )
            );
          }
        } else {
          return next(
            new ErrorResponse(
              "Something went wrong, please try again later.",
              500
            )
          );
        }
      })
      .catch(function (error) {
        console.log(error);
        return next(
          new ErrorResponse(
            "Something went wrong, please try again later.",
            500
          )
        );
      });
  } else {
    return next(
      new ErrorResponse("Something went wrong, please try again later.", 400)
    );
  }
});

async function isAredCredentialExists(details, user) {
  try {
    const userData = { id: user.username };
    const userExistsConfig = {
      method: "post",
      url: `${details["apiUrl"]}/api/v1/partner/corporate/userExists`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(userData),
    };

    const userExistsResponse = await axios(userExistsConfig);

    if (userExistsResponse.data.success) {
      // return true;
      return { status: true, message: "User already exists." };
    } else {
      const mobileNo = user.mobileNo.slice(-10); //else throwing error
      const signupData = {
        name: user.name,
        username: user.email,
        password: generatePassword(),
        email: user.email,
        mobileNo: mobileNo,
        registeredBy: user.registeredBy,
        userId: user.username,
      };

      const signupConfig = {
        method: "post",
        url: `${details["apiUrl"]}/api/v1/partner/corporate/signUp`,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(signupData),
      };
      const signupResponse = await axios(signupConfig);

      if (!signupResponse.data.success || signupResponse.data.error) {
        // return false;
        return {
          status: false,
          message: "Sign Up failed or error occurred.",
          error: signupResponse?.data?.error,
        };
      }
      let corporateId = user.corporateId;
      let aredUserId = signupResponse.data.data.id;
      await updateCorporateDetails({ id: corporateId }, { aredUserId });
      return { status: true, message: "Sign Up successful." };
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return {
      status: false,
      message: "An error occurred.",
      error: error?.message,
    };
  }
}

function generatePassword() {
  return (new Date().valueOf() + "").slice(6);
}

async function getToken(details, accessKey) {
  let isTokenData = await getValue(`ared-token-${accessKey}`);
  if (isTokenData) {
    return isTokenData;
  } else {
    let data = JSON.stringify({
      username: details["optional1"],
      password: details["optional2"],
    });
    let config = {
      method: "post",
      url: `${details["apiUrl"]}/api/v1/partner/login`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    let response = await axios(config);
    if (response && response.data.success && response.data.data.token) {
      let token = response.data.data.token;
      await setValue(`ared-token-${accessKey}`, 5184000, token);
      return token;
    } else {
      return false;
    }
  }
}

exports.checkUserAndDashboardData = asyncHandler(async (req, res) => {
  try {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const userData = req.user;
    let counters;
    let projects;
    const corporateUserId = req.user.corporateId;

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return res.send({
        status: false,
        message: "something went wrong",
        data: {},
        responseCode: "001",
      });
    }
    const { status, message, error } = await isAredCredentialExists(
      serviceDetails.vendor,
      userData
    );
    if (!status) {
      return res.send({
        status: false,
        message: error || message,
        data: {},
        responseCode: "001",
      });
    }
    const username = req.user.username;
    const URL = serviceDetails.vendor.apiUrl;
    const token = await getToken(serviceDetails.vendor, accessKey);
    if (token) {
      let options = {
        method: "GET",
        url: `${URL}/api/v1/partner/corporate/dashboard/${username}`,
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      };

      axios(options)
        .then(async function (response) {
          counters = response?.data?.data;

          const Token = await getToken(serviceDetails.vendor, accessKey);
          if (Token) {
            let options = {
              method: "GET",
              url: `${URL}/api/v1/partner/corporate/project?itemsPerPage=4&page=1`,
              headers: {
                "Content-Type": "application/json",
                Accept: "*/*",
                Authorization: `Bearer ${Token}`,
              },
            };

            axios(options)
              .then(function (response) {
                projects = response?.data?.data;
                return res.send({
                  status: true,
                  message: "Fetched all dashboard details successfully",
                  data: { counters, projects },
                  responseCode: "000",
                });
              })
              .catch(function (error) {
                console.log(error);
                return res.send({
                  status: false,
                  message: error?.message,
                  data: {},
                  responseCode: "001",
                });
              });
          } else {
            return res.send({
              status: false,
              message: "something went wrong",
              data: {},
              responseCode: "001",
            });
          }
        })
        .catch(function (error) {
          console.log(error);
          return res.send({
            status: false,
            message: error.message,
            data: {},
            responseCode: "001",
          });
        });
    } else {
      return res.send({
        status: false,
        message: "something went wrong",
        data: {},
        responseCode: "001",
      });
    }
  } catch (error) {
    return res.send({
      status: false,
      message: "something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.fetchProjectDetails = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  let { id } = req.params;

  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
  }
  const URL = serviceDetails.vendor.apiUrl;
  const token = await getToken(serviceDetails.vendor, accessKey);
  if (token) {
    let options = {
      method: "GET",
      url: `${URL}/api/v1/partner/corporate/project/${id}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    };

    axios(options)
      .then(function (response) {
        return res.send({
          status: true,
          message: "Fetched projects details successfully",
          data: response.data,
          responseCode: "000",
        });
      })
      .catch(function (error) {
        console.log(error);
        return res.send({
          status: false,
          message: error?.message,
          data: {},
          responseCode: "001",
        });
      });
  } else {
    res.send({
      status: false,
      message: "something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.fetchNeutralizeDetails = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  let { id } = req.params;
  let usdToInr = process.env.USD_TO_INR;

  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
  }
  const URL = serviceDetails.vendor.apiUrl;
  const token = await getToken(serviceDetails.vendor, accessKey);
  if (token) {
    let options = {
      method: "GET",
      url: `${URL}/api/v1/partner/corporate/neutralize/${id}/${req.user.username}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    };

    axios(options)
      .then(function (response) {
        return res.send({
          status: true,
          message: "Fetched neutralize details successfully",
          data: {
            ...response.data,
            usdToInr: parseFloat(usdToInr),
          },
          responseCode: "000",
        });
      })
      .catch(function (error) {
        console.log(error);
        return res.send({
          status: false,
          message: error?.message,
          data: {},
          responseCode: "001",
        });
      });
  } else {
    res.send({
      status: false,
      message: "something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.getAllProjects = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
  }
  const URL = serviceDetails.vendor.apiUrl;
  const token = await getToken(serviceDetails.vendor, accessKey);
  if (token) {
    let options = {
      method: "GET",
      url: `${URL}/api/v1/partner/corporate/project`,
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    };

    axios(options)
      .then(function (response) {
        let projects = response?.data?.data;
        let projectOptions = projects.map((data) => {
          return {
            id: data.id,
            name: data.name,
          };
        });
        return res.send({
          status: true,
          message: "Fetched all projects successfully",
          data: { projectOptions },
          responseCode: "000",
        });
      })
      .catch(function (error) {
        console.log(error);
        return res.send({
          status: false,
          message: error?.message,
          data: {},
          responseCode: "001",
        });
      });
  } else {
    res.send({
      status: false,
      message: "something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.findAllTransactionsAndCount = asyncHandler(async (req, res, next) => {
  let { page, itemsPerPage, searchQuery, from, to } = req.query;
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const username = req.user.username;
  let usdToInr = process.env.USD_TO_INR;
  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
  }
  const URL = serviceDetails.vendor.apiUrl;
  const token = await getToken(serviceDetails.vendor, accessKey);
  if (token) {
    let options = {
      method: "GET",
      url: `${URL}/api/v1/partner/corporate/transaction/${username}?page=${page}&itemsPerPage=${itemsPerPage}&searchQuery=${searchQuery}&from=${from}&to=${to}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    };

    axios(options)
      .then(function (response) {
        return res.send({
          status: true,
          message: "Fetched all transaction successfully",
          data: {
            ...response.data,
            usdToInr: parseFloat(usdToInr),
          },
          responseCode: "000",
        });
      })
      .catch(function (error) {
        console.log(error);
        return res.send({
          status: false,
          message: error?.message,
          data: {},
          responseCode: "001",
        });
      });
  } else {
    res.send({
      status: false,
      message: "something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});
