const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const axios = require("axios");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const operatorsData = require("../../utils/operatorsData.json");
const accessKey = operatorsData["carbonFootprints"]["accessKey"];
const emailer = require("../../utils/emailer");
const {
  fetchServiceDetails,
  calculateSurchargeWithTax,
} = require("../../utils/checkAndFetchServiceDetails");
const {
  createWalletTransaction,
  updateWalletTransaction,
  refundWalletTransaction,
} = require("../../utils/walletTransaction");
const { createRazorPayTransaction } = require("../../utils/dapiTransaction");
const {
  createPGTransaction,
} = require("../../utils/paymentGatewayTransaction");
const wallet = require("../../models/entities/wallet");
const {
  generatePaymentSuccessEmail,
} = require("../../utils/templatesForEmails");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const { createNotification } = require("../../models/use-cases/notification");
const { commonFailedTemplate } = require("../../utils/emailTemplate/common");
const { customLog } = require("../../utils/loggerHelper");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");


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
  const name = req.user.name;
  const emailId = req.user.email;
  const selectedPackage = req.body.selectedPackage;
  const selectedProject = req.body.selectedProject;
  const corporateUserId = req.user.corporateId;
  let partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  
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
    
    // Ensure amount is a number (already parsed in this file)
    const numericAmount = amount;
    // Calculate surcharge with tax using common function
    const surchargeDetails = await calculateSurchargeWithTax(
      serviceDetails.surcharge,
      serviceDetails.surchargeType,
      numericAmount,
      credentialId
    );
    const surcharge = surchargeDetails.surcharge;
    
    const data = {
      projectId: selectedProject.id,
      userId: username, //username of corporate
      amount: amount,
      co2Offset: req.body.co2Offset,
      credentialId: aredId,
      packageId: selectedPackage?.id,
    };
  

    let subCorporateUserId;
    if (req.user.role === "CORPORATE_SUB_USER") {
      subCorporateUserId = req.user.subCorporateId;
    }
    //first we will  do transaction
    let corporateTxnId = req.body.corporateTxnId;
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
      subCorporateUserId,
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
        couponCode: req.body.couponCode,
        corporateUserId,
        partnerId: req.user.registeredBy
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
        couponId: transactionResponse.couponId,
        
      };
      if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
        await cancelPGTransaction(corporateTxnId);
        await refundWalletTransaction(updateDetails);
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
        //orderResponse: JSON.stringify(result.data.data),
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
            (parseFloat(convertedAmount) || 0) + (parseFloat(surcharge) || 0)  - transactionResponse.couponDiscount
          ).toFixed(2),
        };

        const to = emailId; // Set recipient email address
        const subject = "Carbon credit purchase successful"; // Set email subject
        const resolvedCarbon = await resolveEmailTemplate({
          key: EMAIL_TEMPLATE_KEYS.CARBON_FOOTPRINT_CREDIT_PURCHASE,
          service: EMAIL_TEMPLATE_SERVICES.CARBON_FOOTPRINT,
          variables: {
            name,
            transactionId: paymentDetails.transactionId,
            amount: paymentDetails.amount,
            branding: partnerDetails?.branding || 'Peko',
            website: partnerDetails?.baseUrl || 'https://peko.one/in',
            logo: partnerDetails?.logo,
            ...v2LayoutVariables(partnerDetails),
          },
          fallback: () => generatePaymentSuccessEmail(name, paymentDetails.transactionId, paymentDetails.amount, partnerDetails),
          fallbackSubject: subject,
          logTraceId: req?.LogTraceId,
        });
        const body = resolvedCarbon.html;
        // Call email function to send email with payment details in the body
        emailer.email({to, subject: resolvedCarbon.subject, body}, function () {
          // console.log("Email sent to " + to);
        });

        const notificationData = {
          notificationTitle: "Payment Successful",
          notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Zero Carbon with transaction ID ${paymentDetails.transactionId} was successful`,
          notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
          notificationCategory: "CORPORATE", // Replace with the relevant category
          notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
        };
        if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
          const subcorporateUsername = req.user.subCorporateUsername;
          if (subcorporateUsername) {
            notificationData.notificationTo.push(subcorporateUsername);
          }
        }
        createNotification(notificationData);
      }
      await updateWalletTransaction(updateDetails);
    }

    if (updateDetails.message !== "Payment Successful") {
      //return next(new ErrorResponse([updateDetails.message], 200))
      const paymentDetails = {
        transactionId: corporateTxnId,
        account: account,
        amount: (parseFloat(amount) + parseFloat(surcharge) - transactionResponse.couponDiscount).toFixed(2),
      };
      const subject = "Payment Failed";
      const to = emailId;
      const logo = await fetchPartnerDetails(req.user.registeredBy);
      const serviceUrl = logo?.baseUrl;
      const body = commonFailedTemplate(name, "Carbon footprint", serviceUrl,logo);

      emailer.email({to, subject, body}, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      });
      const notificationData = {
        notificationTitle: "Payment Failed",
        notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Zero Carbon with transaction ID ${paymentDetails.transactionId} was Failed`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
        const subcorporateUsername = req.user.subCorporateUsername;
        if (subcorporateUsername) {
          notificationData.notificationTo.push(subcorporateUsername);
        }
      }
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId,
        },
        attributes: ["balance"],
      });
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
