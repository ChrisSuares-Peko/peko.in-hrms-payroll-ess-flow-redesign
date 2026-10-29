/* eslint-disable no-prototype-builtins */
/* eslint-disable no-inner-declarations */
/* eslint-disable no-undef */
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
  fetchServiceDetails,
} = require("../../utils/checkAndFetchServiceDetails");
const { createNotification } = require("../../models/use-cases/notification");
const {
  createRazorPayTransaction,
  checkRazorPaySignature,
} = require("../../utils/dapiTransaction");
const { createPGTransaction } = require("../../utils/pamentGatewayTransaction");
const {
  createWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const wallet = require("../../models/entities/wallet");
const emailer = require("../../utils/emailer");
const schedule = require("node-schedule");
const {
  findAllWorkspaces,
  findAllSelectedWorkspaces,
  fetchSinglePlan,
  findOne,
} = require("../../models/use-cases/workspaces");
const { customLog } = require("../../utils/loggerHelper");
const { removeCommissionFields } = require("../../utils/configuredFlag");

const operatorsData = require("../../utils/operatorsData.json");
let accessKey = operatorsData["workspace"]["accessKey"];
let transactionCategory = operatorsData["workspace"]["category"];

const { queryStringIntoBase64 } = require("../../utils/encryptionUtils");
const {
  resolveWorkspaceBookingSuccessEmail,
  resolveWorkspaceReminderEmail,
} = require("../../utils/emailTemplates/workspace");
const { resolvePaymentFailedEmail } = require("../../utils/emailTemplates/common");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { uploadFile } = require("../../utils/commonUploadFile");
const { findOneOrder } = require("../../models/use-cases/order");
const {
  generateOrderInvoiceAttachments,
} = require("../../services/invoiceAndReceipt");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");

exports.findAllWorkspaces = async (req, res, next) => {
  try {
    const params = req.params;
    const result = await findAllWorkspaces(params);
    if (!result) {
      return next(
        new ErrorResponse(`Something went wrong while fetching workspaces`, 500)
      );
    } else {
      return res.status(200).json({
        status: true,
        data: { data: result },
        message: "Fetched all workspaces successfully",
        responseCode: "000",
      });
    }
  } catch (e) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching workspaces",
      data: {},
      responseCode: "001",
    });
  }
};

exports.fetchSingleWorkSpace = async (req, res, next) => {
  try {
    const id = req.params.workspaceId;
    const result = await findOne(id);
    if (!result) {
      return next(
        new ErrorResponse(`Something went wrong while fetching workspaces`, 500)
      );
    } else {
      return res.status(200).json({
        status: true,
        data: { data: result },
        message: "Fetched workspace successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching workspaces",
      data: {},
      responseCode: "001",
    });
  }
};

exports.uploadDocuments = asyncHandler(async (req, res) => {
  try {
    const fileUploadData = req.body.fileUploadData;
    const urlObject = await uploadImage(fileUploadData);
    async function uploadImage(fileUploadData) {
      let tradeLicenseUrl, ownerVisUrl, initialApprovalUrl;
      // Check if fileUploadData is an array
      if (Array.isArray(fileUploadData) || fileUploadData.length > 0) {
        // Iterate through the array
        for (let i = 0; i < fileUploadData.length; i++) {
          let item = fileUploadData[i];
          if (item.file == "txtTradeLicenseDoc") {
            if (
              Object.prototype.hasOwnProperty.call(item, "base64String") &&
              item.imageFormat
            ) {
              tradeLicenseUrl = await uploadFile(
                item.base64String,
                "tradeLicenseUrl",
                item.imageFormat
              );
            }
          } else if (item.file == "txtOwnerVisDoc") {
            if (
              Object.prototype.hasOwnProperty.call(item, "base64String") &&
              item.imageFormat
            ) {
              ownerVisUrl = await uploadFile(
                item.base64String,
                "tradeLicenseUrl",
                item.imageFormat
              );
            }
          } else if (item.file == "initialApproval") {
            if (
              Object.prototype.hasOwnProperty.call(item, "base64String") &&
              item.imageFormat
            ) {
              initialApprovalUrl = await uploadFile(
                item.base64String,
                "tradeLicenseUrl",
                item.imageFormat
              );
            }
          }
        }
      }
      return {
        tradeLicenseUrl,
        ownerVisUrl,
        initialApprovalUrl,
      };
    }
    return res.status(200).json({
      status: true,
      data: urlObject,
      message: "documents uploaded successfully",
      responseCode: "000",
    });
  } catch (error) {
    return res.status(501).json({
      status: false,
      data: {},
      message: "Something went wrong while uploading document",
      responseCode: "001",
    });
  }
});

exports.payment = asyncHandler(async (req, res, next) => {
  if (req.body.razorPay) {
    const checkSignature = checkRazorPaySignature(
      req.query.orderId,
      req.body.razorPay
    );
    if (!checkSignature) {
      return next(new ErrorResponse(`payment failed`, 200));
    }
  }
 
  const transactionId = req.body.transactionId;

  const providerId = transactionId;
  const account = req.body.account;
  const amount = req.body.amount;
  const planId = req.body.planId;
  const planData = await fetchSinglePlan(planId, req.user.id);
  const planDetails = planData;
  let bookDetails = req.body.bookDetails;
  const payCashback = req.body.payCashback;
  const credentialId = req.user.id; //will come from userObject
  const corporateUserId = req.user.corporateId
  const packageId = req.user.packageId; //will come from userObject
  const name = req.user.name;
  const emailId = req.user.email;
  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  const serviceDetails = await fetchServiceDetails({
    corporateUserId,
    credentialId,
    accessKey,
    packageId,
  });

  if (serviceDetails.hasOwnProperty("error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
  }

  let commissionType = serviceDetails.commissionType;
  let cashbackType = serviceDetails.cashbackType;
  let providerCommission = serviceDetails.providerCommission;
  let corporateCashback = serviceDetails.cashback;
  let serviceOperatorId = serviceDetails.id;
  let surcharge = serviceDetails.surcharge;

  serviceDetails.transactionReportRule = "SERVICE_WITH_INVOICE_AND_SURCHARGE" //ONLY TEMP
  const journalPlanDetails = [{
    name: planData?.name ? `Workspace : ${planData.name}` : "Workspace Service",
    commissionMode: planData?.commissionMode,
    commissionType: planData?.commissionType,
    commission: planData?.commission,
    fixedCommissionPerTransaction: planData?.fixedCommissionPerTransaction,
    isCommissionInclGST: planData?.isCommissionInclGST,
    amount: Number(planData?.price),
    quantity: 1,
  }];
  const reportData = await computeJournalData({
    serviceDetails,
    amount: Number(amount),
    paymentMethod: "WALLET",
    partnerDetails,
    paymentGatewayName: "WALLET",
    couponTotalDiscount: req.body.couponTotalDiscount,
    planDetails: journalPlanDetails,
    corporateState: req.user.state || "",
    credentialId,
  });
  // first we will  do transaction
  //let corporateTxnId = new Date().valueOf()
  let corporateTxnId = new Date().valueOf();
  const publishJournal = (type) =>
    publishJournalEvent(
      {
        transactionRef: corporateTxnId,
        type,
        contextSnapshot: {
          credentialId,
          vendor: serviceDetails?.vendor || null,
          registeredBy: req?.user?.registeredBy || null,
        },
        reportData,
      },
      req?.LogTraceId
    );

  let { userDetails } = req.body;

  let { tradeLicenseUrl, ownerVisUrl, initialApprovalUrl } =
    userDetails.fileUploadData;
  // console.log(bookDetails)
  if (userDetails.licenseType === "new") {
    bookDetails = {
      ...bookDetails,
      licenseType: "new",
      initialApprovalUrl,
      tradeName: userDetails?.tradeName,
    };
  } else if (userDetails.licenseType === "existing") {
    bookDetails = {
      ...bookDetails,
      licenseType: "existing",
      tradeLicenseUrl: userDetails.tradeLicenseUrl
        ? userDetails.tradeLicenseUrl
        : tradeLicenseUrl,
      ownerVisUrl,
      companyName: userDetails?.companyName,
      expiryDate: userDetails?.expiryDate,
    };
  }

  let transactionResponse = {};
  const commonParams = {
    providerId,
    corporateTxnId,
    credentialId,
    serviceOperatorId,
    corporateCashback,
    accountNo: account,
    transactionCategory,
    orderAmount: amount,
    commissionType,
    cashbackType,
    providerCommission,
    payCashback,
    surcharge,
    reportData,
  };
  if (req.body.hasOwnProperty("razorPay")) {
    transactionResponse = await createRazorPayTransaction({
      ...commonParams,
      razorPayAmount: req.body.razorPayAmount,
      razorPayResponse: req.body.razorPay,
    });
  } else if (req.body.hasOwnProperty("paymentGatewayResponse")) {
    transactionResponse = await createPGTransaction({
      ...commonParams,
      pgAmount: req.body.pgAmount,
      pgResponse: req.body.paymentGatewayResponse,
    });
  } else {
    transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });
  }
  if (transactionResponse && transactionResponse.hasOwnProperty("error")) {
    return next(new ErrorResponse(transactionResponse["error"], 200));
  }
  publishJournal("payment");
  let updateDetails = {};
  // console.log("transaction response", transactionResponse)
  if (transactionResponse) {
    updateDetails = {
      corporateTxnId,
      providerId: "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify({
        planDetails: planDetails,
        bookingDetails: bookDetails,
      }),
    };
    if (updateDetails.message == "Payment Successful") {
      const orderResponse = JSON.parse(updateDetails.orderResponse);
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      // console.log("date time details", transactionResponse.datetime)
      // console.log("amount is", transactionResponse.amount)
      const paymentDetails = {
        planDetails: JSON.stringify(orderResponse.planDetails),
        transactionId: corporateTxnId,
        account: account,
        amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
      };
      const to = emailId; // Set recipient email address
      const partnerId = req.user.registeredBy || null;
      const { subject, html, sender } = await resolveWorkspaceBookingSuccessEmail(
        name,
        paymentDetails.transactionId,
        paymentDetails.amount,
        orderResponse,
        partnerDetails,
        { partnerId, logTraceId: req?.LogTraceId }
      );
      const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount: parseFloat(amount) || 0,
        surcharge: surcharge || 0,
        couponDiscount: 0,
        corporateTxnId,
        orderId:
          transactionResponse?.orderId ??
          (await findOneOrder({ corporateTxnId }))?.id,
        paymentType: "Workspace",
        credentialId,
        vendor: serviceDetails?.vendor,
        commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
        planDetails: journalPlanDetails,
        commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
        traceId: req?.LogTraceId,
      });
      // Send the booking confirmation with the invoice/receipt attached
      emailer.emailWithMultipleAttachment(
        to,
        subject,
        html,
        invoiceAttachments,
        function (emailErr) {
          if (emailErr) {
            customLog(req?.LogTraceId, "error", {
              message: "Error sending email",
              emailErr,
            });
          }
        },
        sender
      );

      //reminder code starts
      let expireDate = new Date();
      if (orderResponse.planDetails.billingCycle === "MONTHLY") {
        expireDate.setMonth(expireDate.getMonth() + 1);
        // expireDate.setMinutes(expireDate.getMinutes() + 5);
      } else {
        expireDate.setFullYear(expireDate.getFullYear() + 1);
      }
      let reminderDate = new Date(expireDate);
      reminderDate.setDate(reminderDate.getDate() - 5);

      const host = partnerDetails?.baseUrl;

      schedule.scheduleJob(reminderDate,async function () {
        const url = `${host}/more-services/office-address`;
        const to = emailId; // Set recipient email address
        const { subject, html, sender } = await resolveWorkspaceReminderEmail(
          url,
          expireDate,
          name,
          partnerDetails,
          { partnerId, logTraceId: req?.LogTraceId }
        );
        // Call email function to send email with payment details in the body
        emailer.email(to, subject, html, function () {
          // console.log("Email sent to " + to);
        }, sender);
      });

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: "Workspace - Payment successful",
        notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Workspace was successful. Transaction ID: ${paymentDetails?.transactionId}.`,
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
      transactionId: transactionId,
      account: account,
      amount: amount,
    };
    const serviceUrl = partnerDetails?.baseUrl;
    const to = emailId; // Set recipient email address
    const { subject, html, sender } = await resolvePaymentFailedEmail({
      key: EMAIL_TEMPLATE_KEYS.WORKSPACE_PAYMENT_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.WORKSPACES,
      name,
      serviceName: "Workspace Booking",
      url: serviceUrl,
      partnerDetails,
      partnerId: req.user.registeredBy || null,
      logTraceId: req?.LogTraceId,
      fallbackSubject: "Transaction Failed",
    });
    emailer.email(to, subject, html, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    }, sender);

    const notificationData = {
      notificationTitle: "Workspace - Payment unsuccessful",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for account ${paymentDetails.account} with transaction ID ${paymentDetails.transactionId} was Failed`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    createNotification(notificationData);
    //return next(new ErrorResponse([updateDetails.message], 200))
    const walletDetails = await wallet.findOne({
      where: {
        credentialId,
      },
      attributes: ["balance"],
    });
    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
      const encodedQueryParams = queryStringIntoBase64(
        "failure",
        corporateTxnId
      );
      res.redirect(`${req.body.pageAddress}?${encodedQueryParams}`);
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
    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
      const encodedQueryParams = queryStringIntoBase64(
        "success",
        corporateTxnId
      );
      res.redirect(`${req.body.pageAddress}?${encodedQueryParams}`);
    } else
      return res.status(200).json({
        status: true,
        data: {
          ...{},
          ...transactionResponse,
          corporateTxnId,
        },
        message: "payment successfull",
        responseCode: "000",
      });
  }
});

exports.findAllSelectedWorkspaces = asyncHandler(async (req, res, next) => {
  try {
    let { from, to, searchText, page, itemsPerPage } = req.query;
    const sort = req.query.sort && req.query.sort === "DESC" ? "DESC" : "ASC";
    let userId = req.user.id;

    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage;

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }

    let params = {
      from,
      to,
      searchText,
      sort,
      limit,
      offset,
      userId,
    };


    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      params.subCorporateUserId = req.user.subCorporateId;
  }
    const workspaceData = await findAllSelectedWorkspaces(params);
    if (!workspaceData) {
      return next(
        new ErrorResponse(
          `Something went wrong while getting all workspaces from database`,
          500
        )
      );
    } else {
      return res.status(200).json({
        status: true,
        data: {
          totalData: workspaceData?.count,
          result: workspaceData?.rows,
        },
        message: "History Fetched Successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    next(new ErrorResponse(error.message, 400));
  }
});

exports.fetchSinglePlan = asyncHandler(async (req, res, next) => {
  const planId = req.params.id;
  let result = await fetchSinglePlan(planId, req.user.id);

  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while fetching plan`, 500)
    );
  } else {
    removeCommissionFields(result);
    return res.status(200).json({
      status: true,
      data: result,
      message: "Fetched plan successfully",
      responseCode: "000",
    });
  }
});
