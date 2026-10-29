const axios = require('axios')
const { Op } = require('sequelize')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { fetchServiceDetails } = require('../../utils/checkAndFetchServiceDetails');
const { customLog } = require('../../utils/loggerHelper');
const { createPaymentLink, findOne, update, findAllPaymentLinks, totalStatistics, updateKyb, } = require('../../models/use-cases/paymentLink');
const { findOneInvoiceSupplier, findCorporateUserWithDetails } = require('../../models/use-cases/invoiceSupplier')
const operatorsData = require("../../utils/operatorsData.json");
const accessKey = operatorsData["paymentlink"]["accessKey"];
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser')
const { resolvePaymentLinkCreatedEmail, resolvePaymentLinkPaidEmail } = require('../../utils/emailTemplates/invoice');
const sms = require("../../utils/sms");
const emailer = require('../../utils/emailer')
const { updateInvoice } = require('../../models/use-cases/invoices')
const { findOneCredential } = require("../../models/use-cases/credential");
const { formatNumberWithLocalString, formattedDateOnly } = require("../../utils/formatter");
const { createNotification } = require("../../models/use-cases/notification");
const { sendCollectorAgreement } = require('../../services/collectorEsign')


exports.getAgreementDetails = asyncHandler(async (req, res, next) => {

  try {
    const credentialId = req.user.id
    const corporateUserId = req.user.corporateId
    const supplierDetails = await findOneInvoiceSupplier({ corporateUserId })

    const isSignLimitReached = supplierDetails?.agreementDetails?.count
      ? parseInt(supplierDetails.agreementDetails.count) >= 1
      : false;

      const isFirstStepCompleted = supplierDetails?.kybStatus === 'IN PROGRESS'
      const businessType = supplierDetails?.businessType

      const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        corporateUserId,
      });
  
      if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
        return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
      }

      const individual_url = serviceDetails.vendor.optional5
      const company_url = serviceDetails.vendor.optional6
      const url = businessType === 'INDIVIDUAL' ? individual_url :  company_url 

      

    return res.status(200).json({
      status: true,
      message: "Signer details fetched successfully.",
      responseCode: '000',
      data: {
        signerEmail: supplierDetails?.agreementDetails?.signer_email || req.user.email,
        signerName: supplierDetails?.agreementDetails?.signer_name || req.user.name,
        sampleAgreement: 'https://peko-storage.s3.me-central-1.amazonaws.com/staging/common/collector-agreement/Decfin_MSA-Payment_Aggregator_Sub-Merchant.pdf',
        isSignLimitReached: isSignLimitReached,
        isSupplierExist:supplierDetails?true:false,
        designation:supplierDetails?.agreementDetails?.designation,
        city:supplierDetails?.agreementDetails?.city,
        address:supplierDetails?.agreementDetails?.address,
        isFirstStepCompleted,
        url

      }
    })
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return next(new ErrorResponse('Something went wrong while getting signer details.', 400))
  }
})

exports.sendPaymentLinkAgreement = asyncHandler(async (req, res, next) => {
  let { email, signerName = req.user.name ,designation,address,city} = req.body;
   const corporateUserId = req.user.corporateId;

  try {
    // Get the user details using the corporateUserId
    const userDetails = await findCorporateUserWithDetails({ corporateUserId });
    userDetails.corporateUserId=corporateUserId;
    

    if (!userDetails) {
      return next(new ErrorResponse('Something went wrong while fetching user details.', 400));
    }

    const isSuccess = await sendCollectorAgreement({ ...userDetails, email, signerName, companyName: req.user.name,designation,address,city })

    if (!isSuccess) {
      return next(new ErrorResponse('Something went wrong while sending agreement.', 400))
    }

    let partnerDetails;
    if (req?.user?.registeredBy) {
      partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
    } else {
      // eslint-disable-next-line no-unused-vars
      partnerDetails = await fetchPartnerDetails();
    }

    // const corporateEmail = req.user.email;
    // const corporateSubject = "Your KYB submission for payment links activation has been received"
    // const corporateEmailContent = kybSubmissionComplete(req.user.name, partnerDetails)
    // emailer.email(corporateEmail, corporateSubject, corporateEmailContent)

    return res.status(200).json({
      status: true,
      message: "E-sign agreement sent successfully.",
      responseCode: '000',
      data: {}
    })

  } catch (error) {
    console.error("Error in sending agreement:", error);
    return next(new ErrorResponse('Something went wrong while sending agreement.', 400));
  }
});

exports.createPaymentLinkUrl = asyncHandler(async (req, res, next) => {
  try {

    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    
    const corporateName = req.user.name

   
    // Generate a random number between 1000 and 9999
    const random_number = new Date().valueOf();

    // Combine prefix, timestamp, and random number to create the reference_id
    const reference_id = `${random_number}`;

    const amount = Number(req.body.amount);

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      corporateUserId,
    });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
    }

    const apiUrl = serviceDetails.vendor.apiUrl;
    const consumer_urn = serviceDetails.vendor.optional1
    const client_id = serviceDetails.vendor.optional2;
    const client_secret = serviceDetails.vendor.optional3;

    const { notification, email: customerEmail, phone_number: customerMobile, invoiceId, purpose_message, expires_at } = req.body

    const formData =
    {
      reference_id,
      consumer_urn,
      amount,
      purpose_message,
      generate_psp_uri: false,
      expiry_time: Number(expires_at)
    }

    const config = {
      method: "POST",
      url: `${apiUrl}/v3/payments/upi/link`,
      headers: {
        client_id,
        client_secret,
      },
      data: formData,
    };
    customLog(req?.LogTraceId, "info", {
      message: `payment link config`,
      data: { url: config?.url, method: config?.method }
    });
    const response = await axios(config);

    if (response?.data) {
      const result = response.data.data;

      const firstEntryKey = Object.keys(result.upi_uris)[0];
      const firstEntryValue = result.upi_uris[firstEntryKey];


      const orderDetails = await createPaymentLink({
        sentPayload: { ...req.body, amount: amount },
        paymentLink: firstEntryValue,
        status: result.transaction_status,
        decentro_txn_id: response.data.decentro_txn_id,
        credentialId: req.user.id,
        reference_id,
        amount,
        expireDate: formData.expiry_time,
        invoiceId
      });

      let partnerDetails;
      partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

      const subject = `Payment Link Generated by ${corporateName}, Reference ID ${reference_id}`;

      // const formatedExipireDate = moment(expiryDate).format("YYYY-MM-DD")

      const emailData = {
        amount: parseFloat(amount),
        link: firstEntryValue,
        corporateName,
        invoiceId: reference_id,
        expiryDate: formData.expiry_time

      }

      const expiretime = Math.floor(formData.expiry_time / 60)

      // resolved once; the same email goes out in both the ALL and EML branches
      const { subject: emailSubject, html: body } = await resolvePaymentLinkCreatedEmail(emailData, partnerDetails, {
        fallbackSubject: subject, partnerId: req?.user?.registeredBy || null, logTraceId: req?.LogTraceId,
      });
      if (notification == 'ALL') {
        emailer.sendEmailForPaymentLink(customerEmail, emailSubject, body, corporateName, function () { })
        sms.sendSMS(`+91${customerMobile}`,
          `A payment of ₹ ${parseFloat(amount)} has been generated by ${corporateName}. Your Reference ID is ${reference_id}. Please note that this payment request will expire in ${expiretime} hours. To complete the payment, please click the link below: Payment Link: ${firstEntryValue} `)
      } else if (notification == 'EML') {
        emailer.sendEmailForPaymentLink(customerEmail, emailSubject, body, corporateName, function () { })
      } else if (notification == 'SMS') {
        sms.sendSMS(`+91${customerMobile}`,
          `A payment of ₹ ${parseFloat(amount)} has been generated by ${corporateName}. Your Reference ID is ${reference_id}. Please note that this payment request will expire in ${expiretime} hours. To complete the payment, please click the link below: Payment Link: ${firstEntryValue} `)
      }


      if (invoiceId) {
        await updateInvoice({ id: invoiceId, credentialId: req.user.id }, { paymentLink: firstEntryValue })
      }

      return res.status(200).json({
        status: true,
        data: {
          paymentLink: firstEntryValue, createdAt: orderDetails?.createdAt, orderId: orderDetails?.reference_id, customerName: orderDetails?.sentPayload?.full_name,
          expires_at: orderDetails?.sentPayload?.expires_at
        },
        message: "Payment link generated successfully",
        responseCode: "000",
      });
    } else {
      return next(new ErrorResponse("Something went wrong while generating payment link", 400));
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return next(new ErrorResponse("Something went wrong while generating payment link", 400));
  }
});

exports.createPaymentLinkQr = asyncHandler(async (req, res, next) => {
  try {

    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const prefix = "PAY";

    // Get the current timestamp in the format YYYYMMDDHHMMSS
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

    // Generate a random number between 1000 and 9999
    const random_number = Math.floor(1000 + Math.random() * 9000);

    // Combine prefix, timestamp, and random number to create the reference_id
    const reference_id = `${prefix}-${timestamp}-${random_number}`;

    const amount = req.body.amount;

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      corporateUserId,
    });


    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
    }

    const apiUrl = serviceDetails.vendor.apiUrl;
    const consumer_urn = serviceDetails.vendor.optional1
    const client_id = serviceDetails.vendor.optional2;
    const client_secret = serviceDetails.vendor.optional3;
    // req.body.is_live = isLive;

    const formData =
    {
      reference_id,
      consumer_urn,
      amount,
      purpose_message: req.body.purpose_message,
      generate_custom_qr_image: false,
      expiry_time: req.body.expiry

    }

    const config = {
      method: "POST",
      url: `${apiUrl}/v3/payments/upi/qr`,
      headers: {
        client_id,
        client_secret,
      },
      data: formData,
    };

    customLog(req?.LogTraceId, "info", {
      message: `payment link config`,
      data: { url: config?.url, method: config?.method }
    });

    const response = await axios(config);

    if (response.data) {

      return res.status(200).json({
        status: true,
        data: response.data,
        message: "Payment link generated successfully",
        responseCode: "000",
      });
    } else {
      return next(new ErrorResponse("Something went wrong while generating payment link", 400));
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return next(new ErrorResponse("Something went wrong while generating payment link", 400));
  }
});

exports.findAllPaymentLinksAndCount = asyncHandler(async (req, res, next) => {
  try {
    let { searchText, page, itemsPerPage } = req.query;

    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let sortField = req.query.sortField || "createdAt";

    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage;

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }
    const corporateId = req.user.id;

    let params = {
      limit,
      offset,
      searchText,
      sort,
      sortField,
      corporateId,
    };

    // await updateStatusIfExpired(req.user.id)
    const paymentLinksData = await findAllPaymentLinks(params);
    const statistics = await totalStatistics(req.user.id)
    if (!paymentLinksData) {
      return next(new ErrorResponse(`Something went wrong while fetching payment links from the database`, 400));
    } else {
      return res.status(200).json({
        status: true,
        data: {
          recordsTotal: paymentLinksData.count,
          data: paymentLinksData.rows,
          statistics
        },
        message: "Find all links successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return next(new ErrorResponse("Something went wrong while fetching payment links from the database", 400));
  }
});

exports.resendPaymentLink = asyncHandler(async (req, res, next) => {
  try {

    const paymentLinkId = req.params.id
    let orderDetails = await findOne({ id: paymentLinkId });

    // if (!orderDetails) {
    //     orderDetails = await findOne({ invoiceId: paymentLinkId });
    // }
    if (!orderDetails) {
      return next(new ErrorResponse('Invalid order details.', 403))
    }

    const { sentPayload: customerDetails, amount, paymentLink: paymentLinkUrl, reference_id, expiryDate } = orderDetails
    const { email } = customerDetails
    const companyName = req.user.name

    let partnerDetails;
    partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

    const emailData = {
      amount: parseFloat(amount),
      link: paymentLinkUrl,
      corporateName: companyName,
      invoiceId: reference_id,
      expiryDate
    }

    const fallbackSubject = `Payment Link Generated by ${companyName}, Reference ID ${reference_id}`;
    const { subject, html: body } = await resolvePaymentLinkCreatedEmail(emailData, partnerDetails, {
      fallbackSubject, partnerId: req?.user?.registeredBy || null, logTraceId: req?.LogTraceId,
    });
    const isSuccess = await emailer.sendEmailForPaymentLink(email, subject, body, companyName);

    if (!isSuccess) {
      return next(new ErrorResponse('Something went wrong while sending payment link.', 403))
    }
    return res.status(200).json({
      status: true,
      message: 'Email sent successfully',
      data: {},
      responseCode: '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: 'Something went wrong while sending payment link',
      data: {},
      responseCode: '001'
    });
  }
});

exports.paymentLinkCallback = asyncHandler(async (req, res, next) => {
  try {
    const body = req.body;
    customLog(req?.LogTraceId, "info", {
      message: `webhook data`,
      data: body
    });
    // Validate required fields
    const reference_id = body?.reference_id;
    if (!reference_id) {
      return next(new ErrorResponse("Reference ID is missing in the callback data", 400));
    }

    // Find order details using the reference ID
    const orderDetails = await findOne({ reference_id });
    if (!orderDetails) {
      return next(new ErrorResponse("Order not found", 404));
    }
    if (orderDetails.status == 'paid') {
      return next(new ErrorResponse("transaction already completed", 200));
    }

    // Initialize updates array if not present
    if (!Array.isArray(orderDetails.updates)) {
      orderDetails.updates = [];
    }

    // Push the callback data to updates
    orderDetails.updates.push(body);

    // Update the order status based on transaction status
    if (body.transaction_status === "SUCCESS") {
      orderDetails.status = "paid";
    } else if (body.transaction_status === "FAILURE") {
      orderDetails.status = "failed";
    } else if (body.transaction_status === "EXPIRED") {
      orderDetails.status = "expired";
    } else if (body.transaction_status === "DEEMED") {
      orderDetails.status = "deemed";
    }

    // F-OAB-23: claim the order atomically (UPDATE ... WHERE status != 'paid') so concurrent
    // or duplicate callbacks can't each settle the invoice or send a second email.
    const updateResult = await update(
      orderDetails.id,
      { status: orderDetails.status, updates: [...orderDetails.updates] },
      { status: { [Op.ne]: "paid" } }
    );
    if (!(Array.isArray(updateResult) && updateResult[0] > 0)) {
      return next(new ErrorResponse("transaction already completed", 200));
    }

    // F-OAB-23: only a successful payment settles the invoice; non-success leaves it PENDING.
    if (orderDetails.invoiceId && body.transaction_status === "SUCCESS") {
      await updateInvoice({ id: orderDetails.invoiceId }, { status: "PAID" })
    }

    // Log transaction status update
    customLog(req?.LogTraceId, "info", {
      message: `Order status updated to ${orderDetails.status}`,
      data: body
    });


    const userDetails = await findOneCredential({ id: orderDetails.credentialId });

    const notificationData = {
      notificationTitle: `${orderDetails?.sentPayload?.full_name || 'A customer'} paid ₹ ${formatNumberWithLocalString(orderDetails?.sentPayload?.amount)}`,
      notificationBrief: `${orderDetails?.sentPayload?.full_name || 'A customer'} ${body.transaction_status === 'SUCCESS' ? 'successfully paid' : 'failed to pay'} ₹ ${formatNumberWithLocalString(orderDetails?.sentPayload?.amount)} through the payment link.`,
      notificationTo: [userDetails.username], // Replace with the user ID or username to send the notification to
      notificationCategory: "CORPORATE", // Replace with the relevant category
      notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
    };
    createNotification(notificationData);
    const date = formattedDateOnly(new Date())

    let templateDetails = await fetchPartnerDetails(userDetails.registeredBy)
    const to = userDetails.email
    const formattedAmount = formatNumberWithLocalString(orderDetails?.sentPayload?.amount)
    const fallbackSubject = `Payment Received: ₹ ${formattedAmount} from ${userDetails.name}`;
    const { subject, html: emailbody, sender } = await resolvePaymentLinkPaidEmail({
      username: userDetails.name,
      amount: formattedAmount,
      date,
      referenceId: body.reference_id,
      customerName: orderDetails?.sentPayload?.full_name,
      customerMobile: orderDetails?.sentPayload?.phone_number,
      customerEmail: orderDetails?.sentPayload?.email,
    }, templateDetails, { fallbackSubject, partnerId: userDetails.registeredBy || null, logTraceId: req?.LogTraceId })
    emailer.email(to, subject, emailbody, () => {
      console.log("Mail sent to ", to)
    }, sender)

    // Respond with success to Decentro
    res.status(200).json({
      status: true,
      data: {},
      message: "Transaction status updated successfully",
      response_code: "CB_S00000"
    });
  } catch (error) {
    // Log the error and respond with failure
    customLog(req?.LogTraceId, "error", {
      message: error?.message,
      data: error?.response?.data
    });
    return next(new ErrorResponse("Something went wrong while updating transaction", 400));
  }
});

exports.completeKyb = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const data = req.body

    const {businessType} = data
    
    let corporateId = req.user.corporateId
   
    let result = await updateKyb(corporateId,businessType);

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      corporateUserId,
    });

    const individual_url = serviceDetails.vendor.optional5
    const company_url = serviceDetails.vendor.optional6
    const url = businessType === 'INDIVIDUAL' ? individual_url : company_url;

    if (!result) {
      return next(new ErrorResponse(`Something went wrong while updating step`, 200));
    } else {
      return res.status(200).json({
        status: true,
        message: "kyb updated successfully",
        data: {url},
        responseCode: '000'
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    next(new ErrorResponse("Something went wrong", 400));
  }
});

