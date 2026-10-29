const asyncHandler = require("../../middlewares/async");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { depositToWallet } = require("../../models/use-cases/wallet");
const { customLog } = require("../../utils/loggerHelper");
const sequelizeConfig = require("../../configs/database/index");
const emailer = require("../../utils/emailer");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { createNotification } = require("../../models/use-cases/notification");
const { commonFailedTemplate } = require("../../utils/emailTemplate/common");
const { generateWalletTopupSuccessEmail } = require("../../utils/emailTemplates/wallet");
const { formatNumberWithLocalString } = require("../../utils/formatter");

// const operatorData = require("../../utils/operatorsData.json");
// const accessKey = operatorData["pekoWallet"]["accessKey"]

exports.payment = asyncHandler(async (req, res) => {
  //check disableService?
  const transactionId = `${new Date().valueOf()}${Math.floor(Math.random() * 90000 + 10000)}`;
  const account = req.body.account;
  const amount = req.body.pgAmount;
  const credentialId = req.user.id; //will come from userObject
  // const corporateUserId = req.user.corporateId //will come from userObject
  const name = req.user.name;
  const emailId = req.user.email;

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

  let corporateTxnId = transactionId;
  let transactionResponse = {};

  const data = { credentialId, amount, remarks: "Fund added through gateway", corporateTxnId: transactionId };

  const result = await sequelizeConfig.transaction(async (t) => {
    return await depositToWallet(data, t);
  });
  let updateDetails = {};
  if (
    !result ||
    (result.data &&
      (Object.prototype.hasOwnProperty.call(result.data, "errorcode") || Object.prototype.hasOwnProperty.call(result.data, "errorCode")))
  ) {
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      registeredById: req.user.registeredBy,
      couponId: transactionResponse.couponId
    };
    if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
      await cancelPGTransaction(corporateTxnId);
    }
  } else {
    updateDetails = {
      corporateTxnId,
      providerId: "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify({}),
    };
  }

  if (updateDetails.message == "Payment Successful") {
    const orderResponse = JSON.parse(updateDetails.orderResponse);
    // Create a payment details object with the relevant details
    transactionResponse.datetime = new Date();
    transactionResponse.amount = amount;
    const couponDiscount = transactionResponse.couponDiscount || 0;
    const finalAmount = parseFloat(amount) - Number(couponDiscount);
    const paymentDetails = {
      products: JSON.stringify(orderResponse.subscriptionDetails || {}),
      transactionId: corporateTxnId,
      account: account,
      amount: finalAmount,
    };
    const to = emailId; // Set recipient email address
    const subject = `Your Wallet Top-up of ₹${formatNumberWithLocalString(finalAmount)} was Successful`; // Set email subject
    const formattedAmount = formatNumberWithLocalString(finalAmount);
    const formattedWalletBalance = formatNumberWithLocalString(result.corporateFinalBalance || 0);
    const body = generateWalletTopupSuccessEmail({
      name,
      transactionId: paymentDetails.transactionId,
      amount: formattedAmount,
      templateDetails: partnerDetails,
      walletBalance: formattedWalletBalance,
    }); 

    // Send push notification with payment details
    const notificationData = {
      notificationTitle: "Wallet Top-up Successful",
      notificationBrief: `₹ ${formattedAmount}  has been successfully added to your wallet. Your current balance is ₹ ${formattedWalletBalance}.`,
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

    emailer.email({ to, subject, body }, async (emailErr) => {
      if (emailErr) {
        customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr });
      } else {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
      }
    });
    createNotification(notificationData);
  }
  if (updateDetails.message !== "Payment Successful") {
    const couponDiscount = transactionResponse.couponDiscount || 0;
    const paymentDetails = {
      transactionId: corporateTxnId,
      account: parseFloat(account),
      amount: (parseFloat(amount) - Number(couponDiscount)).toFixed(2),
    };
    const notificationData = {
      notificationTitle: "Wallet topup - Payment unsuccessful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Wallet topup was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
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
    const serviceUrl = partnerDetails?.baseUrl;
    const to = emailId;
    const subject = "Payment failed";
    const body = commonFailedTemplate(name, "Wallet topup", serviceUrl, partnerDetails);

    emailer.email({ to, subject, body }, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
    });
    // const walletDetails = await wallet.findOne({
    //     where: {
    //         credentialId
    //     },
    //     attributes: ['balance']
    // })
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {
        ...{},
        corporateFinalBalance: result["corporateFinalBalance"],
      },
      responseCode: "003",
    });
  } else {
    return res.status(200).json({
      status: true,
      data: {
        ...{},
        ...transactionResponse,
        corporateTxnId,
        corporateFinalBalance: result["corporateFinalBalance"],
      },
      message: "payment successful",
      responseCode: "000",
    });
  }
});
