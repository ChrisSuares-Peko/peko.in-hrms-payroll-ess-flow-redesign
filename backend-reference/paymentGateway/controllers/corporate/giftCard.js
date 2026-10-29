const asyncHandler = require("../../middlewares/async");
const { v4: uuidv4 } = require("uuid");
const { findSingleGiftCard, findServiceOperatorById } = require("../../models/use-cases/giftCards");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { fetchServiceDetails, calculateSurchargeWithTax, findServiceOperatorByAccessKey } = require("../../utils/checkAndFetchServiceDetails");
const { customLog } = require("../../utils/loggerHelper");
const { createPGTransaction } = require("../../utils/paymentGatewayTransaction");
const { createWalletTransaction, refundWalletTransaction, updateWalletTransaction } = require("../../utils/walletTransaction");
const emailTemplates = require("../../utils/emailTemplates");
const emailer = require("../../utils/emailer");
const { createNotification } = require("../../models/use-cases/notification");
const operatorsData = require("../../utils/operatorsData.json");
const axios = require("axios");
const fs = require("fs");
const puppeteer = require("puppeteer");
const ErrorResponse = require("../../utils/error-response");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { commonFailedTemplate } = require("../../utils/emailTemplates/common");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");

const accessKey = operatorsData["giftCard"]["accessKey"];

// 2 call sites in this file (employee-bulk and single-receiver) - resolveEmailTemplate
// needs one named helper per rule, not an inline call at each site. Reused key: this is
// the exact same admin-managed template already published for purchase MS's own
// GIFTCARD_RECEIVED (service GIFTCARD) - both microservices read the same shared row.
async function sendGiftCardReceivedEmail(to, receiverName, transactionId, amount, account, message, senderName, templateDetails, cardName, pdfResponse, logTraceId) {
  // Never an empty string: the resolver treats an empty placeholder value as "no value,
  // fall back" for the WHOLE template, and no personal message is the common case here,
  // not the exception - an HTML comment keeps the placeholder non-empty (so the
  // admin-published template can actually take effect) while rendering as nothing visible.
  const messageBlock = message
    ? `
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:16px;">Message from ${senderName?.trim()}:</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">${message}</div>`
    : '<!-- no personal message -->';

  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.GIFTCARD_RECEIVED,
    service: EMAIL_TEMPLATE_SERVICES.GIFTCARD,
    variables: {
      name: receiverName,
      senderName,
      messageBlock,
      branding: templateDetails?.branding || 'Peko',
      website: templateDetails?.baseUrl || 'https://peko.one/in',
      ...v2LayoutVariables(templateDetails),
    },
    fallback: () => emailTemplates.generateGiftCardPaymentSuccessEmail(receiverName, transactionId, amount, account, "Vouchers", "Gift/Cards", message, senderName, templateDetails, cardName),
    fallbackSubject: "Gift Card",
    logTraceId,
  });

  emailer.emailWithMultipleAttachment(to, resolved.subject, resolved.html, pdfResponse, null, async (emailErr) => {
    if (emailErr) {
      // On success emailer.js already deletes these files itself; only clean up here
      // when the send failed, since that path never reaches its own cleanup.
      if (Array.isArray(pdfResponse)) {
        for (const pdf of pdfResponse) {
          if (pdf.path) {
            try { fs.unlinkSync(pdf.path); } catch (_) { /* ignore cleanup errors */ }
          }
        }
      }
      customLog(logTraceId, "error", { message: "Error sending email", emailErr });
    } else {
      customLog(logTraceId, "info", { message: "Email sent to " + to });
    }
  });
}

exports.payment = asyncHandler(async (req, res, next) => {
  const { giftCardId, number_of_items: qty, amount, email: receiverEmail, first_name: receiverFirstName, message, senderName } = req.body;

  const subCorporateEmail = req.user.subCorporateEmail;
  const orderType = req.body.orderType;
  const employee = req.body.employee;
  const images = {
    background: `${req.protocol}://${req.get("host")}/assets/images/giftcards/stars.png`,
    onError: `${req.protocol}://${req.get("host")}/assets/images/giftcards/giftOnerror.png`,
  };

  customLog(req?.LogTraceId, "info", {
    message: "Gift card payment initiated",
    giftCardId, qty, amount, orderType,
    receiverEmail: receiverEmail || null,
    userId: req.user.id,
    corporateId: req.user.corporateId,
  });

  const productId = giftCardId;
  let selectedCard = await findSingleGiftCard(productId);
  const cardServiceOperator = await findServiceOperatorById(selectedCard.dataValues.serviceOperatorId);
  const vendorKey = cardServiceOperator?.accessKey;

  customLog(req?.LogTraceId, "info", {
    message: "Gift card and vendor resolved",
    selectedCard: selectedCard,
  });

  const templateDetails = await fetchPartnerDetails(req.user.registeredBy);
  const { id,merchant_id, product_id, product_name, merchant_name, brand_name, brand_logo, image, description, min_price, max_price, priceType, denominations, expiry, terms_and_condition, how_to_redeem } = selectedCard.dataValues;
  const individualCardPrice = amount / qty
 
  const credentialId = req.user.id;
  const senderEmail = req.user.email;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;
  const account = req.body.account;
  const name = req.user.name;
  const transactionId = req.body.corporateTxnId || new Date().valueOf();

  let providerId = transactionId;


  
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey:vendorKey,
    packageId,
    corporateUserId,
  });

  const cardDetails = {
    id:id,
    merchant_id,
    product_id,
    product_name,
    merchant_name,
    brand_name,
    brand_logo,
    image,
    description,
    min_price,
    max_price,
    priceType,
    denominations,
    expiry,
    terms_and_condition,
    how_to_redeem,
    quantity: qty,
    images,
    amount,
    individualCardPrice,
    serviceOperatorId:serviceDetails.id
  };


  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    customLog(req?.LogTraceId, "error", {
      message: "Service unavailable — serviceDetails returned error",
      vendorKey, productId, error: serviceDetails.error,
    });
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
  }

  let transactionCategory = "Gift Cards/Vouchers";
  const payCashback = req.body.payCashback;
  let commissionType = serviceDetails.commissionType;
  let cashbackType = serviceDetails.cashbackType;
  let providerCommission = serviceDetails.providerCommission;
  let corporateCashback = serviceDetails.cashback;
  let serviceOperatorId = serviceDetails.id;
  // const surchargeWithoutTax = calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount);

  let corporateTxnId = String(transactionId);
 

  
     const surchargeDetails = await calculateSurchargeWithTax(
          serviceDetails.surcharge,
          serviceDetails.surchargeType,
         amount,
          credentialId,
          qty
      );
      const surcharge = surchargeDetails.surcharge;
       const amountPayable = parseInt(amount, 10) + parseInt(surcharge, 10);

  customLog(req?.LogTraceId, "info", {
    message: "Surcharge calculated",
    amount, surcharge, amountPayable, corporateTxnId,
  });

  const giftCard = selectedCard?.dataValues;
  const journalPlanDetails = [{
    commissionMode: giftCard?.commissionMode,
    name: (giftCard?.product_name || giftCard?.brand_name)
      ? `Gift Card : ${giftCard?.product_name || giftCard?.brand_name}`
      : "Gift Card",
    commissionType: giftCard?.commissionType,
    commission: giftCard?.commission,
    fixedCommissionPerTransaction: giftCard?.fixedCommissionPerTransaction,
    isCommissionInclGST: giftCard?.isCommissionInclGST,
    isCommissionConfigured: giftCard?.isCommissionConfigured,
    amount: Number(individualCardPrice),
    quantity: Number(qty),
  }];

  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
  const reportData = await computeJournalData({
    serviceDetails,
    pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
    amount: Number(amount),
    paymentMethod: pgResponse?.payment_method || {},
    partnerDetails: templateDetails,
    paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
    couponTotalDiscount: req.body.couponTotalDiscount,
    planDetails: journalPlanDetails,
    quantity: Number(qty),
    corporateState: req.user.state,
    credentialId,
  });

  // first we will  do transaction
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

  if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
    transactionResponse = await createPGTransaction({
      ...commonParams,
      pgAmount: req.body.pgAmount,
      pgResponse: req.body.paymentGatewayResponse,
      couponCode: req.body.couponCode,
      corporateUserId,
      partnerId: req.user.registeredBy
    });
  } else {
    customLog(req?.LogTraceId, "info", { message: "Creating wallet transaction", corporateTxnId, amount });
    transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });
  }
  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
    customLog(req?.LogTraceId, "error", {
      message: "Transaction creation failed",
      corporateTxnId, error: transactionResponse.error,
    });
    return next(new ErrorResponse(transactionResponse["error"], 400));
  }
  customLog(req?.LogTraceId, "info", { message: "Transaction created successfully", corporateTxnId, transactionResponse });

  if (reportData) {
    publishJournalEvent(
      {
        transactionRef: corporateTxnId,
        type: "payment",
        contextSnapshot: {
          credentialId,
          vendor: serviceDetails?.vendor || null,
          registeredBy: req?.user?.registeredBy || null,
        },
        reportData,
      },
      req?.LogTraceId
    );
  }

  let subcriptionResponse = true; //for now if payment success, it is successfull order
  let updateDetails = {};
  if (!subcriptionResponse) {
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: "No Activation Keys Available",
      registeredById: req.user.registeredBy,
    };
   if (
       Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")
   ) {
       const { status } = await cancelPGTransaction(corporateTxnId);
       if (status) {
           await refundWalletTransaction(updateDetails);
           if (reportData) {
               publishJournalEvent(
                   {
                       transactionRef: corporateTxnId,
                       type: "refund",
                       contextSnapshot: {
                           credentialId,
                           vendor: serviceDetails?.vendor || null,
                           registeredBy: req?.user?.registeredBy || null,
                       },
                       reportData,
                   },
                   req?.LogTraceId
               );
           }
       }
   } else {
       await refundWalletTransaction(updateDetails);
       if (reportData) {
           publishJournalEvent(
               {
                   transactionRef: corporateTxnId,
                   type: "refund",
                   contextSnapshot: {
                       credentialId,
                       vendor: serviceDetails?.vendor || null,
                       registeredBy: req?.user?.registeredBy || null,
                   },
                   reportData,
               },
               req?.LogTraceId
           );
       }
   }
  } else {
    updateDetails = {
      corporateTxnId,
      providerId: "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify({
        giftCardDetails: cardDetails,
      }),
    };
  }

  const quantity = parseInt(qty, 10);

  customLog(req?.LogTraceId, "info", {
    message: "Requesting vouchers from vendor",
    vendorKey, product_id, quantity, corporateTxnId,
  }, "VENDOR");

  let result;
  switch (vendorKey) {
    case 'gift-card':
      result = await requestVouchers(accessKey, merchant_id, product_id, quantity);
      break;

    case 'xoxoday': {
      const orderEmail = receiverEmail || senderEmail;
      const poNumber = `PEKO-${corporateTxnId}`;
      result = await requestXoxodayVouchers(cardServiceOperator, product_id, quantity, individualCardPrice, orderEmail, poNumber);
      break;
    }

    default:
      customLog(req?.LogTraceId, "error", { message: "Unsupported vendor key", vendorKey, corporateTxnId });
      throw new ErrorResponse('Unsupported gift card vendor', 400);
  }

  if (!result.status) {

      customLog(req?.LogTraceId, "error", {
      message: "voucher status false",
      data:result,
    }, "VENDOR");

    const failureUpdateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: "Voucher request failed",
      registeredById: req.user.registeredBy,
      orderResponse: JSON.stringify({
        giftCardDetails: cardDetails,
        senderName,
        receiverName: receiverFirstName,
        receiverEmail,
        message,
        employee,
        accesskey:vendorKey,
        orderType
      }),
    };
    // if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
    //   let refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
    //   if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
    //     await refundWalletTransaction(failureUpdateDetails);
    //   }
    // } else {
    //   await refundWalletTransaction(failureUpdateDetails);
    // }
      if (
          Object.prototype.hasOwnProperty.call(
              req.body,
              "paymentGatewayResponse"
          )
      ) {
          const { status } = await cancelPGTransaction(corporateTxnId);
          if (status) {
              await refundWalletTransaction(failureUpdateDetails);
              if (reportData) {
                  publishJournalEvent(
                      {
                          transactionRef: corporateTxnId,
                          type: "refund",
                          contextSnapshot: {
                              credentialId,
                              vendor: serviceDetails?.vendor || null,
                              registeredBy: req?.user?.registeredBy || null,
                          },
                          reportData,
                      },
                      req?.LogTraceId
                  );
              }
          }
      } else {
          await refundWalletTransaction(failureUpdateDetails);
          if (reportData) {
              publishJournalEvent(
                  {
                      transactionRef: corporateTxnId,
                      type: "refund",
                      contextSnapshot: {
                          credentialId,
                          vendor: serviceDetails?.vendor || null,
                          registeredBy: req?.user?.registeredBy || null,
                      },
                      reportData,
                  },
                  req?.LogTraceId
              );
          }
      }
    

    const failureNotificationData = {
      notificationTitle: "Gift Card - Payment unsuccessful",
      notificationBrief: `The payment of ₹ ${(parseFloat(amount) + parseFloat(surcharge) - (transactionResponse.couponDiscount ?? 0)).toFixed(2)} for Gift Card was unsuccessful. Transaction ID: ${corporateTxnId}.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
      const subcorporateUsername = req.user.subCorporateUsername;
      if (subcorporateUsername) {
        failureNotificationData.notificationTo.push(subcorporateUsername);
      }
    }
    
  
    createNotification(failureNotificationData);


    let templateDetails;
    templateDetails = await fetchPartnerDetails(req.user.registeredBy)
    const serviceUrl = templateDetails?.baseUrl;
      let to, cc;
      if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = senderEmail;
      } else {
        to = senderEmail;
        cc = undefined; // or omit if not needed
      }
   const subject = "Transaction Failed"; // Set email subject

        if (to) {
          const resolvedGiftcardFailed = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.GIFTCARD_PAYMENT_FAILED,
            service: EMAIL_TEMPLATE_SERVICES.GIFTCARD,
            variables: {
              name,
              serviceName: "GiftCards",
              retryUrl: serviceUrl || `${templateDetails?.baseUrl}/payments`,
              branding: templateDetails?.branding || 'Peko',
              website: templateDetails?.baseUrl || 'https://peko.one/in',
              ...v2LayoutVariables(templateDetails),
            },
            fallback: () => commonFailedTemplate(name, "GiftCards", serviceUrl, templateDetails),
            fallbackSubject: subject,
            logTraceId: req?.LogTraceId,
          });
          const body = resolvedGiftcardFailed.html;
          emailer.email({to, cc, subject: resolvedGiftcardFailed.subject, body}, function () {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
          });
        } else {
          customLog(req?.LogTraceId, "info", { message: "Skipping failure email — no recipient email on user record" });
        }

    return res.status(500).json({
      status: false,
      message: "Something went wrong, try again later",
      responseCode: "001",
    });
  }

  // The given 'result' variable hold's the dummy 3rd party response for testing purpose.

  // const result = {
  //   status: true,
  //   message: "Voucher request successful",
  //   data: {
  //     response: {
  //       meta: { status: "succeeded" },
  //       data: [
  //         {
  //           voucher_ref: "IDCPGBRJUX9K9",
  //           voucher_settlement_ref: "e8cbb7e4-f879-461f-8d34-0686aab0af31",
  //           voucher_name: "TX Integration Demo EGV Product Rs. 250",
  //           status: "Active",
  //           expiration_date: "2026-01-16T23:59:59",
  //           edenred_url: "https://in-uat.txp.one/v?alias=ARUtPAgw3k3",
  //           view_code: "4809",
  //           display_codes: [],
  //         },
  //         {
  //           voucher_ref: "IDCPPXQV6A4S1",
  //           voucher_settlement_ref: "5fd8ac98-a5e8-4d5a-8cb6-a8882aa6bf7c",
  //           voucher_name: "TX Integration Demo EGV Product Rs. 250",
  //           status: "Active",
  //           expiration_date: "2026-01-16T23:59:59",
  //           edenred_url: "https://in-uat.txp.one/v?alias=AmdG0hsmjJ0",
  //           view_code: "7830",
  //           display_codes: [],
  //         },
  //       ],
  //     },
  //   },
  //   responseCode: "000",
  // };

  customLog(req?.LogTraceId, "info", { result: result }, "VENDOR");

  if (result && result.status === true) {
     customLog(req?.LogTraceId, "info", {
      message: "voucher status true",
      data:result,
    }, "VENDOR");
    selectedCard.sold_quantity = selectedCard.sold_quantity + quantity;
    await selectedCard.save();

    let VoucherDetails;
    switch (vendorKey) {
      case 'gift-card':
        VoucherDetails = result.data.response.data;
        break;
      case 'xoxoday':
        VoucherDetails = result.data.vouchers;
        customLog(req?.LogTraceId, "info", {
          message: "[Xoxoday] placeOrder deliveryStatus in payment",
          deliveryStatus: result.data?.deliveryStatus,
          VoucherDetails,
        }, "VENDOR");
        if (VoucherDetails.length === 0) {
          updateDetails.status = "PENDING";
          updateDetails.message = "Order placed, awaiting delivery from Xoxoday";
        }
        break;
    }
    const paymentDetails = {
      corporateName: req.user.username,
      name: receiverFirstName,
      refNo: `${corporateTxnId}`,
      to: receiverEmail,
      amount: (parseFloat(amount) + parseFloat(surcharge) - (transactionResponse.couponDiscount ?? 0)).toFixed(2),
      account: "N/A",
      message: "Payment Successful",
      senderName,
      senderEmail: senderEmail,
    };
    updateDetails.orderResponse = JSON.stringify({
      giftCardDetails: cardDetails,
       senderName,
        receiverName: receiverFirstName,
        receiverEmail,
        message,
        employee,
        accesskey:vendorKey,
        orderType,
        ...(vendorKey === "xoxoday" && result.data?.orderId && VoucherDetails.length > 0
          ? { xoxodayOrderId: result.data.orderId }
          : {}),
       ...(vendorKey === "xoxoday" && result.data?.orderData?.deliveryStatus === "delivered" && VoucherDetails.length > 0
          ? { deliveryStatus: result.data?.orderData?.deliveryStatus }
          : {}),
    });
    await updateWalletTransaction(updateDetails);
    customLog(req?.LogTraceId, "info", {
      message: "Wallet transaction updated",
      corporateTxnId, status: updateDetails.status,
    });

    let pdfResponse


     if (orderType === "buyForEmployees" && Array.isArray(employee) && VoucherDetails.length > 0) {
      let voucherIndex = 0;
    
      for (const emp of employee) {
        if (!emp.receiverEmail) continue;
    
        const empVouchers = VoucherDetails.slice(voucherIndex, voucherIndex + 1);
        voucherIndex++;

        if (!empVouchers.length) continue;

        customLog(req?.LogTraceId, "info", {
          message: "Generating PDF for employee",
          email: emp.receiverEmail, corporateTxnId,
        });

        let empPdfResponse;
        try {
          empPdfResponse = pdfResponse = await multiplePdfGeneration({
            cardDetails,
            VoucherDetails: empVouchers,
          });
          customLog(req?.LogTraceId, "info", {
            message: "PDF generated for employee",
            email: emp.receiverEmail, corporateTxnId,
          });
        } catch (pdfErr) {
          customLog(req?.LogTraceId, "error", {
            message: "PDF generation failed for employee — voucher issued but email not sent",
            email: emp.receiverEmail,
            corporateTxnId,
            error: pdfErr.message,
          });
          continue;
        }

        await sendGiftCardReceivedEmail(
          emp.receiverEmail,
          emp.receiverFirstName,
          paymentDetails.refNo,
          paymentDetails.amount,
          paymentDetails.account,
          message,
          paymentDetails?.senderName,
          templateDetails,
          cardDetails.brand_name || cardDetails.product_name,
          empPdfResponse,
          req?.LogTraceId
        );
      }
    }
    
    /* EXISTING SINGLE-RECEIVER FLOW */
    else if (receiverEmail && VoucherDetails.length > 0) {
      customLog(req?.LogTraceId, "info", {
        message: "Single-receiver flow — generating PDF",
        receiverEmail, corporateTxnId, voucherCount: VoucherDetails.length,
      });

      try {
        pdfResponse = await multiplePdfGeneration({
          cardDetails,
          VoucherDetails,
        });
        customLog(req?.LogTraceId, "info", {
          message: "PDF generated successfully",
          corporateTxnId, pdfCount: pdfResponse?.length,
        });
      } catch (pdfErr) {
        customLog(req?.LogTraceId, "error", {
          message: "PDF generation failed — voucher issued but email not sent",
          corporateTxnId, error: pdfErr.message,
        });
      }

      if (pdfResponse) {
        customLog(req?.LogTraceId, "info", {
          message: "Sending gift card email to receiver",
          to: paymentDetails.to, corporateTxnId,
        });
        await sendGiftCardReceivedEmail(
          paymentDetails.to,
          paymentDetails.name,
          paymentDetails.refNo,
          paymentDetails.amount,
          paymentDetails.account,
          message,
          paymentDetails?.senderName,
          templateDetails,
          cardDetails.brand_name || cardDetails.product_name,
          pdfResponse,
          req?.LogTraceId
        );
      }
    }

    /* =====================================
       SENDER EMAIL, PUSH NOTIFICATION, RESPONSE
       This runs for BOTH cases
       ===================================== */
    const serviceProvider = "Gift/Cards";
    const type = "Vouchers";
    const name = req.user.name;

    // Send email to senderEmail regarding this payment
    if (paymentDetails.senderEmail) {
      customLog(req?.LogTraceId, "info", {
        message: "Sending order confirmation email to sender",
        to: paymentDetails.senderEmail, corporateTxnId,
      });


      const to = paymentDetails.senderEmail;
      const subject2 = "Gift card order Successful";
      const giftCardWorth = parseFloat(amount).toFixed(2);
      const companyCardImage = cardDetails?.brand_logo || cardDetails?.image || '';
      // Side-by-side with the details cell (matches Figma) - a <td>, not a whole row, so
      // the admin body's own table row holds both this cell and the text cell next to it.
      const companyCardImageCell = companyCardImage
        ? `<td width="220" valign="top" style="padding-right:20px;">
                                  <img alt="${cardDetails?.product_name ?? 'Gift Card'}" src="${companyCardImage}" style="display:block;max-width:220px;height:auto;border-radius:8px;" width="220" />
                                </td>`
        : '<!-- no card image -->';
      const resolvedCompanyNotice = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.GIFTCARD_COMPANY_NOTICE,
        service: EMAIL_TEMPLATE_SERVICES.GIFTCARD,
        variables: {
          name,
          transactionId,
          dateTime: new Date().toLocaleString(),
          serviceProvider,
          cardName: cardDetails?.product_name ?? 'Gift Card',
          cardImageCell: companyCardImageCell,
          amountPayable,
          cardQuantity: cardDetails?.quantity,
          branding: templateDetails?.branding || 'Peko',
          website: templateDetails?.baseUrl || 'https://peko.one/in',
          ...v2LayoutVariables(templateDetails),
        },
        fallback: () => emailTemplates.generateGiftCardPaymentSuccessEmailToCompany(name, transactionId, amountPayable, account, quantity, images, type, serviceProvider, cardDetails, templateDetails,paymentDetails.amount,giftCardWorth),
        fallbackSubject: subject2,
        logTraceId: req?.LogTraceId,
      });

      const isPgFunded = Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse");
      const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount,
        surcharge: surcharge || 0,
        couponDiscount: transactionResponse?.couponDiscount || 0,
        corporateTxnId,
        orderId: transactionResponse?.orderId,
        paymentType: "Gift Cards/Vouchers",
        credentialId,
        pgAmount: isPgFunded ? req.body.pgAmount : null,
        vendor: serviceDetails?.vendor,
        commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
        planDetails: journalPlanDetails,
        commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
        traceId: req?.LogTraceId,
      });

      emailer.emailWithMultipleAttachment(
        to, resolvedCompanyNotice.subject, resolvedCompanyNotice.html, invoiceAttachments, undefined,
        function () {
          customLog(req?.LogTraceId, "info", {
            message: "Email sent to " + to,
          });
        }
      );
    }
    
    // Send push notification with payment details
    const notificationData = {
      notificationTitle: "Gift Card payment successful",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Gift Card was successful. Transaction ID: ${paymentDetails.refNo}.`,
      notificationTo: [paymentDetails.corporateName],
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

    customLog(req?.LogTraceId, "info", {
      message: "Gift card payment completed successfully",
      corporateTxnId, pdfGenerated: !!pdfResponse,
    });

    // Send API response
    return res.status(200).json({
      status: true,
      data: {
        ...transactionResponse,
        corporateTxnId,
      },
      message: "payment successful",
      responseCode: "000",
    });
    
  }
});


async function multiplePdfGeneration(data) {
  const { cardDetails, VoucherDetails } = data;
  const pdfArray = [];

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (let voucherIndex = 0; voucherIndex < VoucherDetails.length; voucherIndex++) {
     customLog(null, "info", { message: "cardDetails for giftcard attachment ", cardDetails});
    const html = emailTemplates.newGiftCard(cardDetails, VoucherDetails[voucherIndex]);
    const random = new Date().valueOf();
    const outputFile = `${random}-${voucherIndex}.pdf`;

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.pdf({ path: outputFile, format: "A4", preferCSSPageSize: true });
    await page.close();

    customLog(null, "info", { message: "PDF created: " + outputFile });

    pdfArray.push({
      filename: `giftcard-${voucherIndex + 1}.pdf`,
      path: outputFile,
      contentType: "application/pdf",
    });
  }

  await browser.close();
  return pdfArray;
}

async function requestToken(vendor, req) {
  if (!vendor || !vendor.optional1 || !vendor.optional2 || !vendor.optional3 || !vendor.optional4) {
    customLog(req?.LogTraceId, "error", { message: "Missing required vendor properties" }, "VENDOR");
    return false;
  }

  const URL = vendor.optional4;
  const client_id = vendor.optional1;
  const client_secret = vendor.optional2;
  const grant_type = "client_credentials";
  const scope = vendor.optional3;

  try {
    const config = {
      method: "post",
      url: URL,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: new URLSearchParams({
        client_id,
        client_secret,
        grant_type,
        scope,
      }).toString(),
    };

    const response = await axios(config);
    customLog(req?.LogTraceId, "info", { result: response.data }, "VENDOR");

    if (!response?.data?.access_token) {
      customLog(req?.LogTraceId, "error", { message: "Token response missing access_token", data: response?.data }, "VENDOR");
      return false;
    }

    return response.data.access_token;
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: error?.message,
      data: error?.response?.data,
    });

    return false;
  }
}

const requestVouchers = async (giftCard_accessKey, product_assets, products, manual_quantity, req) => {
  const MAX_RETRIES = 3; // Maximum number of retries for certain errors
  let retryCount = 0;
  let correlationId = uuidv4();

  while (retryCount < MAX_RETRIES) {
    try {
      const serviceDetails = await findServiceOperatorByAccessKey(giftCard_accessKey);
      const { vendor } = serviceDetails;
      const token = await requestToken(vendor, req);
      customLog(req?.LogTraceId, "info", { result: token }, "VENDOR");

      const headers = {
        Authorization: `Bearer ${token}`,
        "X-Client-Id": vendor.optional5,
        "X-Client-Secret": vendor.optional6,
        "X-Correlation-Id": correlationId, // Use the current correlation ID
        "Content-Type": "application/json",
      };

      const config = {
        method: "post",
        url: `https://xp-voucher-mgt-stg-sg-v1.sg-s1.cloudhub.io/api/catalogs/ETX_001/product_assets/${product_assets}/products/${products}/vouchers/actions/request`,
        headers: headers,
        data: { manual_quantity, distribution_mode: "manual" },
      };

      // Make the API call
      const response = await axios(config);

      if (!response?.data || response.data?.meta?.status !== "succeeded") {
        customLog(req?.LogTraceId, "error", { message: "Voucher request returned non-success response", data: response?.data }, "VENDOR");
        return { status: false, message: "Voucher request failed", responseCode: "001", correlationId };
      }

      return {
        status: true,
        message: "Voucher request successful",
        data: { response: response.data },
        responseCode: "000",
        correlationId,
      };
    } catch (error) {
      customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data }, "VENDOR");

      const errorData = error?.response?.data || {};

      
      const errorCode = errorData?.meta?.messages?.[0]?.code || "UNKNOWN";
      const httpStatus = error?.response?.status;

      customLog(req?.LogTraceId, "info", { message: "Error Code " + errorCode, httpStatus }, "VENDOR");

      retryCount++;

      // Handle errors based on the code
      switch (errorCode) {
        // Category A (ERV1001 HTTP 500): new access token + new correlation ID
        // Category F (ERV1001 HTTP 401): rectify at client end — hard fail
        case "ERV1001": {
          if (httpStatus === 500) {
            // Token is re-fetched at the top of each loop iteration
            correlationId = uuidv4();
            customLog(req?.LogTraceId, "info", {
              message: `[Cat A] New token + correlation ID, retrying (${retryCount}/${MAX_RETRIES})...`,
            });
            break;
          }
          return {
            status: false,
            message: "Missing, invalid or expired token. Please reauthenticate.",
            data: { error: errorData },
            responseCode: "003",
            correlationId,
          };
        }

        // Category B: retry with same correlation ID after 45s.
        // After max retries, generate a new correlation ID and return for caller to retry.
        // Also covers no-response / network exceptions (UNKNOWN).
        case "ERV1002":
        case "ERV1109":
        case "ERVMA0038":
        case "ERV9999":
        case "UNKNOWN": {
          if (retryCount >= MAX_RETRIES) {
            const nextCorrelationId = uuidv4();
            return {
              status: false,
              message: `Max retries reached for error code ${errorCode}. Retry with the provided correlation ID.`,
              data: { error: errorData },
              responseCode: "001",
              correlationId: nextCorrelationId,
            };
          }
          customLog(req?.LogTraceId, "info", {
            message: `[Cat B] Waiting 45s, retrying same correlation ID (${retryCount}/${MAX_RETRIES})...`,
          });
          await new Promise((resolve) => setTimeout(resolve, 45000));
          break; // retry with same correlationId
        }

        // Category C: voucher may be allocated — keep order pending, contact TX team
        case "ERVMA0004":
        case "ERVMA0005":
        case "ERVMA0006":
        case "ERVMA0007":
        case "ERVMA0008":
        case "ERVMA0012": {
          customLog(req?.LogTraceId, "info", {
            message: `[Cat C] Order kept pending for error code ${errorCode}`,
          });
          return {
            status: false,
            message: "Order kept in pending state. Contact TX team.",
            data: { error: errorData },
            responseCode: "002",
            correlationId,
          };
        }

        // Category D: voucher issuance in progress — retry same correlation ID (up to MAX_RETRIES), then keep pending
        case "ERVMA0070": {
          if (retryCount >= MAX_RETRIES) {
            return {
              status: false,
              message: "Voucher issuance in process. Order kept in pending state. Contact TX team with the correlation ID.",
              data: { error: errorData },
              responseCode: "002",
              correlationId,
            };
          }
          customLog(req?.LogTraceId, "info", {
            message: `[Cat D] Waiting 45s, retrying same correlation ID (${retryCount}/${MAX_RETRIES})...`,
          });
          await new Promise((resolve) => setTimeout(resolve, 45000));
          break; // retry with same correlationId
        }

        // Category E: retry with new correlation ID
        case "ERVMA0037": {
          correlationId = uuidv4();
          customLog(req?.LogTraceId, "info", {
            message: `[Cat E] New correlation ID, retrying (${retryCount}/${MAX_RETRIES})...`,
          });
          break;
        }

        // Category F: rectify at client end — hard fail (cancel or fix and retry with new correlation ID)
        default: {
          return {
            status: false,
            message: `Voucher request failed with error code ${errorCode}`,
            data: { error: errorData },
            responseCode: "003",
            correlationId,
          };
        }
      }
    }
  }
};


// ─── Xoxoday helpers ──────────────────────────────────────────────────────────

const xoxodayRefreshToken = async (details, accessKey) => {
  const XOXODAY_BASE_URL        = details.apiUrl 
  const ACCESS_TOKEN_CACHE_KEY  = `xoxoday-access-token-${accessKey}`;
  const REFRESH_TOKEN_CACHE_KEY = `xoxoday-refresh-token-${accessKey}`;
  const NEXT_REFRESH_CACHE_KEY  = `xoxoday-token-next-refresh-${accessKey}`;

  const clientId     = details.optional1;
  const clientSecret = details.optional2;

  if (!clientId || !clientSecret) {
    customLog(null, "error", { message: "[Xoxoday] clientId or clientSecret missing" }, "VENDOR");
    return false;
  }

  let refreshToken = await getValue(REFRESH_TOKEN_CACHE_KEY);
  if (!refreshToken) refreshToken = details.optional4;

  if (!refreshToken) {
    customLog(null, "error", { message: "[Xoxoday] No refresh token available" }, "VENDOR");
    return false;
  }

  try {
    const response = await axios({
      method: "post",
      url: `${XOXODAY_BASE_URL}/token/user`,
      headers: { "Content-Type": "application/json" },
      data: { grant_type: "refresh_token", refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret },
    });
   

    const tokenData = response.data;
         customLog(null, "info", { message: "[Xoxoday] Access token refreshed and new tokens generated without fallback" }, "VENDOR");
    
    if (!tokenData?.access_token) {
      customLog(null, "error", { message: "[Xoxoday] Token refresh failed", response: tokenData }, "VENDOR");
      return false;
    }

    const newAccessToken  = tokenData.access_token;
    const newRefreshToken = tokenData.refresh_token || refreshToken;
    const ACCESS_TTL  = 14 * 24 * 60 * 60;
    const REFRESH_TTL = 30 * 24 * 60 * 60;
    const nextRefreshAt = Date.now() + 12 * 24 * 60 * 60 * 1000;

    await setValue(ACCESS_TOKEN_CACHE_KEY,  ACCESS_TTL,  newAccessToken);
    await setValue(REFRESH_TOKEN_CACHE_KEY, REFRESH_TTL, newRefreshToken);
    await setValue(NEXT_REFRESH_CACHE_KEY,  REFRESH_TTL, String(nextRefreshAt));

    customLog(null, "info", { message: "[Xoxoday] Access token refreshed", accessKey }, "VENDOR");
    return newAccessToken;
  } catch (error) {
    const errData = error?.response?.data;
    const isInvalidToken = error?.response?.status === 403 &&
      (errData?.error === 'invalid_request' || errData?.error_description?.toLowerCase().includes('expired') || errData?.error_description?.toLowerCase().includes('invalid'));

    if (isInvalidToken) {
      customLog(null, "info", { message: "[Xoxoday] Refresh token invalid/expired, clearing cache and retrying with latest DB value", accessKey }, "VENDOR");

      // Clear stale refresh token from cache
      await setValue(REFRESH_TOKEN_CACHE_KEY, 1, "");

      // Re-fetch vendor fresh from DB to get latest optional4
      const freshServiceOperator = await findServiceOperatorByAccessKey(accessKey);
      const freshRefreshToken = freshServiceOperator?.vendor?.optional4;

      if (freshRefreshToken && freshRefreshToken !== refreshToken) {
        customLog(null, "info", { message: "[Xoxoday] Found different refresh token in DB, retrying" }, "VENDOR");
     
        try {
          const retryResponse = await axios({
            method: "post",
            url: `${XOXODAY_BASE_URL}/token/user`,
            headers: { "Content-Type": "application/json" },
            data: { grant_type: "refresh_token", refresh_token: freshRefreshToken, client_id: clientId, client_secret: clientSecret },
          });
       

          const retryTokenData = retryResponse.data;
           customLog(null, "info", { message: "[Xoxoday] Access token refreshed and new tokens generated" }, "VENDOR");
          if (!retryTokenData?.access_token) {
            customLog(null, "error", { message: "[Xoxoday] Retry token refresh failed", response: retryTokenData }, "VENDOR");
            return false;
          }

          const newAccessToken  = retryTokenData.access_token;
          const newRefreshToken = retryTokenData.refresh_token || freshRefreshToken;
          const ACCESS_TTL  = 14 * 24 * 60 * 60;
          const REFRESH_TTL = 30 * 24 * 60 * 60;
          const nextRefreshAt = Date.now() + 13 * 24 * 60 * 60 * 1000;

          await setValue(ACCESS_TOKEN_CACHE_KEY,  ACCESS_TTL,  newAccessToken);
          await setValue(REFRESH_TOKEN_CACHE_KEY, REFRESH_TTL, newRefreshToken);
          await setValue(NEXT_REFRESH_CACHE_KEY,  REFRESH_TTL, String(nextRefreshAt));

          customLog(null, "info", { message: "[Xoxoday] Access token refreshed via DB fallback", accessKey }, "VENDOR");
          return newAccessToken;
        } catch (retryError) {
          customLog(null, "error", { message: "[Xoxoday] Retry also failed", error: retryError?.response?.data || retryError.message }, "VENDOR");
          return false;
        }
      }

      customLog(null, "error", { message: "[Xoxoday] DB refresh token is same as failed one — manual token update required", accessKey }, "VENDOR");
    }

    customLog(null, "error", { message: "[Xoxoday] Error during token refresh", error: errData || error.message }, "VENDOR");
    return false;
  }
};

/**
 * Validates an existing Xoxoday access token against the /v1/oauth/token endpoint.
 * Returns true if the token is still valid, false otherwise.
 */
const xoxodayValidateToken = async (baseUrl, accessToken) => {
  try {
    const response = await axios({
      method: "get",
      url: `${baseUrl}/token`,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
      customLog(null, "info", { message: "[Xoxoday] validate token response" }, "VENDOR");
    return !!(response?.data?.access_token);
  } catch (error) {
    customLog(null, "info", {
      message: "[Xoxoday] Token validation failed",
      error: error?.response?.data || error.message,
    }, "VENDOR");
    return false;
  }
};

const xoxodayAccessToken = async (details, accessKey) => {
  const XOXODAY_BASE_URL        = details.apiUrl 
  const ACCESS_TOKEN_CACHE_KEY  = `xoxoday-access-token-${accessKey}`;
  const REFRESH_TOKEN_CACHE_KEY = `xoxoday-refresh-token-${accessKey}`;
  const NEXT_REFRESH_CACHE_KEY  = `xoxoday-token-next-refresh-${accessKey}`;


  const cachedToken = await getValue(ACCESS_TOKEN_CACHE_KEY);
  const cachedRefreshToken = await getValue(REFRESH_TOKEN_CACHE_KEY);

  customLog(null, "info", { message: "[Xoxoday] cache access token stored on redis", cachedToken: cachedToken ? `${cachedToken.slice(0, 10)}...` : null }, "VENDOR");
  customLog(null, "info", { message: "[Xoxoday] cache refresh token stored on redis", cachedRefreshToken: cachedRefreshToken ? `${cachedRefreshToken.slice(0, 10)}...` : null }, "VENDOR");

 
  if (cachedToken) {
    const isValid = await xoxodayValidateToken(XOXODAY_BASE_URL, cachedToken);
    if (isValid) return cachedToken;
    // Cached token is invalid/expired — clear it and fall through to refresh
    customLog(null, "info", { message: "[Xoxoday] Cached access token is invalid/expired, refreshing", accessKey }, "VENDOR");
    await setValue(ACCESS_TOKEN_CACHE_KEY, 1, "");
  }

  const seedAccessToken  = details.optional3;
  const seedRefreshToken = details.optional4;
  const refreshTokenInCache = await getValue(REFRESH_TOKEN_CACHE_KEY);

  if (seedAccessToken && !refreshTokenInCache) {
    const isSeedValid = await xoxodayValidateToken(XOXODAY_BASE_URL, seedAccessToken);
    if (isSeedValid) {
      const ACCESS_TTL  = 14 * 24 * 60 * 60;
      const REFRESH_TTL = 30 * 24 * 60 * 60;
      const nextRefreshAt = Date.now() + 13 * 24 * 60 * 60 * 1000;

      await setValue(ACCESS_TOKEN_CACHE_KEY, ACCESS_TTL, seedAccessToken);
      if (seedRefreshToken) {
        await setValue(REFRESH_TOKEN_CACHE_KEY, REFRESH_TTL, seedRefreshToken);
        await setValue(NEXT_REFRESH_CACHE_KEY,  REFRESH_TTL, String(nextRefreshAt));
      }
      customLog(null, "info", { message: "[Xoxoday] Seed access token loaded (first run)", accessKey }, "VENDOR");
      return seedAccessToken;
    }
    customLog(null, "info", { message: "[Xoxoday] Seed access token is also invalid, attempting refresh", accessKey }, "VENDOR");
  }

  return await xoxodayRefreshToken(details, accessKey);
};

// Maps Xoxoday placeOrder voucher fields to the common shape expected by the PDF template.
// Xoxoday: voucherCode → view_code, pin → voucher_ref, validity stays as-is.
const normalizeXoxodayVoucher = (v) => ({
  ...v,
  view_code:   v.voucherCode  ?? v.view_code,
  voucher_ref: v.pin          ?? v.voucher_ref,
});

const requestXoxodayVouchers = async (serviceOperator, productId, quantity, denomination, email, poNumber) => {
  try {
    const details          = serviceOperator.vendor;
    const XOXODAY_BASE_URL = details.apiUrl || details.healthUrl;

    const accessToken = await xoxodayAccessToken(details, serviceOperator.accessKey);
    if (!accessToken) {
      customLog(null, "error", { message: "[Xoxoday] Failed to obtain access token for placeOrder" }, "VENDOR");
      return { status: false, message: "Failed to obtain Xoxoday access token" };
    }

    const config = {
      method: "post",
      url: `${XOXODAY_BASE_URL}/api`,
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      data: {
        query: "plumProAPI.mutation.placeOrder",
        tag: "plumProAPI",
        variables: {
          data: {
            productId:           parseInt(productId),
            quantity:            parseInt(quantity),
            denomination:        denomination,
            email,
            poNumber,
            notifyReceiverEmail: 0,
          },
        },
      },
    };

    customLog(null, "info", {
      message: "[Xoxoday] placeOrder request payload",
      url: config.url,
      payload: config.data,
    }, "VENDOR");

    let response;
    try {
      response = await axios(config);
    } catch (axiosError) {
      customLog(null, "error", {
        message: "[Xoxoday] placeOrder API request error",
        error: axiosError || axiosError?.message,
      }, "VENDOR");

    }
    customLog(null, "info", {
      message: "[Xoxoday] place order response",
      data: response?.data,
    }, "VENDOR");

    const orderData = response?.data?.data?.placeOrder;

    if (!orderData || orderData.status !== 1) {
      customLog(null, "error", { message: "[Xoxoday] placeOrder failed", response: response?.data }, "VENDOR");
      return { status: false, message: "Xoxoday order placement failed" };
    }

    const rawVouchers = orderData.data?.vouchers || orderData.data?.voucherDetails || [];
    const vouchers = rawVouchers.map(normalizeXoxodayVoucher);

    customLog(null, "info", {
      message: "[Xoxoday] Order placed successfully",
      orderId: orderData.data?.orderId,
      voucherCount: vouchers.length,
    }, "VENDOR");

    return {
      status: true,
      message: "Voucher request successful",
      data: { vouchers, orderId: orderData.data?.orderId, orderData: orderData?.data },
      correlationId: poNumber,
    };
  } catch (error) {
     customLog(null, "error", {
      message: "log for getting error in requestXoxodayVouchers",
      error: error,
    }, "VENDOR");
    const httpStatus = error?.response?.status;
    customLog(null, "error", {
      message: "[Xoxoday] Error in requestXoxodayVouchers",
      httpStatus,
      error: error?.response?.data || error.message,
    }, "VENDOR");

    if (httpStatus >= 500 && httpStatus < 600) {
      customLog(null, "info", { message: "[Xoxoday] 5xx received — verifying order via GetOrderDetails", poNumber }, "VENDOR");
      const details = serviceOperator.vendor;
      const existingOrder = await xoxodayGetOrderDetails(details, serviceOperator.accessKey, poNumber);
      if (existingOrder) {
        customLog(null, "info", { message: "[Xoxoday] Order confirmed via GetOrderDetails", poNumber, orderId: existingOrder.orderId }, "VENDOR");
        const rawVouchers = existingOrder.vouchers || existingOrder.voucherDetails || [];
        const vouchers = rawVouchers.map(normalizeXoxodayVoucher);
        return {
          status: true,
          message: "Voucher request successful (recovered from 5xx)",
          data: { vouchers, orderId: existingOrder.orderId, orderData: existingOrder },
          correlationId: poNumber,
        };
      }
    }

    return { status: false, message: `Xoxoday order failed: ${error.message}` };
  }
};

const xoxodayGetOrderDetails = async (details, accessKey, poNumber) => {
  try {
    const XOXODAY_BASE_URL = details.apiUrl || details.healthUrl;
    const accessToken = await xoxodayAccessToken(details, accessKey);
    if (!accessToken) {
      customLog(null, "error", { message: "[Xoxoday] Failed to obtain access token for GetOrderDetails" }, "VENDOR");
      return null;
    }

    const requestPayload = {
      query: "plumProAPI.mutation.getOrderDetails",
      tag: "plumProAPI",
      variables: {
        data: {
          poNumber,
          orderId: 0,
          sendMailToReceiver: 0,
        },
      },
    };

    customLog(null, "info", {
      message: "[Xoxoday] GetOrderDetails API request",
      url: `${XOXODAY_BASE_URL}/api`,
      payload: requestPayload,
    }, "VENDOR");

    let response;
    try {
      response = await axios({
        method: "post",
        url: `${XOXODAY_BASE_URL}/api`,
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        data: requestPayload,
      });
    } catch (apiError) {
      customLog(null, "error", {
        message: "[Xoxoday] GetOrderDetails API call failed",
        poNumber,
        statusCode: apiError?.response?.status,
        error: apiError?.response?.data || apiError.message,
      }, "VENDOR");
      return null;
    }

    customLog(null, "info", {
      message: "[Xoxoday] GetOrderDetails API response",
      poNumber,
      status: response?.status,
      responseData: response?.data,
    }, "VENDOR");

    const orderData = response?.data?.data?.getOrderDetails;

    customLog(null, "info", {
      message: "[Xoxoday] GetOrderDetails extracted orderData",
      poNumber,
      orderDataStatus: orderData?.status,
      orderData,
    }, "VENDOR");

    if (!orderData || orderData.status !== 1) {
      customLog(null, "info", { message: "[Xoxoday] GetOrderDetails returned no valid order", poNumber, orderData }, "VENDOR");
      return null;
    }

    return orderData.data || null;
  } catch (error) {
    customLog(null, "error", {
      message: "[Xoxoday] Error in xoxodayGetOrderDetails",
      poNumber,
      error: error?.response?.data || error.message,
    }, "VENDOR");
    return null;
  }
};

exports.xoxodayGetOrderDetails = xoxodayGetOrderDetails;
exports.multiplePdfGeneration = multiplePdfGeneration;
exports.normalizeXoxodayVoucher = normalizeXoxodayVoucher;
