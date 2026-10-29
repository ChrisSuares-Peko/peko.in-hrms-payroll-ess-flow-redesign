const { 
  // findAllOrdersCount, 
  // findLatestFiveOrders, findStatusCountEcommerce, 
  findOneTransaction, 
  findAllOrdersCountOnCancel,
  cancelAndRefundsExport} = require("../../models/use-cases/transaction");
const { updateOrder, 
  // findOneOrder 
} = require("../../models/use-cases/order");
const puppeteer = require("puppeteer");
const fs = require("fs");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
// const { fetchCounts } = require("../../models/use-cases/products");
// const { fetchVendorDetails } = require('../../models/use-cases/vendors')
const { createOtp, verifyOtp } = require('../../models/use-cases/otp');
const emailer = require('../../utils/emailer');
const { refundWalletTransaction } = require("../../utils/walletTransaction");
const { refundCardTransaction } = require("../corporate/payment_gateway");
const { findAllBankAccount } = require("../../models/use-cases/bankDetails");
const { createLeanPayoutRequest } = require("../corporate/lean");
// const { createLeanPayout } = require("../../models/use-cases/payout");
const { findOne, fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { partnerLogos } = require('../../utils/partnerLogos');
const { commonEmailOtpVerification } = require("../../utils/templatesForEmails");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const { emailOrderCancelRejectedTemplate, emailOrderCancelTemplate } = require("../../utils/emailTemplate/ecommerce");
const { cancel: ondcCancel } = require("../../services/ondc");
const { waitForOnCancel, describeCancelOutcome } = require("../../services/ondcCancelWaiter");
const { refundOndcOrder, refundOndcOrderAfterCancel, REASONS: REFUND_REASONS } = require("../../services/ondcOrderRefund");
const { sendOndcOrderCancelledEmail } = require("../../services/ondcRefundCancelNotify");
const { assertOndcOrderCancellable } = require("../../utils/ondcCancelEligibility");
const { customLog } = require("../../utils/loggerHelper");

/** Reason code → operator-facing message for the refund endpoint. */
const REFUND_MESSAGES = {
  [REFUND_REASONS.NOT_FOUND]: 'ONDC order not found',
  [REFUND_REASONS.NOT_DELAYED]: 'This order is not delayed yet — its delivery date has not passed',
  [REFUND_REASONS.ALREADY_DELIVERED]: 'This order was delivered, so it is not delayed',
  [REFUND_REASONS.NO_PAYMENT_REF]: 'No payment reference on this order — it cannot be refunded automatically',
  [REFUND_REASONS.ORDER_CANCELLED]: 'This order is already cancelled',
  [REFUND_REASONS.PAYOUT_RELEASED]: 'The seller has already been settled for this order, so it cannot be refunded here',
  [REFUND_REASONS.NOTHING_REFUNDABLE]: 'This order has already been fully refunded',
  [REFUND_REASONS.INVALID_AMOUNT]: 'Enter a refund amount greater than zero',
  [REFUND_REASONS.DUPLICATE]: 'This refund has already been processed',
  [REFUND_REASONS.GATEWAY_FAILED]: 'The payment gateway rejected the refund',
};
const {
  findOndcOrderByIdAdmin,
  updateOndcOrderCancellation,
  findOndcOrdersForAdminAction,
} = require("../../models/use-cases/ondc_order");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");

exports.findCancelAndRefunds = asyncHandler(async (req, res, next) => {
  let { from, to, searchText, page, itemsPerPage } = req.query;

  let status = req.query.status || undefined
  
  const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
  let sortField = req.query.sortField || 'createdAt'
  
  
  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let length = itemsPerPage
  
  // Calculate offset based on page and itemsPerPage
  let start;
  if (page && itemsPerPage) {
      start = (page - 1) * itemsPerPage;
  }
  
  let params = {
       start,
       from,
       to,
       length,
       searchText,
       sort,
       sortField,
       status,
  }

  const transactionsData = await findAllOrdersCountOnCancel(params);
  if (!transactionsData) {
    return next(new ErrorResponse(`Something went wrong while getting all orders from DB`, 500));
  } else {
    // Active ONDC orders admin can act on directly (no separate
    // customer-request queue yet — see findOndcOrdersForAdminAction).
    // Kept as its own array rather than merged into `data` since the two
    // sources have entirely different shapes.
    const ondcOrders = await findOndcOrdersForAdminAction({ searchText, from, to })
    return res.status(200).json({
      status: true,
      data: {
      recordsTotal: transactionsData.count,
      recordsFiltered: transactionsData.count,
      data: transactionsData.rows,
      ondcOrders },
      message: "Orders fetched successfully",
      responseCode: "000"
    });
  }
});
exports.cancelAndRefundsExcelCSV = asyncHandler(async (req, res, next) => {
  let { from, to, searchText } = req.query;
  const { type } = req.params;

  let status = req.query.status || undefined;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";
  let params = {
    from,
    to,
    searchText,
    sort,
    sortField,
    status,
  };

  const data = await cancelAndRefundsExport(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500));
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500));
  } else {
    const { buffer, fileType } = await generateExcelBufferAndType(data, type);
    return res.status(200).json({
      status: true,
      data: { buffer, fileType },
      message: "Fetched excel/csv datas successfully",
      responseCode: "000",
    });
  }
});
exports.cancelAndRefundsPDF = asyncHandler(async (req, res, next) => {
  let { from, to, searchText } = req.query;

  let status = req.query.status || undefined;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";
  let params = {
    from,
    to,
    searchText,
    sort,
    sortField,
    status,
  };

  const data = await cancelAndRefundsExport(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500));
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500));
  }

  const templateDetails = {
    title: 'Cancel & Refunds'
  }
  const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);
  let random = new Date().valueOf();

  // Create a browser instance with Puppeteer
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Set content to the page
  await page.setContent(reportHtmlWithStyle, { waitUntil: "domcontentloaded" });

  // Generate PDF using Puppeteer
  const outputFile = `report-${random}.pdf`;
  await page.pdf({
    scale: 0.6,
    path: outputFile,
    format: "A4",
    preferCSSPageSize: true,
  });

  const buffer = fs.readFileSync(outputFile);

  browser.close();

  fs.unlinkSync(outputFile);

  return res.status(200).json({
    status: true,
    message: "report generated successfully.",
    data: {
      buffer,
      fileType: "application/pdf",
    },
    responseCode: "000",
  });
});
exports.getOtp = asyncHandler(async (req, res) => {
  let { scope } = req.query
  let otp
  let email
  if (scope === "email") {
    email = req.user.email
    if (!req.user.email) {
        //get email from system user 
        const result = await findOne(req.user)
        email = result.email
    }
    //it will create a bycrypted otp in db and return the created otp to send via email
    otp = await createOtp({ contact: email })
    if (!otp) {
      return res.status(500).json({ status: false, message: 'Failed to create OTP.', data: {}, responseCode: "000" });
    }
    //Sending Email with otp
    let supportEmailDetails = commonEmailOtpVerification({otp})
    await emailer.email(email, 'Office Supplies Refund Request', supportEmailDetails)
  }

  console.log("-------------------------")
  console.log("-------------------------")
  console.log("EMAIL:", otp, "------")
  console.log("-------------------------")
  console.log("-------------------------")
  //ADD OTP RESPONSE
  return res.status(200).json({
    status: true,
    message: "OTP sent successfully via email.",
    data: process.env.NODE_ENV !== "production" ? { otp } : {},
    responseCode: "000"
  });

})


/**
 * Refund a DELAYED ONDC order to the buyer.
 *
 * Unlike cancelUpdateOrder and returnUpdateOrder — which only notify the seller over
 * ONDC and move no money — this actually refunds through Cashfree and blocks the
 * seller's pending Easy Split payout. Eligibility, the cap and idempotency all live
 * in services/ondcOrderRefund.js; this handler is just HTTP mapping.
 *
 * NO OTP GATE, unlike the cancel and return actions in this file — a deliberate product
 * decision. Note what it leaves in place: `verifyToken` only parses a `userdata` header
 * and these admin routes carry no role/permission middleware, so nothing but network
 * reachability now stands between a caller and a refund. What still holds is the
 * idempotency guard (deterministic refundId + unique index) against accidental double
 * refunds, and attribution of every attempt to req.user.id in the ondcOrderRefunds
 * ledger.
 *
 * PUT /api/v1/system_user/:userId/purchase/ecommerce/ondc/orders/:id/refund
 */
exports.refundOndcOrderById = asyncHandler(async (req, res) => {
  const data = req.body
  const ondcOrderId = req.params.id

  const result = await refundOndcOrder({
    ondcOrderId,
    amount: data.amount,
    reason: data.reason,
    userId: req.user?.id || null,
    logTraceId: req?.LogTraceId,
  })

  if (!result.status) {
    // 404 for a missing order, 409 for "the order's state doesn't allow this",
    // 400 for a bad amount — so the UI can tell "refresh, it changed" from "fix input".
    const status = result.reason === REFUND_REASONS.NOT_FOUND
      ? 404
      : result.reason === REFUND_REASONS.INVALID_AMOUNT
        ? 400
        : 409
    return res.status(status).json({
      status: false,
      message: result.message || REFUND_MESSAGES[result.reason] || 'Refund could not be processed',
      data: { reason: result.reason, refundableAmount: result.refundableAmount ?? null },
      responseCode: '001',
    });
  }

  return res.status(200).json({
    status: true,
    message: 'Refund initiated successfully',
    data: {
      amount: result.amount,
      refundId: result.refundId,
      refundableAmount: result.refundableAmount,
      payoutBlocked: result.payoutBlocked,
    },
    responseCode: '000',
  });
})

exports.cancelUpdateOrder = async (req, res, next) => {
  try{
  let data = req.body
  let {corporateTxnId, ondcOrderId} = req.query

  // verifying otp (shared by both the legacy and the ONDC branch below)
  let response;
  let email
  if (data.scope === 'email') {
    email = req.user.email
    if (!req.user.email) {
        //get email from system user
        const result = await findOne(req.user)
        email = result.email
    }
    response = await verifyOtp({ contact: email, otp: data.otp, context: 'email' })
    if (response.isVerified === false) {
      return res.status(401).json({ status: false, message: response.message, data: {} ,responseCode: "000" });
    }
  }else {
    return res.status(401).json({status: false, message: 'otp is required',data:{}, responseCode: '001'});
}

  // ============================================================
  // ONDC branch — BPP /cancel, mark Cancelled, then full buyer refund
  // with Easy Split refund_splits (same as corporate cancel).
  // ============================================================
  if (ondcOrderId) {
    if (data.workspaceOrderStatus === 'Cancel rejected') {
      // Nothing was ever sent to the seller — just acknowledge the rejection.
      return res.status(200).json({
        status: true,
        message: "Cancellation request rejected",
        data: {},
        responseCode: "000"
      });
    }

    const ondcOrder = await findOndcOrderByIdAdmin(ondcOrderId)
    if (!ondcOrder) {
      return next(new ErrorResponse(`ONDC order not found`, 400));
    }

    const eligibility = assertOndcOrderCancellable(ondcOrder);
    if (!eligibility.ok) {
      return next(new ErrorResponse(eligibility.message, eligibility.statusCode));
    }

    const waiterPromise = waitForOnCancel(ondcOrder.transactionId)
    try {
      await ondcCancel({
        bppId: ondcOrder.bppId,
        bppUri: ondcOrder.bppUri,
        orderId: ondcOrder.orderId,
        transactionId: ondcOrder.transactionId,
      })
    } catch (ondcErr) {
      return next(new ErrorResponse(ondcErr.message || `Failed to send cancellation to the seller`, 502));
    }

    const result = await waiterPromise
    const outcome = describeCancelOutcome(result)
    if (!outcome.ok) {
      // The raw reason distinguishes a refusal from silence from a superseded
      // wait — ops needs that to decide whether to force the cancellation.
      customLog(req?.LogTraceId, "warn", {
        message: "ondcCancel(admin): cancellation not confirmed",
        ondcOrderId: ondcOrder.id,
        waiterReason: result.reason,
        outcome: outcome.outcome,
        canForce: outcome.canForce,
      }, "VENDOR");
      return next(new ErrorResponse(outcome.message, outcome.statusCode));
    }

    await updateOndcOrderCancellation({ id: ondcOrder.id, cancelReason: data.reason || null })
    await sendOndcOrderCancelledEmail({ row: ondcOrder, cancelReason: data.reason || null, logTraceId: req?.LogTraceId });

    let refund = null;
    try {
      refund = await refundOndcOrderAfterCancel({
        ondcOrderId: ondcOrder.id,
        userId: req.user?.id || null,
        logTraceId: req?.LogTraceId,
        reason: data.reason || "Order cancelled",
      });
    } catch (refundErr) {
      customLog(req?.LogTraceId, "error", {
        flow: "ondcCancelRefund",
        step: "admin-cancel-refund-threw",
        message: "Admin ONDC cancel succeeded but refund threw — needs reconciliation",
        ondcOrderId: ondcOrder.id,
        error: refundErr?.message || String(refundErr),
      }, "VENDOR");
      refund = { status: false, reason: "refund_threw", message: refundErr?.message || String(refundErr) };
    }

    return res.status(200).json({
      status: true,
      message: "Order cancelled successfully",
      data: {
        cancelled: true,
        refund: refund
          ? {
              status: Boolean(refund.status),
              amount: refund.amount ?? 0,
              refundId: refund.refundId || null,
              reason: refund.reason || null,
              message: refund.message || null,
              alreadyRefunded: Boolean(refund.alreadyRefunded),
            }
          : null,
      },
      responseCode: "000"
    });
  }

  // ============================================================
  // Legacy branch (unchanged) — non-ONDC orders on the old order/transaction
  // tables.
  // ============================================================
  const transaction = await findOneTransaction({ corporateTxnId })
  if(!transaction){
    return next(new ErrorResponse(`Transaction not found`, 400));
  }
  let params = {
    id: transaction.order.id
  }
  //handle cancel request has been rejected
  let orderResponse = transaction.order.orderResponse

  if (data.workspaceOrderStatus == "Cancel rejected") {
    
    orderResponse = JSON.parse(orderResponse)
    orderResponse.orderCancelStatus = {
      "UpdateDateTime": new Date(),
      "remarks": "Cancel Rejected" }
      
      orderResponse = JSON.stringify(orderResponse)

    let updateData = {
      orderResponse,
      workspaceOrderStatus: data.workspaceOrderStatus,
    }
    
    let result = await updateOrder(params, updateData);
    if (!result) {
      return next(new ErrorResponse(`Something went wrong while updating the order`, 500));
    }
    let templateDetails;
    transaction?.credential?.registeredBy ?
    templateDetails = await fetchPartnerDetails(transaction?.credential?.registeredBy)
     :
     templateDetails = await partnerLogos()
     const resolvedCancelRejected = await resolveEmailTemplate({
       key: EMAIL_TEMPLATE_KEYS.ECOM_ORDER_CANCEL_REJECTED,
       service: EMAIL_TEMPLATE_SERVICES.ECOM,
       variables: { name: transaction.credential.name, ...v2LayoutVariables(templateDetails) },
       fallback: () => emailOrderCancelRejectedTemplate(transaction.credential.name, templateDetails),
       fallbackSubject: 'Your order cancel request rejected',
       logTraceId: req?.LogTraceId,
     });
     let supportEmailDetails = resolvedCancelRejected.html;
     await emailer.email(transaction.credential.email, resolvedCancelRejected.subject, supportEmailDetails)

    return res.status(200).json({
      status: true,
      message: "Order updated successfully",
      data: {},
      responseCode: "000"
    });

  }

  

  let updateDetails = {
    corporateTxnId,
    status: "REFUNDED",
    providerId: "Not Available",
    message: "Refund initiated",
    registeredById: req.user.registeredBy,
    orderResponse
  }

  let paymentData
  if (transaction) {
    paymentData = JSON.parse(transaction?.order?.paymentModeResponse)
  }


  //return next(new ErrorResponse(`Something went wrong while returning lean transaction`, 200));
  // async function createLeanPayoutRequestOld(destinationIdLean, leanAmount, credentialId, orderId) {
  //   console.table({ destinationIdLean, leanAmount, credentialId })
  //   try {
  //     let payoutResponse = await createPayout({ destinationIdLean: destinationIdLean, amount: leanAmount, description: "REFUND INITIATED" }, credentialId)
  //     if (!payoutResponse) {
  //       return {
  //         status: false,
  //         message: 'Something went wrong while returning lean transaction',
  //       }
  //     }
  //     const paymentRefId = payoutResponse.payouts_payment_details[0].payment_intent_id
  //     const stringifiedResponse = JSON.stringify(payoutResponse)
  //     let createLeanPayoutRes = await createLeanPayout({ orderId, paymentRefId, payoutResponse: stringifiedResponse, status: "INITIATED" }) //for creating data for payout
  //     if (createLeanPayoutRes && createLeanPayoutRes?.status == 'INITIATED') {
  //       return {
  //         status: true,
  //         message: 'Successfully created lean payout.'
  //       }
  //     } else {
  //       return {
  //         status: false,
  //         message: 'Something went wrong in createLeanPayout.'
  //       }
  //     }
  //   } catch (error) {
  //     return {
  //       status: false,
  //       message: error?.message || 'Something went wrong.'
  //     }
  //   }
  // }


  // cancel without refund
  if (req.body?.paymentStatus == "PAID") {
    let updateData = {
      "ecomOrderStatus": "CANCELLED"
    }
     await updateOrder(params, updateData);

  } else if (transaction.order.paymentMode == "BANK" || transaction.order.paymentMode == "BANK + WALLET") {
    let leanAmount = paymentData.leanAmount
    let destinationIdLean = req.body.corporateBank ///it need to be come form req.body 
    //>>>>>>>>>>>>>LEAN REFUND CODE STARTS<<<<<<<<<<<<<<<<
    const { status, message } = await createLeanPayoutRequest(leanAmount, req.user.id, params.id, updateDetails, destinationIdLean);
    if (!status) return next(new ErrorResponse(message || `Something went wrong while returning bank transaction`, 500));

    /**
     * if status false we needed to send an email to used that ur refund process is faild please raise a ticket
     */

    /**
     * await refundWalletTransaction(updateDetails)
     * this is refundWalletTransaction is needed to be called after the admin authorization.
     * this called after the webhook from lean. 
     */

  } else if (transaction.order.paymentMode == "WALLET") {
    //cancel with  wallet refund 
    await refundWalletTransaction(updateDetails)

  } else if (transaction.order.paymentMode == "PAYMENT GATEWAY" || transaction.order.paymentMode == "PAYMENT GATEWAY + WALLET") {
    //cancel with  payment gateway refund 
    let refundPGResponse = await refundCardTransaction(req, paymentData)
    if (refundPGResponse?.state == 'REVERSED' || refundPGResponse?.state == 'REFUNDED') {
      await refundWalletTransaction(updateDetails)
    } else {
      return next(new ErrorResponse(`Something went wrong while returning card transaction`, 500));
    }
  } else {
    return next(new ErrorResponse(`Something went wrong while returning.`, 500));
  }

  // updating order status and sending email
  const obj = {
    ecomOrderStatus: 'CANCELLED',
  }
  let result = await updateOrder(params, obj);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating the order`, 500));
  }
  let templateDetails;
  transaction?.credential?.registeredBy ?
  templateDetails = await fetchPartnerDetails(transaction?.credential?.registeredBy)
   :
   templateDetails = await partnerLogos()
   const resolvedOrderCancelled = await resolveEmailTemplate({
     key: EMAIL_TEMPLATE_KEYS.ECOM_ORDER_CANCELLED,
     service: EMAIL_TEMPLATE_SERVICES.ECOM,
     variables: { name: transaction.credential.name, orderId: transaction.order.id, ...v2LayoutVariables(templateDetails) },
     fallback: () => emailOrderCancelTemplate(transaction.credential.name, transaction.order.id, templateDetails),
     fallbackSubject: 'Your order has been cancelled',
     logTraceId: req?.LogTraceId,
   });
   let supportEmailDetails = resolvedOrderCancelled.html;
   await emailer.email(transaction.credential.email, resolvedOrderCancelled.subject, supportEmailDetails)


  return res.status(200).json({
    status: true,
    message: "Order updated successfully",
    data: {},
    responseCode: "000"
  });
  }catch(err){
        return next(new ErrorResponse(`Something went wrong`, 500));
  }
};

exports.getBank = async (req, res) => {
  const params = req.query
  const result = await findAllBankAccount(params);
  if (!result) {
    // Bank account details are not available
    const bankDetails = {
      accountHolderName: "Not available",
      accountNumber: "Not available",
      iban: "Not available",
      bankName: "Not available",
      // Set other properties if needed
    };
    return res.status(200).json({
      status: true,
      data: {result:[bankDetails]},
      message: 'Bank fetched successfully',
      responseCode: '002'
    });
  } else {
    return res.status(200).json({
      status: true,
      data: {result},
      message: 'Bank fetched successfully',
      responseCode: '000'
    });
  }
}


