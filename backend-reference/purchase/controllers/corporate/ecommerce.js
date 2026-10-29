/* eslint-disable no-prototype-builtins */
const {
  findAllProduct,
  fetchAllPhotos,
  findProductsByIds,
  fetchProductsWithCategoryId,
  findOne
} = require("../../models/use-cases/products");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const emailTemplates = require('../../utils/emailTemplates');
const {
  fetchServiceDetails,
} = require("../../utils/checkAndFetchServiceDetails");
const { createNotification } = require("../../models/use-cases/notification");
const {
  createRazorPayTransaction,
} = require("../../utils/dapiTransaction");
const { createOtp, verifyOtp } = require('../../models/use-cases/otp');
const {
  createWalletTransaction,
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const { createPGTransaction, createPaytmTransaction } = require("../../utils/pamentGatewayTransaction");
const wallet = require("../../models/entities/wallet");
const { deleteCartAndUpdateProducts } = require("../../models/use-cases/cart");

const emailer = require("../../utils/emailer");
const fs = require("fs");
const { spawn } = require("child_process");
const {
  updateOrder,
  findPopularProduct,
  findOneOrderById,
  findOneOrderByTxnId,
} = require("../../models/use-cases/order");
const {
  generateOrderInvoiceAttachments,
} = require("../../services/invoiceAndReceipt");
const { refundGatewayTransaction } = require("./pluralGateway");
const { queryStringIntoBase64 } = require("../../utils/encryptionUtils");
const operatorsData = require("../../utils/operatorsData.json");
const { findAllTransactions } = require("../../models/use-cases/transaction");
const { ecommerceInvoicePDFTemplate } = require("../../utils/templatesForEmails");
const { generatePaymentSuccessEmail, commonFailedTemplate, orderCancelConfirmationTemplet, emailOrderReturnIntiated } = require("../../utils/emailTemplate/ecommerce");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");
const { customLog } = require("../../utils/loggerHelper");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const { formatNumberWithLocalString } = require("../../utils/formatter");
let accessKey = operatorsData["e-commerce"]["accessKey"];
let transactionCategory = operatorsData["e-commerce"]["category"];

exports.findAllProductAndCount = asyncHandler(async (req, res, next) => {
  let categories =
    req.query.catIds && req.query.catIds != ""
      ? req.query.catIds.split(",")
      : [];
  let searchText = req.query.searchText;
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 8;
  const sortMethod = req.query.sortBy || "name";
  const popular =
    sortMethod == "popular" ? await findPopularProduct(accessKey) : null;
  const productsData = await findAllProduct({
    categories,
    searchText,
    offset,
    limit,
    popular,
    sortMethod,
  });
  if (!productsData) {
    return next(
      new ErrorResponse(`Something went wrong while fetching products`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: 'Successfully retrieved product data',
      data: productsData,
      responseCode: '000'
    });
  }
});

exports.fetchAllPhotos = asyncHandler(async (req, res, next) => {
  let { productId, categoryId } = req.query;
  let result = await fetchAllPhotos(productId);
  let details = {
    categoryId,
    limit: 6,
  };
  let products = await fetchProductsWithCategoryId(details);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while fetching photos`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      message: 'All photos are fetched successfully',
      data: result,
      products: products,
      responseCode: '000'
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
  const transactionId = req.body.transactionId;
  let providerId = transactionId;
  const account = req.body.account;
  const amount = req.body.amount;
  const payCashback = req.body.payCashback;
  // const cartId = req.body.cartId
  const credentialId = req.user.id; //will come from userObject
  // const corporateUserId = req.user.id; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const name = req.user.name;
  const emailId = req.user.email;
  const corporateUserId = req.user.corporateId 
 
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId
  });
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
  }
  // let token = serviceDetails.vendor.optional1
  // let URL = serviceDetails.vendor.apiUrl
  let commissionType = serviceDetails.commissionType;
  let cashbackType = serviceDetails.cashbackType;
  let providerCommission = serviceDetails.providerCommission;
  let corporateCashback = serviceDetails.cashback;
  let serviceOperatorId = serviceDetails.id;
  let surcharge = serviceDetails.surcharge;

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
    orderAmount: amount,
    commissionType,
    cashbackType,
    providerCommission,
    payCashback,
    surcharge
  };
  if (req.body.hasOwnProperty('')) {
    transactionResponse = await createRazorPayTransaction({
      ...commonParams,
      razorPayAmount: req.body.razorPayAmount,
      razorPayResponse: req.body.razorPay
    });
  } else if (req.body.hasOwnProperty('paymentGatewayResponse')) {
    transactionResponse = await createPGTransaction({
      ...commonParams,
      pgAmount: req.body.pgAmount,
      pgResponse: req.body.paymentGatewayResponse
    });
  } else if (req.body.hasOwnProperty('paytmResponse')) {
    transactionResponse = await createPaytmTransaction({
      ...commonParams,
      paytmAmount: req.body.paytmAmount,
      paytmResponse: req.body.paytmResponse
    });
  } else {
    transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount
    });
  }
  if (transactionResponse && transactionResponse.hasOwnProperty("error")) {
    return next(new ErrorResponse(transactionResponse["error"], 402));
  }
  let orderResponse = await deleteCartAndUpdateProducts(corporateUserId);
 
  let updateDetails = {};
  if (orderResponse && Array.isArray(orderResponse)) {
    updateDetails = {
      corporateTxnId,
      providerId: "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify({
        products: orderResponse,
        address: req.body.address,
      }),
    };
   
    if (updateDetails.message == "Payment Successful") {
      const orderResponse = JSON.parse(updateDetails.orderResponse);
      
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        products: JSON.stringify(orderResponse.products),
        address: req.body.address,
        transactionId: transactionId,
        account: account,
        amount: amount,
      };
      let templateDetails;
      templateDetails = await fetchPartnerDetails(req.user.registeredBy)
      const to = emailId; // Set recipient email address
    
      const subject = "Order Successful"; // Set email subject
      const orderSuccessAmount = Number(paymentDetails.amount);
      const orderSuccessItemCount = orderResponse.products?.length || 0;
      const orderSuccessSubtotal = orderSuccessAmount >= 100 ? orderSuccessAmount : orderSuccessAmount - 15;
      const orderSuccessShipping = orderSuccessAmount >= 100 ? 0 : 15;
      const resolvedOrderSuccess = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.ECOM_ORDER_SUCCESS,
        service: EMAIL_TEMPLATE_SERVICES.ECOM,
        variables: {
          name,
          transactionId: paymentDetails.transactionId,
          deliveryAddress: paymentDetails.address?.address || 'Not provided',
          phoneNumber: paymentDetails.address?.phoneNumber || 'Not provided',
          itemCount: orderSuccessItemCount,
          subtotal: formatNumberWithLocalString(orderSuccessSubtotal),
          shipping: formatNumberWithLocalString(orderSuccessShipping),
          orderTotal: formatNumberWithLocalString(orderSuccessAmount),
          ...v2LayoutVariables(templateDetails),
        },
        fallback: () => generatePaymentSuccessEmail(
          name,
          paymentDetails.transactionId,
          paymentDetails.amount,
          paymentDetails.address,
          paymentDetails.products,
          surcharge,
          templateDetails
        ),
        fallbackSubject: subject,
        logTraceId: req?.LogTraceId,
      });
      const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount: amount,
        surcharge: surcharge || 0,
        couponDiscount: transactionResponse?.couponDiscount || 0,
        corporateTxnId,
        orderId:
          transactionResponse?.orderId ||
          (await findOneOrderByTxnId(corporateTxnId))?.id,
        paymentType: "Office Supplies",
        credentialId,
        pgAmount: req.body.hasOwnProperty("paymentGatewayResponse")
          ? req.body.pgAmount
          : null,
        traceId: req?.LogTraceId,
      });
      // Call email function to send email with payment details in the body
      emailer.emailWithMultipleAttachment(
        to,
        resolvedOrderSuccess.subject,
        resolvedOrderSuccess.html,
        invoiceAttachments,
        undefined,
        function () {
          customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })

        }
      );
      // Send push notification with payment details
      const notificationData = {
        notificationTitle: "Office Supplies - Payment successful",
        notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Office Supplies with transaction ID ${paymentDetails.transactionId} was Successful`,
        notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
        notificationCategory: "CORPORATE", // Replace with the relevant category
        notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
      };
      createNotification(notificationData);
    }
    await updateWalletTransaction(updateDetails);
  } else {
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: "Product not Available",
      registeredById: req.user.registeredBy,
    };
    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
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
  }
  if (updateDetails.message !== "Payment Successful") {
    const paymentDetails = {
      transactionId: transactionId,
      account: account,
      amount: amount,
    };
    let templateDetails;
    templateDetails = await fetchPartnerDetails(req.user.registeredBy)
    const serviceUrl = templateDetails?.baseUrl;
    const to = emailId; // Set recipient email address
    const subject = "Transaction Failed"; // Set email subject
    const resolvedPaymentFailed = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.ECOM_PAYMENT_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.ECOM,
      variables: {
        name,
        serviceName: 'Office supplies',
        retryUrl: serviceUrl || `${templateDetails?.baseUrl}/payments`,
        ...v2LayoutVariables(templateDetails),
      },
      fallback: () => commonFailedTemplate(name, 'Office supplies', serviceUrl, templateDetails),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedPaymentFailed.html;
    emailer.email(to, resolvedPaymentFailed.subject, body, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    const notificationData = {
      notificationTitle: "Office Supplies - Payment unsuccessful",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Office Supplies was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
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
      return res.status(402).json({
        status: false,
        data: {
          ...{},
          corporateFinalBalance: walletDetails["balance"],
        },
        message: 'Payment failed. Please check your payment information and try again.',
        responseCode: '001',
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
        message: 'Payment completed successfully. Thank you!',
        data: {
          ...{},
          ...transactionResponse,
          corporateTxnId
        },
        responseCode: '000'
      });
  }
});

exports.getTransactions = asyncHandler(async (req, res, next) => {
  let result = [];
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while fetching photos`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: "Fetched last transactions successfully",
      responseCode: '000'
    });
  }
});

exports.fetchProductsById = asyncHandler(async (req, res, next) => {
  let productCodes = req.body.productsId;
  let attributes = ["productImage", "id", "brand"];
  let result = await findProductsByIds(productCodes, attributes);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while fetching products`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: "Fetched product successfully",
      responseCode: '000'
    });
  }
});

exports.cancelOrder = asyncHandler(async (req, res, next) => {
  
  let orderId = req.query.orderId;
  let { reason, description,scope,otp } = req.body;
  let response
  if (scope === 'email') {
      response = await verifyOtp({ contact: req.user.email, otp: otp, context: 'email' })
      if (response.isVerified === false) {
        return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: '001' });
      }
      
    }else {
      return next(new ErrorResponse('OTP verification failed due to invalid scope or an unexpected error.', 400))
  }
  let name = req.user.name;
  let emailId = req.user.email;
  const id = {
    id: orderId,
  };
  let orderData = await findOneOrderById(orderId, req.user.id);
  if (!orderData) {
    return next(new ErrorResponse("Order not found", 404));
  }

  let orderResponse = JSON.parse(orderData.dataValues.orderResponse);
  orderResponse.cancelReason = reason;
  orderResponse.cancelDescription = description;
  orderResponse.cancelRequestDate = new Date();

  let updatedOrderResponse = JSON.stringify(orderResponse);

  let data = {
    orderResponse: updatedOrderResponse,
    workspaceOrderStatus: "Cancel Requested",
  };
  let result = await updateOrder(id, data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while requesting`, 500)
    );
  } else {
    const inputDate = new Date(orderData.createdAt);
    const options = {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    };

    const formatter = new Intl.DateTimeFormat("en-US", options);
    const formattedDate = formatter.format(inputDate);

    let corporateTxnId = orderData.corporateTxnId;
    let templateDetails;
    templateDetails = await fetchPartnerDetails(req.user.registeredBy)
    // const host = NODE_ENV === "staging" ? STAGING_URL : PRODUCTION_URL;
    // const url = `${host}/office-supplies/order-history`
    const to = emailId; // Set recipient email address
    const subject = "Order Cancellation Request Confirmation"; // Set email subject
    const resolvedCancelConfirmation = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.ECOM_ORDER_CANCEL_CONFIRMATION,
      service: EMAIL_TEMPLATE_SERVICES.ECOM,
      variables: {
        name,
        orderId: corporateTxnId,
        date: formattedDate,
        ...v2LayoutVariables(templateDetails),
      },
      fallback: () => orderCancelConfirmationTemplet(name, corporateTxnId, formattedDate, templateDetails),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedCancelConfirmation.html;
    // Call email function to send email with payment details in the body
    emailer.email(to, resolvedCancelConfirmation.subject, body, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    return res.status(200).json({
      status: true,
      data: result,
      message: "cancelled order successfully",
      responseCode: '000'
    });
  }
});

exports.getOtpCancel = asyncHandler(async (req, res) => {
  let { scope } = req.query;
  let otp;
  let message = "OTP sent successfully via email.";
  let templateDetails;
  templateDetails = await fetchPartnerDetails(req.user.registeredBy)
     if (scope == "email") {
    //it will create a bycrypted otp in db and return the created otp to send via email
    otp = await createOtp({ contact: req.user.email });
    if (!otp) {
      return res.status(500).json({ status: false, message: "Failed to create OTP.", responseCode: '001', data: {} });
    }
    //Sending Email with otp
    const resolvedCancelOtp = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.ECOM_CANCEL_OTP,
      service: EMAIL_TEMPLATE_SERVICES.ECOM,
      variables: { name: req.user.name, otp, message, branding: templateDetails?.branding || 'Peko' },
      fallback: () => emailTemplates.emailCancelOTPTemaplte(req.user.name, otp, message, templateDetails),
      fallbackSubject: "Office Supplies cancellation Request",
      logTraceId: req?.LogTraceId,
    });
  await emailer.email(req.user.email, resolvedCancelOtp.subject, resolvedCancelOtp.html);
    console.log("-------------------------");
    console.log("-------------------------");
    console.log("EMAIL: cancel OTP sent", "------");
    console.log("-------------------------");
    console.log("-------------------------");
  }
  //ADD OTP RESPONSE
  return res.status(200).json({
    status: true,
    message: "OTP sent successfully via email.",
    data: process.env.NODE_ENV !== "production" ? { otp } : {},
    responseCode: '000'
  });
});

exports.downloadOrderInvoice = asyncHandler(async (req, res) => {
  try {
      const id = req.params.id
      if(!id){
          return res.status(400).json({
              'status': false,
              message: "Order id not provided",
              data: {},
              responseCode: '001'
          })
      }
      const details= await findOneOrderById(id, req.user.id)
      if(!details){
          return res.status(400).json({
              'status': false,
              message: "Order not found",
              data: {},
              responseCode: '001'
          })
      }
       let data = {
          orderResponseData:details.orderResponse,
          orderId:details.id,
          orderDate:details.transactionDate,
          surcharge: details.surcharge,
          total: details.amountInINR
       }
      generatePDF(data, (err, pdfData) => {
          if (err) {
              console.error(err);
              return res.status(500).json({
                  'status': false,
                  message: "Error generating PDF",
                  data: {},
                  responseCode: '001'
              })
          } else {
              // Handle the returned PDF file
              return res.status(200).json({
                  'status': true,
                  data: { data: pdfData },
                  message: 'Invoice downloaded successfully',
                  responseCode: '000'
              })
          }
      });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { error })

      res.status(500).json({
          status: false,
          message: "Something went wrong",
          data: {},
          responseCode: '001'
      });
  }
})

async function generatePDF(data, callback) {
  const id = data.orderId;
  const html = ecommerceInvoicePDFTemplate(data);

  fs.writeFile(`${id}.html`, html, (err) => {
    if (err) {
      console.error(err);
      callback(err, null);
    } else {
      const inputFile = `${id}.html`;
      const outputFile = `${id}.pdf`;
      const wkhtmltopdfArgs = [
        "--no-stop-slow-scripts",
        "--page-size",
        "A4",
        inputFile,
        outputFile,
      ];
      const wkhtmltopdf = spawn("wkhtmltopdf", wkhtmltopdfArgs);
      wkhtmltopdf.on("error", (err) => {
        console.error(err);
        callback(err, null);
      });
      wkhtmltopdf.on("exit", (code, signal) => {
        if (code !== 0) {
          console.error(
            `wkhtmltopdf exited with code ${code} and signal ${signal}`
          );
          callback(
            new Error(
              `wkhtmltopdf exited with code ${code} and signal ${signal}`
            ),
            null
          );
        } else {
          console.log(`PDF file written to ${outputFile}`);
          // Read the PDF data
          fs.readFile(outputFile, (readErr, pdfData) => {
            if (readErr) {
              console.error(`Error reading file ${outputFile}: ${readErr}`);
              callback(readErr, null);
            } else {
              // Delete the temporary HTML and PDF files
              const filesToDelete = [inputFile, outputFile];
              filesToDelete.forEach((file) => {
                fs.unlink(file, (unlinkErr) => {
                  if (unlinkErr) {
                    console.error(`Error deleting file ${file}: ${unlinkErr}`);
                   
                  } else {
                    console.log(`File ${file} deleted`);
                  }
                });
              });
              callback(null, pdfData);
            }
          });
        }
      });
    }
  });
}

exports.returnOrder = asyncHandler(async (req, res, next) => {
  let orderId = req.query.orderId;
  let { productId, reason, description } = req.body;
  let emailId = req.user.email
  let name = req.user.name
  const id = {
    id: orderId,
  };
  let returnRequest = {
    productId,
    reason,
    description,
    requestDate: new Date(),
  };
  let orderData = await findOneOrderById(orderId, req.user.id);
  if (!orderData) {
    return next(new ErrorResponse("Order not found", 404));
  }
  let orderResponse = JSON.parse(orderData.orderResponse);
  orderResponse.returnRequest = [returnRequest];
  let targetProduct = orderResponse.products.find(
    (product) => product.productId == productId
  );
  if (targetProduct) {
    targetProduct.status = "Return Requested";
    targetProduct.reason = reason;
    targetProduct.description = description;
  }
  let updatedOrderResponse = JSON.stringify(orderResponse);

  let data = {
    orderResponse: updatedOrderResponse,
    workspaceOrderStatus: "Return Requested",
  };
  let result = await updateOrder(id, data);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while requesting`, 500)
    );
  } else {
    const inputDate = new Date(orderData.createdAt);
        const options = {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true,
        };

        const formatter = new Intl.DateTimeFormat('en-US', options);
        const formattedDate = formatter.format(inputDate);

        let corporateTxnId = orderData.corporateTxnId
        let templateDetails;
        req.user.registeredBy ?
             templateDetails = await fetchPartnerDetails(req.user.registeredBy)
              :
              templateDetails = await partnerLogos()
        const to = emailId; // Set recipient email address
        const subject = 'Order return request received'
        const resolvedReturnInitiatedNotice = await resolveEmailTemplate({
          key: EMAIL_TEMPLATE_KEYS.ECOM_RETURN_INITIATED_NOTICE,
          service: EMAIL_TEMPLATE_SERVICES.ECOM,
          variables: {
            name,
            orderId: corporateTxnId,
            date: formattedDate,
            ...v2LayoutVariables(templateDetails),
          },
          fallback: () => emailOrderReturnIntiated(name, corporateTxnId, formattedDate, templateDetails),
          fallbackSubject: subject,
          logTraceId: req?.LogTraceId,
        });
        let body = resolvedReturnInitiatedNotice.html;
        emailer.email(to, resolvedReturnInitiatedNotice.subject, body, function () {
          customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
        });
    return res.status(200).json({
      status: true,
      data: result,
      message : "returned order successfully",
      responseCode: '000'
    });
  }
});

exports.fetchProductDetails = asyncHandler(async (req, res, next) => {
  let { productId } = req.query
  const limit = parseInt(req.query.limit) || 4
  const page = parseInt(req.query.page) || 1
  let productDetails = await findOne({ productCode: productId })
  if(!productDetails || productDetails == null ){
      return next(new ErrorResponse(`Product not found`, 404))
  }
  let photos = await fetchAllPhotos(productId)
  let details = {
      categoryId: productDetails.categoryId,
      limit,
      page
  }
  let products = await fetchProductsWithCategoryId(details)
  if (!photos) {
      return next(new ErrorResponse(`Something went wrong while fetching photos`, 500))
  } else {
      return res.status(200).json({
          status: true,
          message: 'Fetched All Photos successfully',
          responseCode: '000',
          data: {
              productDetails: productDetails,
              photos: photos,
              relatedProducts: {
                  page,
                  limit,
                  count: products.count,
                  products: products.rows
              }
          }
      })
  }
})

exports.fetchOrderDetails = asyncHandler(async (req, res, next) => {
  try {
      let id = req.params.id;
      let result = await findOneOrderById(id, req.user.id);
  
      if (!result) {
        return next(new ErrorResponse(`Something went wrong while requesting`, 500));
      } else {
        // Parse the orderResponse string into a JSON object if it's a string
        const orderResponse = JSON.parse(result.orderResponse)
          
  
        // Check if orderResponse.products is defined
        if (orderResponse && orderResponse.products) {
          const productIds = orderResponse.products.map(product => product.productId);
  
          // Fetching product details for each productId
          const productDetailsPromises = productIds.map(productId => findOne({ productCode: productId }));
          const productsDetails = await Promise.all(productDetailsPromises);
  
          // Adding product details to the orderResponse
          orderResponse.products.forEach((product) => {
              const productDetail = productsDetails.find(detail => detail.id == product.productId);
            if (productDetail) {
              product.image = productDetail.productImage; 
            }
          });
          result.orderResponse= orderResponse
        }
        return res.status(200).json({
          'status': true,
          'data':  result ,
          'message': 'Order details fetched successfully',
          'responseCode': '000'
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        'status': false,
        'message': 'Internal Server Error',
        'responseCode': '500'
      });
    }
})

exports.findAllTransactionsAndCount = asyncHandler(async (req, res, next) => {   

  let { from, to, searchText, page, itemsPerPage } = req.query;
  let corporateId = req.user.id

  const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
  const filter = req.query.filter || undefined ;

  // Parse page and itemsPerPage to integers (you can also use parseInt)
   page = page ? parseInt(page) : 1;
   itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
   let limit = itemsPerPage 

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  let categoryName = 'Office Supplies'
  let sortField = 'transactionDate'

  let serviceAttribute = []
  let credentialAttribute = []
  let transactionAttribute = []
  let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', 'ecomOrderStatus', "transactionDate", 'corporateTxnId']

  let params ={
      from, 
      to, 
      categoryName, 
      searchText,
      sort,
      filter,
      limit,
      offset,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField

  }
  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
    params.subCorporateUserId = req.user.subCorporateId;
}

  const transactionsData = await findAllTransactions(params);
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': {
              result:transactionsData.rows,
          totalData:transactionsData.count
          },
          'message': 'fetched transactions successfully!!',
          'responseCode': '000'
      })
  }
})