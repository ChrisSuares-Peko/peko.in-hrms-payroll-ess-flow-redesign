const attestation = require("../../models/entities/attestation");
const ErrorResponse = require("../../utils/error-response");
const asyncHandler = require("../../middlewares/async");
const { create, findAllAttestationCount, attestationSingleDetails } = require("../../models/use-cases/attestation");
const {
  fetchServiceDetails,
  calculateSurcharge,
} = require("../../utils/checkAndFetchServiceDetails");
const emailer = require('../../utils/emailer')
// const { Op } = require('sequelize');
const { createNotification } = require("../../models/use-cases/notification");
const { createPGTransaction } = require("../../utils/pamentGatewayTransaction");

const {
  createWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
// const {
//     createNotification
// } = require('../../models/use-cases/notification');
const {
  findLastFiveTransactions,
} = require("../../models/use-cases/serviceOperator");
const wallet = require("../../models/entities/wallet");
const { commonFailedTemplate } = require("../../utils/emailTemplates/common");
const { generateAttestationPaymentSuccessEmail } = require("../../utils/emailTemplates/attestation");
const cleverTap = require("../../services/CleverTap");
const { calculateAmountWithTax } = require("../../services/GSTandTAXcalculation");
const { createExpense } = require("./accounting");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { customLog } = require("../../utils/loggerHelper");
const { uploadFile } = require("../../utils/commonUploadFile");
let accessKey = "document_attestation";

exports.saveFileInFirebase = asyncHandler(async (req, res, next) => {
  let fileUrl;
  const passportDoc = req.body.passportDoc;
  const user = req.user;
  if (
    !Object.prototype.hasOwnProperty.call(passportDoc, "documentBase") ||
    !passportDoc.documentFormat
  ) {
    return next(new ErrorResponse(`Please choose a valid file`, 200));
  }
  const filePath = `${user?.role ? user?.role.toLowerCase() : "unknown-role"
    }/${user?.username ? user?.username : "unknown-user"}/attestation-doc`
  fileUrl = await uploadFile(
    passportDoc.documentBase,
    filePath,
    passportDoc.documentFormat
  );
  if (fileUrl) {
    return res.status(200).json({
      status: true,
      message: "File uploaded successfully",
      data: {
        firebaseUrl: fileUrl,
      },
      responseCode: "000",
    });
  } else {
    return res.status(400).json({
      status: false,
      message: "Something went wrong while uploading file",
      data: {},
      responseCode: "000",
    });
  }
});

exports.payment = asyncHandler(async (req, res, next) => {
  //check disableService?
  //search for package,cashback,serviceOperator,vendor?
  //userBalance
  //Entry for payment
  //API call
  //update the payment
  let transactionCategory = "Document Attestation";

  const transactionId = req.body.transactionId;
  const providerId = transactionId;
  const account = req.body.account;
  const amount = req.body.amount;
  const attestationDetails = req.body.attestationDetails;
  const payCashback = req.body.payCashback;
  const credentialId = req.user.id; //will come from userObject
  // const corporateUserId = req.user.corporateId //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const corporateUserId = req.user.corporateId
  const emailId = req.user.email
  const name = req.user.name
  // const name = req.user.name
  // const emailId = req.user.email

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

  const accounts_id = req.user.accounts_id;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 200));
  }
  let commissionType = serviceDetails.commissionType;
  let cashbackType = serviceDetails.cashbackType;
  let providerCommission = serviceDetails.providerCommission;
  let corporateCashback = serviceDetails.cashback;
  let serviceOperatorId = serviceDetails.id;
  const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
  const surcharge = await calculateAmountWithTax(surchargeWithoutTax)
  // first we will  do transaction
  //let corporateTxnId = new Date().valueOf()

  serviceDetails.transactionReportRule = "SERVICE_WITH_INVOICE_AND_SURCHARGE" //ONLY TEMP
  const reportData = {};

  let corporateTxnId = new Date().valueOf();
  let transactionResponse = {};
  if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
    transactionResponse = await createPGTransaction({
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      accountNo: account,
      pgAmount: req.body.pgAmount,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      pgResponse: req.body.paymentGatewayResponse,
      surcharge,
    });
  } else {
    transactionResponse = await createWalletTransaction({
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      surcharge,
      accountNo: account,
      amount,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      reportData
    });
  }

  if (
    transactionResponse &&
    Object.prototype.hasOwnProperty.call(transactionResponse, "error")
  ) {
    return next(new ErrorResponse(transactionResponse["error"], 200));
  }

  let updateDetails = {};
  if (transactionResponse) {
    
    let {transactionId} = transactionResponse
    // Extract and modify the amount
let updatedData = {
  ...attestationDetails,
  amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
  transactionId 
};
    let result = await create(updatedData);

    updateDetails = {
      corporateTxnId,
      providerId: "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify({
        attestationDetails: result,
      }),
    };
    if (updateDetails.message == "Payment Successful") {
      // must use this in transaction events
      cleverTap.uploadEvent({
        eventName: "Transactions",
        eventData: {
          Status: "Payment Success",
        },
        email: emailId,
      },partnerDetails);
      const orderResponse = JSON.parse(updateDetails.orderResponse);
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        attestationDetails: JSON.stringify(orderResponse.attestationDetails),
        details: orderResponse.attestationDetails,
        transactionId: corporateTxnId,
        account: account,
        amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
      };

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: `Document attestation - Payment successful`,
        notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Document attestation was successful. Transaction ID: ${paymentDetails?.transactionId}.`,        
        notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
        notificationCategory: "CORPORATE", // Replace with the relevant category
        notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
      };

        createExpense({
          credentialId,
          packageId,
          corporateUserId
        },{accounts_id, amount:paymentDetails.amount, credentialId: req.user.id, category: serviceDetails?.serviceCategory,
          merchant: serviceDetails?.vendor?.vendorName})
      
      createNotification(notificationData);

      const to = emailId; // Set recipient email address
      const subject = "Document attestation service - Payment successful"; // Set email subject
      // Optional: Send email after PDF generation
      const body = generateAttestationPaymentSuccessEmail(name, corporateTxnId, paymentDetails.amount, paymentDetails.details,partnerDetails);
        emailer.emailWithMultipleAttachment(to, subject, body, [], async (emailErr) => {
          if (emailErr) {
            customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr })
          } else {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
          }
        });
    }
    await updateWalletTransaction(updateDetails);
  }
  if (updateDetails.message !== "Payment Successful") {
    // must use this in transaction events
    cleverTap.uploadEvent({
      eventName: "Transactions",
      eventData: {
        Status: "Payment Failure",
      },
      email: emailId,
    },partnerDetails);
    const paymentDetails = {
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
    };
    const notificationData = {
      notificationTitle: `Document attestation - Payment unsuccessful`,
      notificationBrief: `Payment of ₹ ${paymentDetails?.amount} for Document attestation was unsuccessful. Transaction ID: ${paymentDetails?.transactionId}.`,
      notificationTo: [req.user.username],
      notificationCategory: 'CORPORATE',
      notificationBy: 'ADMIN'
    };
    createNotification(notificationData);
    //return next(new ErrorResponse([updateDetails.message], 200))
    const serviceUrl = partnerDetails?.baseUrl;
    const to = emailId;
    const subject = 'Payment failed'
    const body = commonFailedTemplate(name, "Attestation booking", serviceUrl,partnerDetails);

    emailer.email(to, subject, body, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
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
        message: "Something went wrong",
        responseCode: "001",
      });
  } else {
    if (
      Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")
    ) {
      res.redirect(
        `${req.body.pageAddress}?status="success"&transactionId=${corporateTxnId}`
      );
    } else {
      return res.status(200).json({
        status: true,
        data: {
          ...{},
          ...transactionResponse,
          corporateTxnId,
        },
        message: "Payment successfull",
        responseCode: "000",
      });
    }
  }
});

exports.fetchCountries = asyncHandler(async (req, res) => {
  const countryData = [
    { value: "IN", label: "India" },
    { value: "US", label: "USA" },
    { value: "AE", label: "UAE" },
    { value: "GB", label: "UK" },
    { value: "CA", label: "Canada" },
    { value: "AU", label: "Australia" },
    { value: "CN", label: "China" },
    { value: "PH", label: "Philippines" },
    { value: "ZA", label: "South Africa" },
    { value: "NG", label: "Nigeria" },
    { value: "SG", label: "Singapore" },
    { value: "CH", label: "Switzerland" },
    { value: "BH", label: "Bahrain" },
    { value: "FR", label: "France" },
    { value: "EG", label: "Egypt" },
    { value: "NP", label: "Nepal" },
    { value: "LB", label: "Lebanon" },
    { value: "TR", label: "Turkey" },
    { value: "PK", label: "Pakistan" },
  ];

  const query = req.query.searchText;
  if (query) {
    const filteredCountries = countryData.filter((country) =>
      country.label.toLowerCase().includes(query.toLowerCase())
    );
    res.send({
      status: true,
      data: { data: filteredCountries },
      message: "Countries fetched successfully",
      responseCode: "000",
    });
  } else {
    res.send({
      status: true,
      data: { data: countryData },
      message: "Countries fetched successfully",
      responseCode: "000",
    });
  }
});

exports.fetchCategoryType = asyncHandler(async (req, res) => {
  let { countryCode } = req.query
  if (!countryCode) {
    res.status(400).json({
      status: false,
      data: {},
      message: "Country not specified",
      responseCode: "001",
    });
  }
  let category = attestationCategoryType[countryCode]
  res.send({
    status: true,
    data: { data: category },
    message: "Categories fetched successfully",
    responseCode: "000",
  });
});

exports.getStatusOfLastFiveTransactions = asyncHandler(
  async (req, res, next) => {
    const userId = req.user.id;
    const length = parseInt(req.query.length);
    const serviceProvider = req.query.serviceProvider;
    const status = "Payment Successful";
    const orderCol = "transactionDate";
    const order = "DESC";
    let params = {
      userId,
      length,
      serviceProvider,
      status,
      orderCol,
      order,
    };
    const transactionsData = await findLastFiveTransactions(params);

    const idArray = transactionsData.map((item) => ({
      id: JSON.parse(item.orderResponse).attestationDetails.id,
    }));
    const attestationData = await attestation.findAll({
      attributes: ["status", "id"],
      where: {
        id: idArray.map((item) => item.id),
      },
    });
    const statusArray = attestationData.map((instance) => instance.get());
    if (!statusArray) {
      return next(
        new ErrorResponse(
          `Something went wrong while getting last transactions`,
          200
        )
      );
    } else {
      return res.status(200).json({
        success: true,
        recordsTotal: statusArray ? statusArray.length : 0,
        data: statusArray,
      });
    }
  }
);

exports.findAllAttestationsAndCount = asyncHandler(async (req, res, next) => {
  try {

    let { searchText, page, itemsPerPage,from, to } = req.query;
    let corporateId = req.user.id

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let column = 'createdAt'
    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }

    let params = {
      limit,
      offset,
      searchText,
      sort,
      column,
      corporateId,
      from,
      to
    }

    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      params.subCorporateUserId = req.user.subCorporateId;
    }
    const data = await findAllAttestationCount(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while getting all invoices from database`, 400))
    } else {
      return res.status(200).json({
        'status': true,
        'data': {
          'data': data ? data.rows : 0,
          'recordsTotal': data ? data.count : 0,
        },
        'message': 'All attestations fetched successfully',
        'responseCode': '000'
      })
    }
  } catch (error) {
    next(new ErrorResponse(error.message, 500));
  }
})

exports.findOneAttestationDetails = asyncHandler(async (req, res, next) => {
  try {

    let params = req.params
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      corporateUserId
    });

    
    const data = await attestationSingleDetails(params);
    if(serviceDetails && serviceDetails.vendor) {
      data.executiveDetails = {
        name: serviceDetails.vendor.optional1, 
        mobileNumber: serviceDetails.vendor.optional2, 
        email: serviceDetails.vendor.vendorEmail
      }
    }
    if (!data) {
      return next(new ErrorResponse(`No Order ID found, please try another Order ID`, 400))
    } else {
      return res.status(200).json({
        'status': true,
        'data': data,
        'message': 'Attestations fetched successfully',
        'responseCode': '000'
      })
    }
  } catch (error) {
    next(new ErrorResponse("Something went wrong ", 500));
  }
})

exports.checkPrice = asyncHandler(async (req, res) => {

  let { documentType, countryCode } = req.body
  if (!documentType || !countryCode) {
    return res.status(400).json({
      status: false,
      message: "Document type or country not specified",
      data: {},
      responseCode: "001",
    });
  }
  const category = attestationCategoryType[countryCode].find(item => item.value == documentType);
  let price = 0;
  let actualPrice = 0;
  if (category) {
    price = category.price
    actualPrice = category.price
  }
  return res.status(200).json({
    status: true,
    message: "Price calculated successfully",
    data: { price, actualPrice },
    responseCode: "000",
  });
});


const attestationCategoryType = {
  IN: [{ value: "Marriage Certificate", label: "Marriage Certificate", price: 450 }, { value: "Birth Certificate", label: "Birth Certificate", price: 450 }, { value: "Bachelor/Masters Certificate", label: "Bachelor/Masters Certificate", price: 550 }],
  US: [{ value: "Marriage Certificate", label: "Marriage Certificate", price: 1000 }, { value: "Birth Certificate", label: "Birth Certificate", price: 1000 },],
  GB: [{ value: "Marriage Certificate-Normal", label: "Marriage Certificate-Normal", price: 1000 }, { value: "Birth Certificate-Normal", label: "Birth Certificate-Normal", price: 1000 }, { value: "Marriage Certificate-Express", label: "Marriage Certificate-Express", price: 1400 }, { value: "Birth Certificate-Express", label: "Birth Certificate-Express", price: 1400 },],
  CA: [{ value: "Marriage Certificate", label: "Marriage Certificate", price: 1999 }, { value: "Birth Certificate", label: "Birth Certificate", price: 1999 },],
  AU: [{ value: "Marriage Certificate", label: "Marriage Certificate", price: 2000 }, { value: "Birth Certificate", label: "Birth Certificate", price: 2000 },],
  CN: [{ value: "Marriage Certificate", label: "Marriage Certificate", price: 2300 }, { value: "Birth Certificate", label: "Birth Certificate", price: 2300 },],
  PH: [{ value: "Marriage Certificate", label: "Marriage Certificate", price: 1500 }, { value: "Birth Certificate", label: "Birth Certificate", price: 1500 }, { value: "Bachelor/Masters Certificate", label: "Bachelor/Masters Certificate", price: 2000 }],
  ZA: [{ value: "Marriage Certificate", label: "Marriage Certificate", price: 1900 }, { value: "Birth Certificate", label: "Birth Certificate", price: 1900 },],
  NG: [{ value: "Marriage Certificate", label: "Marriage Certificate", price: 1850 }, { value: "Birth Certificate", label: "Birth Certificate", price: 1850 },],
  SG: [{ value: "Marriage Certificate", label: "Marriage Certificate", price: 1900 }, { value: "Birth Certificate", label: "Birth Certificate", price: 1900 },],
  CH: [{ value: "Marriage Certificate", label: "Marriage Certificate", price: 1800 }, { value: "Birth Certificate", label: "Birth Certificate", price: 1800 },],
  BH: [{ value: "Marriage Certificate", label: "Marriage Certificate", price: 1300 }, { value: "Birth Certificate", label: "Birth Certificate", price: 1300 },],
  FR: [{ value: "Bachelor/Masters Certificate - Public University", label: "Bachelor/Masters Certificate - Public University", price: 1800 }],
  EG: [{ value: "Bachelor/Masters Certificate", label: "Bachelor/Masters Certificate", price: 1400 }],
  NP: [{ value: "Bachelor/Masters Certificate", label: "Bachelor/Masters Certificate", price: 1400 }],
  LB: [{ value: "Bachelor/Masters Certificate", label: "Bachelor/Masters Certificate", price: 1450 }],
  TR: [{ value: "Bachelor/Masters Certificate", label: "Bachelor/Masters Certificate", price: 1700 }],
  PK: [{ value: "Marriage Certificate", label: "Marriage Certificate", price: 1050 }, { value: "Birth Certificate", label: "Birth Certificate", price: 1050 },],
  AE: [{ value: "MOA", label: "MOA", price: 2300 },{ value: "Articles of Association", label: "Articles of Association", price: 2300 },{ value: "Lease Agreement", label: "Lease Agreement", price: 2300 },{ value: "Power of Attorney", label: "Power of Attorney", price: 2300 },{ value: "NDA", label: "NDA", price: 2300 },{ value: "Board Resolution", label: "Board Resolution", price: 2300 },]
};
