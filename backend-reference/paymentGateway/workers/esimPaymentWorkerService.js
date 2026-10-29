/**
 * eSIM Payment Processing Service
 * Handles bulk payment processing for both Bondio and Tunz vendors
 *
 * This service is called by the Bull Queue worker
 * Logic copied from: payment/services/bulkPayment.js (processEsimPayment)
 */

const axios = require('axios');
const path = require('path');
const {
  fetchServiceDetails,
  calculateSurcharge,
  calculateAmountWithTax,
} = require('../utils/checkAndFetchServiceDetails');
const {
  updateWalletTransaction,
  createWalletTransaction,
  refundWalletTransaction,
} = require('../utils/walletTransaction');
const { cancelPGTransaction } = require('../utils/pgRefund');
const { createNotification } = require('../models/use-cases/notification');
const { createPGTransaction } = require('../utils/paymentGatewayTransaction');
const emailer = require('../utils/emailer');
const { generateEsimBuyBulkSuccessEmail, generateEsimRecipientEmail, generateEsimRecipientSubject } = require('../utils/emailTemplates/eSim');
const { fetchPartnerDetails } = require('../models/use-cases/systemUser');
const { customLog } = require('../utils/loggerHelper');
const { uploadFile } = require('../utils/commonUploadFile');
const QRCode = require('qrcode');
const { createEsimProfile } = require('../models/use-cases/esimProfiles');
const { getToken } = require('../utils/tunzAuth');
const wallet = require('../models/entities/wallet');
const { updateBulkPaymentStatus, notifyPGPaymentConfirmed } = require('../utils/pusherNotification');
const { getPlanByPlanId } = require('../models/use-cases/esimPlans');
const { generateOrderInvoiceAttachments } = require('../services/invoiceAndReceipt');
const operatorsData = require('../utils/operatorsData.json');
const { computeJournalData } = require('../utils/computeJournalData');
const { publishJournalEvent } = require('../utils/bull/queue/accountingEventsQueue');

// Fully using paymentGateway MS - no longer syncing to payment MS

/**
 * Process a single eSIM payment for bulk operations
 * @param {Object} jobData - Job data from Bull Queue containing user, payment, and plan info
 * @param {Object} job - Bull job (used to detect the final retry attempt)
 * @returns {Object} - Processing result
 * @throws {Error} - On vendor API failure, transaction failure, etc. (Bull will retry)
 */
async function processEsimPayment(jobData, job) {
  // Once the vendor has issued the eSIM, we must never refund or retry this job
  let vendorSucceeded = false;
  let reportData, serviceDetails, credentialId, corporateTxnId;
  try {
    customLog(jobData?.LogTraceId, 'info', {
      message: '[ESIM PAYMENT SERVICE] Starting payment processing',
      corporateTxnId: jobData.corporateTxnId,
      planId: jobData.planId,
    });

    const body = jobData;
    const req = { body };
    req.user = body.user;

    let accessKey = body.accessKey;
    const isTunz = accessKey === operatorsData.eSIMTunz.accessKey;
    const transactionCategory = 'Travel';
    const { transactionId, account, amount } = body;

    // Get credentialId from body (passed during job enqueue) or from req.user
    credentialId = body.credentialId || req.user?.id;

    if (!credentialId) {
      customLog(jobData?.LogTraceId, 'error', {
        message: '[ESIM WORKER] credentialId is undefined - cannot proceed',
        bodyHasCredentialId: !!body.credentialId,
        userHasId: !!req.user?.id,
        bodyKeys: Object.keys(body).slice(0, 10),
      });
      throw new Error('credentialId is required for payment processing');
    }
    const packageId = body.packageId || req.user?.packageId;
    const corporateUserId = body.corporateUserId || req.user?.corporateId;
    corporateTxnId = body.corporateTxnId;
    const providerId = transactionId;

    // Fetch service details
    serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      customLog(req?.LogTraceId, 'error', {
        message: '[ESIM PAYMENT SERVICE] Service details fetch failed',
        corporateTxnId,
        error: serviceDetails.error,
      });

      throw new Error(`Service details fetch failed: ${serviceDetails.error}`);
    }

    accessKey = accessKey === 'etisalat_bill' ? 'etisalat_direct' : accessKey;
    let token;
    const URL = serviceDetails.vendor.apiUrl;

    // Get token (Tunz requires auth first)
    if (isTunz) {
      token = await getToken(serviceDetails.vendor, body.accessKey);
      if (!token) {
        throw new Error('Failed to authenticate with Tunz API');
      }
    } else {
      token = serviceDetails.vendor.optional1;
    }

    const commissionType = serviceDetails.commissionType;
    const cashbackType = serviceDetails.cashbackType;
    const serviceOperatorId = serviceDetails.id;
    const surchargeWithoutTax = await calculateSurcharge(
      serviceDetails.surcharge,
      serviceDetails.surchargeType,
      amount,
      credentialId,
    );
    const recomputedSurcharge = await calculateAmountWithTax(surchargeWithoutTax);
    // For a PG-funded item the surcharge must be what the gateway actually collected,
    // i.e. pgAmount minus amount, never a recompute. calculateSurcharge/WithTax round 2dp
    // per item, so N items can claim more than the batch charged (2 x 129.87 vs 259.73);
    // the balance check bills that gap to the wallet and throws at a zero balance.
    const isPgFundedItem =
      Object.prototype.hasOwnProperty.call(body, 'paymentGatewayResponse') &&
      body.pgAmount !== undefined &&
      body.pgAmount !== null;
    const surcharge = isPgFundedItem
      ? Number((Number(body.pgAmount) - Number(amount)).toFixed(4))
      : recomputedSurcharge;
    const providerCommission = serviceDetails.providerCommission;
    const corporateCashback = serviceDetails.cashback;

    // Compute journal data from plan-level commission fields
    const planForJournal = body.plan || {};

    const partnerDetailsForJournal = await fetchPartnerDetails(body.user.registeredBy)

    const planDetails = [{
      name: planForJournal.name ? `eSIM : ${planForJournal.name}` : "eSIM Plan",
      commissionMode: planForJournal.commissionMode,
      commissionType: planForJournal.commissionType,
      commission: planForJournal.commission,
      fixedCommissionPerTransaction: planForJournal.fixedCommissionPerTransaction,
      isCommissionInclGST: planForJournal.isCommissionInclGST,
      isCommissionConfigured: planForJournal.isCommissionConfigured,
      amount: Number(planForJournal.amount || amount),
      quantity: 1,
    }];

    const pgResponse = Array.isArray(body?.paymentGatewayResponse) ? body.paymentGatewayResponse[0] : body?.paymentGatewayResponse;
    reportData = await computeJournalData({
      serviceDetails,
      pgAmount: body.paymentGatewayResponse ? Number(body.pgAmount || 0) : 0,
      amount: Number(amount),
      paymentMethod: pgResponse?.payment_method || {},
      partnerDetails: partnerDetailsForJournal,
      paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
      couponTotalDiscount: body.couponTotalDiscount,
      planDetails,
      corporateState: body.user?.state,
      credentialId,
    });

    // Create transaction (wallet or PG)
    let transactionResponse = {};
    if (Object.prototype.hasOwnProperty.call(body, 'paymentGatewayResponse')) {
      transactionResponse = await createPGTransaction({
        providerId,
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        accountNo: account,
        pgAmount: body.pgAmount,
        transactionCategory,
        orderAmount: amount,
        commissionType,
        cashbackType,
        providerCommission,
        pgResponse: body.paymentGatewayResponse,
        surcharge,
        batchId: body.batchId,
        reportData,
      });
    } else {
      transactionResponse = await createWalletTransaction({
        providerId,
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        accountNo: account,
        transactionCategory,
        surcharge,
        amount,
        commissionType,
        cashbackType,
        providerCommission,
        batchId: body.batchId,
        reportData,
      });
    }

    if (Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
      // On retry, the transaction may already exist (DUPLICATE TRANSACTION ID)
      // This is expected and OK - we'll continue with the existing transaction
      if (transactionResponse.error?.includes('DUPLICATE')) {
        customLog(req?.LogTraceId, 'info', {
          message: '[ESIM PAYMENT SERVICE] Transaction already exists (retry case)',
          corporateTxnId,
          error: transactionResponse.error,
        });
      } else {
        customLog(req?.LogTraceId, 'error', {
          message: '[ESIM PAYMENT SERVICE] Transaction creation failed',
          corporateTxnId,
          error: transactionResponse.error,
        });
        throw new Error(`Transaction creation failed: ${transactionResponse.error}`);
      }
    }

    publishJournalEvent(
      {
        transactionRef: corporateTxnId,
        type: "payment",
        contextSnapshot: {
          credentialId,
          vendor: serviceDetails?.vendor || null,
          registeredBy: body.user?.registeredBy || null,
        },
        reportData,
      },
      jobData?.LogTraceId
    );

    // Call vendor API
    let eSIMBody;
    let vendorUrl;

    if (isTunz) {
      eSIMBody = {
        inventoryItemId: body.planId,
        metatag: String(corporateTxnId),
        userIp: body.userIp,
        // Regional orders carry a 3-letter region code (EUR/ASA/...) which is not a valid userCountry
        userCountry: body.countryCode?.length === 2 ? body.countryCode : "NP",
        activationMode: 'FIRST_USE',
      };
      vendorUrl = `${URL}/gigastore/activations/register`;
    } else {
      // Bondio
      eSIMBody = {
        planParams: {
          planId: body.planId,
          activationType: 'NOW',
          activationAt: 0,
        },
      };
      vendorUrl = `${URL}/v2/subscriptions`;
    }

    customLog(req?.LogTraceId, 'info', {
      message: '[ESIM PAYMENT SERVICE] Calling vendor API',
      corporateTxnId,
      vendor: isTunz ? 'Tunz' : 'Bondio',
      vendorUrl,
      tokenPresent: !!token,
      tokenLength: token?.length,
      environment: process.env.NODE_ENV,
    });

    let response;

    // Only call actual vendor API in production
    // Use mock responses in staging/local for testing
    if (process.env.NODE_ENV === 'production') {
      response = await axios({
        method: 'post',
        url: vendorUrl,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        data: eSIMBody,
        timeout: 10000,
      }).catch(err => {
        customLog(req?.LogTraceId, 'error', {
          message: '[ESIM PAYMENT SERVICE] Vendor API error details',
          corporateTxnId,
          vendor: isTunz ? 'Tunz' : 'Bondio',
          status: err.response?.status,
          statusText: err.response?.statusText,
          responseData: err.response?.data,
          requestHeaders: { Authorization: `Bearer ${token?.substring(0, 20)}...` },
        });
        throw err;
      });

      if (!response || !response.data) {
        throw new Error('No response from vendor API');
      }
    } else {
      // Mock response for non-production environments
      customLog(req?.LogTraceId, 'info', {
        message: '[ESIM PAYMENT SERVICE] Using mock response (non-production)',
        corporateTxnId,
        vendor: isTunz ? 'Tunz' : 'Bondio',
      });

      response = isTunz
        ? getMockTunzResponse(body.plan)
        : getMockBondioResponse(corporateTxnId);
    }
    const result = response.data;

    // Vendor can return 2xx with an error body - treat that as a failure (retryable)
    if (result && (result.errorCode || result.errorcode)) {
      throw new Error(`Vendor returned error response: ${JSON.stringify(result)}`);
    }
    vendorSucceeded = true;

    // Update transaction with success
    // Match EXACTLY with single payment format (eSIMV2.js line 622-632)
    const updateDetails = {
      corporateTxnId,
      providerId: isTunz
        ? (result?.activatedItem?.uid || 'Not Available')
        : (result?.orderId || 'Not Available'),
      status: 'SUCCESS',
      message: 'Payment Successful',
      orderResponse: JSON.stringify({
        ...result, // Spread existing data (result is already unwrapped from response.data at line 262)
        planId: body.planId, // Add the planId field
        country: body.country,
        ...(body.purchasingFor && { purchasedFor: body.purchasingFor })
      }),
    };

    await updateWalletTransaction(updateDetails);

    // No longer syncing to payment MS - fully using paymentGateway MS with shared database
    // Transaction record created via createWalletTransaction is sufficient for order history

    // Create eSIM profile for Tunz - store ICCID for future topups
    if (isTunz && result?.esimProfile?.iccid) {
      try {
        await createEsimProfile({
          credentialId: req.user.id,
          corporateUserId: req.user.corporateId,
          customerUid: result.customer?.uid,
          esimUid: result.esimProfile?.uid,
          iccid: result.esimProfile.iccid,
          activationCode: result.esimProfile?.activationCode,
          planId: body.planId,
          country: body.country,
          corporateTxnId,
          state: result.esimProfile?.state,
          installationUrl: result.esimProfile?.installationUrl,
        });
        customLog(req?.LogTraceId, 'info', {
          message: '[ESIM PROFILE] Created successfully for topup',
          iccid: result.esimProfile.iccid,
          customerUid: result.customer?.uid,
        });
      } catch (profileError) {
        customLog(req?.LogTraceId, 'error', {
          message: '[ESIM PROFILE] Failed to create (non-critical)',
          iccid: result.esimProfile?.iccid,
          error: profileError?.message,
        });
        // Don't throw - profile creation failure shouldn't fail the payment
      }
    }

    // Create eSIM profile for Bondio - store ICCID for future topups
    if (!isTunz && result?.esim) {
      try {
        await createEsimProfile({
          credentialId: req.user.id,
          corporateUserId: req.user.corporateId,
          customerUid: result.id,  // Bondio uses subscription ID as identifier
          esimUid: result.id,
          iccid: result.esim,
          planId: body.planId,
          country: body.country,
          corporateTxnId,
        });
        customLog(req?.LogTraceId, 'info', {
          message: '[ESIM PROFILE] Created successfully for Bondio topup',
          iccid: result.esim,
          subscriptionId: result.id,
        });
      } catch (profileError) {
        customLog(req?.LogTraceId, 'error', {
          message: '[ESIM PROFILE] Failed to create Bondio profile (non-critical)',
          iccid: result?.esim,
          error: profileError?.message,
        });
        // Don't throw - profile creation failure shouldn't fail the payment
      }
    }

    // Fetch updated wallet balance for real-time frontend notification
    const walletDetails = await wallet.findOne({
      where: { credentialId },
      attributes: ['balance']
    });
    const walletBalance = walletDetails ? Number(walletDetails.balance) : 0;

    // Send real-time Pusher notification to frontend
    await updateBulkPaymentStatus(credentialId, {
      corporateTxnId,
      status: 'SUCCESS',
      walletBalance,
    });
    await notifyPGPaymentConfirmed(credentialId, body.batchId, corporateTxnId, body.redisKey || null);

    // Save to notification database (matches pattern used by all other services)
    try {
      const notificationData = {
        notificationTitle: 'eSIM Purchase Successful',
        notificationBrief: `eSIM Payment of ₹ ${body.amount + (Number(body.batchSurcharge) || 0)} was successful. Transaction ID: ${corporateTxnId}.`,
        notificationTo: body.user?.username ? [body.user.username] : [],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
      };
      await createNotification(notificationData);
    } catch (notifErr) {
      customLog(req?.LogTraceId, 'error', {
        message: '[ESIM BULK] Failed to create database notification',
        error: notifErr?.message,
      });
    }

    // Send success email with eSIM details (async, non-blocking)
    try {
      const partnerDetails = partnerDetailsForJournal;

      // Fetch full plan details for email (includes dataMBs, periodDays, country, name)
      const plan = await getPlanByPlanId(body.planId, credentialId);

      // Extract ICCID based on vendor - Tunz has esimProfile, Bondio has esim directly
      const esimIds = isTunz
        ? (result?.esimProfile?.iccid || 'N/A')
        : (result?.esim || 'N/A');
      const activationCode = isTunz ? (result?.esimProfile?.activationCode || '') : '';

      // Generate QR code for email - same approach as single payment
      let qrCodes;
      try {
        if (isTunz && activationCode) {
          // For Tunz: generate QR locally from activation code (like single payment does)
          qrCodes = await handleQRCodeBulk(
            [{ esim: esimIds, id: corporateTxnId, activationCode }],
            credentialId,
            accessKey,
            packageId,
            corporateUserId,
            isTunz
          );
        } else {
          // For Bondio: fetch QR from API
          qrCodes = await handleQRCodeBulk(
            [{ esim: esimIds, id: corporateTxnId }],
            credentialId,
            accessKey,
            packageId,
            corporateUserId,
            isTunz
          );
        }
      } catch (qrError) {
        customLog(jobData?.LogTraceId, 'error', {
          message: '[ESIM BULK EMAIL] QR code generation failed',
          vendor: isTunz ? 'Tunz' : 'Bondio',
          error: qrError?.message,
          iccid: esimIds,
        });
        // If QR generation fails, continue without QR (same as single payment)
        qrCodes = [{ iccid: esimIds, qrCodeUrl: null }];
      }

      // Calculate per-item total amount with surcharge
      // body.batchSurcharge is already the PER-ITEM surcharge (not total batch)
      // So we use it directly: baseAmount + perItemSurcharge
      const baseAmount = Number(body.amount);
      let perItemSurcharge = Number(body.batchSurcharge) || 0;

      const totalAmount = parseFloat((baseAmount + perItemSurcharge).toFixed(2));

      customLog(jobData?.LogTraceId, 'info', {
        message: '[ESIM BULK EMAIL] Amount calculation',
        baseAmount,
        batchTotal: body.batchTotal,
        totalBatchSurcharge: body.batchSurcharge,
        perItemSurcharge,
        totalAmount,
      });

      // Purchased for an employee / someone else: eSIM details go to them, purchaser in CC
      const recipient = body.purchasingFor;
      const purchaserEmail = body.user?.email || req.user?.email;
      const emailTo = recipient?.email || purchaserEmail;
      const emailCc = recipient?.email ? purchaserEmail : (partnerDetails?.email || '');
      const subject = recipient?.email
        ? generateEsimRecipientSubject(plan)
        : `eSIM Purchase Confirmation - Transaction ID: ${corporateTxnId}`;

      const emailBody = recipient?.email
        ? generateEsimRecipientEmail(recipient.name, body.user?.name, corporateTxnId, plan, qrCodes, partnerDetails)
        : generateEsimBuyBulkSuccessEmail(
            corporateTxnId,
            totalAmount,
            plan,  // Full plan object with dataMBs, periodDays, country, name
            'SIM',  // Type should be 'SIM' not 'BULK' for proper email formatting
            body.quantity,  // Actual quantity purchased
            esimIds,
            qrCodes,
            partnerDetails
          );

      customLog(jobData?.LogTraceId, 'info', {
        message: '[ESIM BULK EMAIL] Sending confirmation email',
        corporateTxnId,
        vendor: isTunz ? 'Tunz' : 'Bondio',
        recipient: emailTo,
      });

      const guidelinePdf = path.resolve(__dirname, '../public/assets/pdf/eSIM Installation guideline.pdf');
      const isPgFunded = Object.prototype.hasOwnProperty.call(body, 'paymentGatewayResponse');
      const pgResp = Array.isArray(body?.paymentGatewayResponse) ? body.paymentGatewayResponse[0] : body?.paymentGatewayResponse;
      const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount,
        surcharge,
        couponDiscount: transactionResponse?.couponDiscount || 0,
        corporateTxnId,
        orderId: transactionResponse?.orderId,
        paymentType: 'eSIM',
        description: plan?.name || 'eSIM (bulk order)',
        credentialId,
        pgAmount: isPgFunded ? body.pgAmount : null,
        paymentMethod: pgResp?.payment_method || pgResp?.paymentMethod,
        traceId: jobData?.LogTraceId,
      });
      emailer.emailWithMultipleAttachment(
        emailTo,
        subject,
        emailBody,
        [{ filename: 'eSIM Installation guideline.pdf', path: guidelinePdf }, ...invoiceAttachments],
        emailCc || undefined,
        function (err) {
          if (err) {
            customLog(jobData?.LogTraceId, 'error', {
              message: '[ESIM BULK EMAIL] Failed to send',
              corporateTxnId,
              vendor: isTunz ? 'Tunz' : 'Bondio',
              error: err?.message,
            });
          } else {
            customLog(jobData?.LogTraceId, 'info', {
              message: '[ESIM BULK EMAIL] Sent successfully',
              corporateTxnId,
              vendor: isTunz ? 'Tunz' : 'Bondio',
            });
          }
        }
      );
    } catch (emailError) {
      customLog(jobData?.LogTraceId, 'error', {
        message: '[ESIM BULK EMAIL] Error',
        corporateTxnId,
        vendor: isTunz ? 'Tunz' : 'Bondio',
        error: emailError?.message,
      });
      // Don't throw - email failure shouldn't fail the payment
    }

    customLog(req?.LogTraceId, 'info', {
      message: '[ESIM PAYMENT SERVICE] Payment processed successfully',
      corporateTxnId,
      vendor: isTunz ? 'Tunz' : 'Bondio',
      walletBalance,
    });

    return {
      success: true,
      corporateTxnId,
      result,
    };
  } catch (error) {
    // eSIM was already issued by the vendor - a post-success step (pusher/balance fetch) failed.
    // Refunding or retrying here would refund a delivered eSIM / buy a duplicate one.
    if (vendorSucceeded) {
      customLog(jobData?.LogTraceId, 'error', {
        message: '[ESIM PAYMENT SERVICE] Post-success step failed - completing job WITHOUT refund/retry',
        corporateTxnId: jobData?.corporateTxnId,
        error: error?.message,
        stack: error?.stack,
      });
      return {
        success: true,
        corporateTxnId: jobData?.corporateTxnId,
        warning: `Post-success step failed: ${error?.message}`,
      };
    }

    const maxAttempts = job?.opts?.attempts || 1;
    const attemptNumber = (job?.attemptsMade ?? 0) + 1;
    const isFinalAttempt = attemptNumber >= maxAttempts;

    customLog(jobData?.LogTraceId, 'error', {
      message: '[ESIM PAYMENT SERVICE] Payment processing failed',
      corporateTxnId: jobData?.corporateTxnId,
      attemptNumber,
      maxAttempts,
      isFinalAttempt,
      error: error?.message,
      stack: error?.stack,
    });

    // Not the last attempt: keep the wallet debited (txn stays PENDING) and let Bull retry.
    // On retry, createWalletTransaction returns DUPLICATE and processing continues on the
    // existing debit - refunding here would deliver the eSIM for free on a successful retry.
    if (!isFinalAttempt) {
      throw error;
    }

    // Final attempt failed: refund once and notify
    const updateDetails = {
      corporateTxnId: jobData?.corporateTxnId,
      status: 'FAILURE',
      providerId: 'Not Available',
      message: error?.message || 'Payment processing failed',
      registeredById: jobData?.user?.registeredBy,
      orderResponse: JSON.stringify({
        error: error?.message,
      }),
    };

    try {
      if (Object.prototype.hasOwnProperty.call(jobData, 'paymentGatewayResponse')) {
        const pgRefundResult = await cancelPGTransaction(jobData.corporateTxnId);
        if (!pgRefundResult?.status) {
          customLog(jobData?.LogTraceId, 'error', {
            message: '[ESIM PAYMENT SERVICE] Cashfree refund failed - needs manual follow-up',
            corporateTxnId: jobData?.corporateTxnId,
            pgRefundResult,
          });
        }
      }
      await refundWalletTransaction(updateDetails);
      
      if (reportData) {
        publishJournalEvent(
          {
            transactionRef: corporateTxnId || jobData?.corporateTxnId,
            type: "refund",
            contextSnapshot: {
              credentialId: credentialId || jobData?.user?.id || null,
              vendor: serviceDetails?.vendor || null,
              registeredBy: jobData?.user?.registeredBy || null,
            },
            reportData,
          },
          jobData?.LogTraceId
        );
      }
    } catch (refundError) {
      customLog(jobData?.LogTraceId, 'error', {
        message: '[ESIM PAYMENT SERVICE] Refund failed',
        corporateTxnId: jobData?.corporateTxnId,
        refundError: refundError?.message,
      });
    }

    // Fetch wallet balance for failure notification
    try {
      const walletDetails = await wallet.findOne({
        where: { credentialId: jobData?.user?.id },
        attributes: ['balance']
      });
      const walletBalance = walletDetails ? Number(walletDetails.balance) : 0;

      // Send failure notification to frontend (real-time Pusher)
      await updateBulkPaymentStatus(jobData?.user?.id, {
        corporateTxnId: jobData?.corporateTxnId,
        status: 'FAILURE',
        walletBalance,
      });

      // Save to notification database (matches pattern used by all other services)
      const failureNotificationData = {
        notificationTitle: 'eSIM Purchase Failed',
        notificationBrief: `eSIM Payment of ₹ ${jobData?.amount} failed. Transaction ID: ${jobData?.corporateTxnId}. Error: ${error?.message}`,
        notificationTo: jobData?.user?.username ? [jobData.user.username] : [],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
      };
      await createNotification(failureNotificationData);
    } catch (notificationError) {
      customLog(jobData?.LogTraceId, 'error', {
        message: '[ESIM PAYMENT SERVICE] Failed to send failure notification',
        corporateTxnId: jobData?.corporateTxnId,
        notificationError: notificationError?.message,
      });
    }

    // Rethrow so Bull marks the job as permanently failed (retries already exhausted)
    throw error;
  }
}

/**
 * Mock Bondio response for non-production testing
 * Matches the structure returned by Bondio /v2/subscriptions endpoint
 */
function getMockBondioResponse(corporateTxnId) {
  // Use the same test ICCID that works in single payment staging
  // This ensures QR code API call succeeds in both single and bulk
  const testIccid = '8937204017177720078';

  return {
    status: 201,
    statusText: 'Created',
    data: {
      id: `sub_${generateMockId()}`,
      createdAt: Math.floor(Date.now() / 1000),
      esim: testIccid,  // Use test ICCID that exists in Bondio staging
      metadata: {
        corporateTxnId: String(corporateTxnId),
        source: 'mock-staging',
      },
    },
  };
}

/**
 * Mock Tunz response for non-production testing
 * Matches the structure returned by Tunz /gigastore/activations/register endpoint
 * Format MUST match single payment mock (eSimTunz.js line 931)
 */
// Staging mock mirrors the actually purchased plan so order history stays consistent
function getMockTunzResponse(plan) {
  const sizeMBs = Number(plan?.dataMBs) || 10;
  const size = sizeMBs >= 1024
    ? { sizeValue: sizeMBs / 1024, sizeUnit: 'GB' }
    : { sizeValue: sizeMBs, sizeUnit: 'MB' };
  const validityDays = Number(plan?.periodDays) || 30;

  return {
    data: {
      status: 'success',
      activatedItem: {
        balance: {
          activatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString(),
          activationMode: 'FIRST_USE',
          name: plan?.name || 'Worldwide 10MB Test',
          size,
          availableBalance: size,
          validitySize: validityDays,
          validityUnit: 'days'
        },
        uid: `test-item-${Date.now()}`,
        metatag: 'Mock activation',
        salesChannel: 'API',
        salesChannelTypeCode: 'API',
        activationType: 'DATA_PLAN',
        purchasePrice: {
          sortIndex: 1,
          priceValue: 0.01,
          currencyCode: 'USD'
        },
        retailPrice: {
          sortIndex: 1,
          priceValue: 0.01,
          currencyCode: 'USD'
        }
      },
      customer: {
        email: 'test@test.com',
        uid: `customer-${Date.now()}`,
        profileUrl: 'mock-profile'
      },
      esimProfile: {
        iccid: `890000000000${Math.floor(Math.random() * 100000)}`,
        uid: `esim-${Date.now()}`,
        imsi: `00101${Math.floor(Math.random() * 100000000)}`,
        activationCode: `LPA:1$mock.server$${Math.random().toString(36).substring(2, 10)}`,
        appleUniversalLink: 'https://mock-install-link.apple',
        installationUrl: 'https://mock-install-link',
        lastSeen: new Date().toISOString(),
        activatedAt: new Date().toISOString(),
        state: 'RELEASED'
      }
    }
  };
}

/**
 * Generate a realistic-looking mock ID
 */
function generateMockId() {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Handle QR code generation for bulk payments
 * Mirrors the single payment logic from eSIMV2.js/eSimTunz.js
 */
async function handleQRCodeBulk(esimDataArray, credentialId, accessKey, packageId, corporateUserId, isTunz) {
  const qrCodeUrls = [];

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });

  for (const esimData of esimDataArray) {
    const iccid = esimData.esim;

    try {
      let qrCodeUrl = null;

      if (isTunz && esimData.activationCode) {
        // For Tunz: generate QR locally from activation code (like single payment)
        const qrBase64 = await QRCode.toDataURL(esimData.activationCode);
        const base64Image = qrBase64.replace(/^data:image\/png;base64,/, "");
        qrCodeUrl = await uploadFile(base64Image, 'esims', 'png');
      } else if (!isTunz) {
        // For Bondio: fetch QR from API
        const token = serviceDetails.vendor.optional1;
        const apiUrl = serviceDetails.vendor.apiUrl || 'https://api.bondio.co';
        const vendorUrl = `${apiUrl}/v1/esims/${iccid}/qrcode`;

        const config = {
          method: 'GET',
          url: vendorUrl,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token}`,
          },
          responseType: 'arraybuffer',
        };

        const response = await axios(config);

        if (response.data && response.data.length > 0) {
          const imageBuffer = Buffer.from(response.data, 'binary');
          const base64Image = imageBuffer.toString('base64');
          qrCodeUrl = await uploadFile(base64Image, 'esims', 'png');
        }
      }

      qrCodeUrls.push({
        id: esimData.id,
        iccid,
        qrCodeUrl,
      });
    } catch (err) {
      // If QR generation fails, add without QR (same as single payment)
      qrCodeUrls.push({
        id: esimData.id,
        iccid,
        qrCodeUrl: null,
      });
    }
  }

  return qrCodeUrls;
}

module.exports = { processEsimPayment };
