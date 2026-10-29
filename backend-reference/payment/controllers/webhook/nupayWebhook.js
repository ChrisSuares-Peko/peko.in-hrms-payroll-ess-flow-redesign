const asyncHandler = require("../../middlewares/async");
const { findByReferenceId, updateStatus } = require("../../models/use-cases/payoutTransaction");
const { updateEntryStatus } = require("../../models/use-cases/transactionLedger");
const { updateByNupayRefNo, findByNupayRefNo } = require("../../models/use-cases/nupayMerchantOnboarding");
const { fetchNupayCredentials, encryptCredential } = require("../../utils/nupayCredentialsVault");
const { customLog } = require("../../utils/loggerHelper");

/**
 * POST /webhook/nupay/payment/transaction/debit
 * NuPay calls this with the final payout (debit) transaction status.
 *
 * Payload: { code, description, message, utr, mode, amount, client_reference_id, additional_info }
 * code: NP2000 = success, NP1000 = pending, NP5000 = failed
 */
exports.nupayDebitWebhookHandler = asyncHandler(async (req, res) => {
  const body = req.body;
  customLog(req?.LogTraceId, "info", { message: "NuPay debit webhook received", data: body });

  const referenceId = body?.client_reference_id;
  if (!referenceId) {
    return res.status(400).json({ status: false, message: "client_reference_id is missing", responseCode: "400" });
  }

  const transaction = await findByReferenceId(referenceId);
  if (!transaction) {
    customLog(req?.LogTraceId, "info", { message: "NuPay debit webhook: transaction not found", referenceId });
    return res.status(200).json({ status: true, message: "Transaction not found", responseCode: "000" });
  }

  if (transaction.status === "COMPLETED" || transaction.status === "FAILED") {
    return res.status(200).json({ status: true, message: "Transaction already finalized", responseCode: "000" });
  }

  const code = body?.code;
  const finalStatus =
    code === "NP2000" ? "COMPLETED" :
    code === "NP5000" ? "FAILED" :
    "PENDING";

  await updateStatus(transaction.id, finalStatus, body?.utr || null);

  const ledgerStatus = finalStatus === "COMPLETED" ? "SUCCESS" : finalStatus === "FAILED" ? "FAILED" : "PENDING";
  await updateEntryStatus(referenceId, ledgerStatus);

  customLog(req?.LogTraceId, "info", { message: `NuPay debit: transaction ${referenceId} updated to ${finalStatus}` });

  return res.status(200).json({ status: true, message: "Transaction status updated", responseCode: "000" });
});

/**
 * POST /webhook/nupay/payment/transaction/credit
 * NuPay calls this when a credit (incoming fund) is received into the virtual account.
 *
 * Payload: { beneficiary_account_number, payment_mode, transaction_type, remarks,
 *            transaction_amount, credit_date, utr, remitter_account_name,
 *            remitter_account_number, remitter_account_ifsc_code,
 *            nupay_reference_number, available_balance, status }
 */
exports.nupayCreditWebhookHandler = asyncHandler(async (req, res) => {
  const body = req.body;
  customLog(req?.LogTraceId, "info", { message: "NuPay credit webhook received", data: body });

  return res.status(200).json({ status: true, message: "Credit webhook received", responseCode: "000" });
});

/**
 * POST /webhook/nupay/payment/transaction/refund
 */
exports.nupayRefundWebhookHandler = asyncHandler(async (req, res) => {
  const body = req.body;
  customLog(req?.LogTraceId, "info", { message: "NuPay refund webhook received", data: body });

  return res.status(200).json({ status: true, message: "Refund webhook received", responseCode: "000" });
});

/**
 * POST /webhook/nupay/payment/onboarding-status
 */
exports.nupayOnboardingWebhookHandler = asyncHandler(async (req, res) => {
  const body = req.body;
  customLog(req?.LogTraceId, "info", { message: "NuPay onboarding webhook received", data: body });

  const nupayRefNo = body?.nupay_ref_no;
  if (nupayRefNo) {
    const code = body?.code;
    const status =
      code === "NP2000" ? "SUCCESS" :
      code === "NP5000" ? "FAILED" :
      code === "NP6000" ? "ON_HOLD" :
      "PENDING";

    const updateData = { status };
    if (body?.credentials_link) updateData.credentialsLink = body.credentials_link;
    if (body?.onboarded_at) updateData.onboardedAt = new Date(body.onboarded_at);
    if ((status === "FAILED" || status === "ON_HOLD") && body?.message) updateData.rejectionReason = body.message;

    if (body?.credentials_link && status === "SUCCESS") {
      try {
        const record = await findByNupayRefNo(nupayRefNo);
        if (record?.contactNumber) {
          const { accessKey, accessSecret, providerId, walletAccountId, vaNumber, vaIfsc } = await fetchNupayCredentials(body.credentials_link, record.contactNumber);
          if (accessKey) updateData.encryptedAccessKey = encryptCredential(accessKey);
          if (accessSecret) updateData.encryptedAccessSecret = encryptCredential(accessSecret);
          if (providerId) updateData.providerId = providerId;
          if (walletAccountId) updateData.walletAccountId = walletAccountId;
          if (vaNumber) updateData.vaNumber = vaNumber;
          if (vaIfsc) updateData.vaIfsc = vaIfsc;
          customLog(req?.LogTraceId, "info", { message: `NuPay onboarding: credentials fetched and encrypted for ${nupayRefNo}`, data: { hasAccessKey: !!accessKey, hasAccessSecret: !!accessSecret, providerId, walletAccountId, vaNumber, vaIfsc } });
        }
      } catch (err) {
        customLog(req?.LogTraceId, "error", { message: `NuPay onboarding: failed to fetch credentials for ${nupayRefNo}`, error: err.message });
      }
    }

    await updateByNupayRefNo(nupayRefNo, updateData);
    customLog(req?.LogTraceId, "info", { message: `NuPay onboarding: ${nupayRefNo} updated to ${status}` });
  }

  return res.status(200).json({ status: true, message: "Onboarding webhook received", responseCode: "000" });
});
const paymentLinkOnboarding = require('../../models/entities/paymentLinkOnboarding');
const { mapOnboardingStatus } = require('../../services/nupayOnboarding');
const { tryFetchNupayCredentials, encryptCred } = require('../../utils/nupayCollectionsVault');
const {
    findPaymentLinkByIdentifiers,
    findPaymentQrByIdentifiers,
    updatePaymentLinkStatus,
    updatePaymentQrStatus,
    syncUnifiedCollectionWebhookStatus,
    syncLedgerEntryStatus,
    parseOccurredAt,
    PAYMENT_SUCCESS_STATUSES,
    PAYMENT_FAILED_STATUSES,
} = require('../corporate/paymentLinks/common');

const logNupayEvent = (req, message) => {
    customLog(
        req?.LogTraceId,
        'info',
        {
            message,
            method: req.method,
            url: req.originalUrl,
            npRequestId: req.headers['np-request-id'] || '',
            body: JSON.stringify(req.body || {}),
        },
        'VENDOR'
    );
};

// POST /api/v1/webhook/nupay/payment/payment-links/callback — Collection 360 payment callback
// Payload keyed by client_reference_id; transaction_status SUCCESS/FAILED/REJECTED.
// Always ACK 200 (including unknown refs) to avoid NuPay retry storms.
exports.nupayCollectionWebhook = asyncHandler(async (req, res) => {
    logNupayEvent(req, 'NuPay collection webhook received');
    const body = req.body || {};

    const referenceId = body.client_reference_id ? String(body.client_reference_id).trim() : '';
    const nupayTxnId = body.transaction_id ? String(body.transaction_id).trim() : '';
    const rawStatus = String(body.transaction_status || '').trim().toUpperCase();

    if (!rawStatus || (!referenceId && !nupayTxnId)) {
        return res.status(400).json({
            status: false,
            message: 'transaction_status and client_reference_id (or transaction_id) are required',
            responseCode: '400',
        });
    }

    // REJECTED (e.g. invalid PIN) is terminal failure for us; keep original status in rawPayload
    const providerStatus = rawStatus === 'REJECTED' ? 'FAILED' : rawStatus;
    const statusOccurredAt = parseOccurredAt(body.transaction_timestamp) || new Date();

    let source = 'payment_link';
    let localRecord = await findPaymentLinkByIdentifiers({
        reference_id: referenceId || null,
        decentro_txn_id: nupayTxnId || null,
    });
    if (!localRecord) {
        source = 'payment_qr';
        localRecord = await findPaymentQrByIdentifiers({
            reference_id: referenceId || null,
            decentro_txn_id: nupayTxnId || null,
        });
    }

    if (!localRecord) {
        logNupayEvent(req, `NuPay collection webhook: no local record for ${referenceId || nupayTxnId}`);
        return res.status(200).json({ status: true, message: 'received' });
    }

    // Persist the payment UTR from the webhook (collection links only) for the detail view.
    if (source === 'payment_link' && body.utr) {
        await localRecord.update({ utr: String(body.utr).trim() });
    }

    const updateResult =
        source === 'payment_link'
            ? await updatePaymentLinkStatus({
                  reference_id: localRecord.reference_id,
                  status: providerStatus,
                  rawPayload: body,
                  occurredAt: statusOccurredAt,
                  skipUnifiedSync: true,
              })
            : await updatePaymentQrStatus({
                  reference_id: localRecord.reference_id,
                  status: providerStatus,
                  rawPayload: body,
                  occurredAt: statusOccurredAt,
                  skipUnifiedSync: true,
              });

    const updatedRecord =
        source === 'payment_link' ? updateResult?.paymentLink || null : updateResult?.paymentQr || null;

    if (updatedRecord && updateResult?.statusChanged) {
        await syncUnifiedCollectionWebhookStatus({
            req,
            source,
            record: updatedRecord,
            status: providerStatus,
            occurredAt: statusOccurredAt,
            rawPayload: body,
        });

        const ledgerStatus = PAYMENT_SUCCESS_STATUSES.has(providerStatus)
            ? 'SUCCESS'
            : PAYMENT_FAILED_STATUSES.has(providerStatus)
              ? 'FAILED'
              : null;
        if (ledgerStatus) {
            await syncLedgerEntryStatus(
                req,
                'nupayCollectionWebhook.ledgerStatusSync',
                {
                    transactionId: updatedRecord.decentro_txn_id,
                    status: ledgerStatus,
                    metadata: { webhookPayload: body },
                },
                { source, referenceId: updatedRecord.reference_id, corporateUser: updatedRecord.credentialId }
            );
        }
    }

    return res.status(200).json({ status: true, message: 'received' });
});

// POST /api/v1/webhook/nupay/payment/payment-links/settlement — fired per transaction when the
// collected amount settles to the merchant's bank account. Keyed by client_reference_id.
exports.nupaySettlementWebhook = asyncHandler(async (req, res) => {
    logNupayEvent(req, 'NuPay settlement webhook received');
    const body = req.body || {};

    const referenceId = body.client_reference_id ? String(body.client_reference_id).trim() : '';
    if (!referenceId) {
        return res.status(400).json({ status: false, message: 'client_reference_id is required', responseCode: '400' });
    }

    const settled = body.settled === true || String(body.transaction_status || '').toUpperCase() === 'SUCCESS';
    if (!settled) {
        logNupayEvent(req, `NuPay settlement webhook: non-settled payload for ${referenceId}`);
        return res.status(200).json({ status: true, message: 'received' });
    }

    let source = 'payment_link';
    let localRecord = await findPaymentLinkByIdentifiers({ reference_id: referenceId, decentro_txn_id: body.transaction_id || null });
    if (!localRecord) {
        source = 'payment_qr';
        localRecord = await findPaymentQrByIdentifiers({ reference_id: referenceId, decentro_txn_id: body.transaction_id || null });
    }
    if (!localRecord) {
        logNupayEvent(req, `NuPay settlement webhook: no local record for ${referenceId}`);
        return res.status(200).json({ status: true, message: 'received' });
    }

    // Persist the settlement UTR from the webhook (collection links only) for the detail view.
    if (source === 'payment_link' && body.settlement_utr) {
        await localRecord.update({ settlementUtr: String(body.settlement_utr).trim() });
    }

    const occurredAt = parseOccurredAt(body.settled_at) || new Date();
    const updateResult =
        source === 'payment_link'
            ? await updatePaymentLinkStatus({ reference_id: localRecord.reference_id, status: 'SETTLED', rawPayload: body, occurredAt, skipUnifiedSync: true })
            : await updatePaymentQrStatus({ reference_id: localRecord.reference_id, status: 'SETTLED', rawPayload: body, occurredAt, skipUnifiedSync: true });

    const updatedRecord =
        source === 'payment_link' ? updateResult?.paymentLink || null : updateResult?.paymentQr || null;

    if (updatedRecord && updateResult?.statusChanged) {
        await syncUnifiedCollectionWebhookStatus({
            req,
            source,
            record: updatedRecord,
            status: 'SETTLED',
            occurredAt,
            rawPayload: body,
        });
    }

    return res.status(200).json({ status: true, message: 'received' });
});

// POST /api/v1/webhook/nupay/payment/onboarding/status — merchant onboarding status update.
// mid = our credentialId; stores credentials_link for the vault fetch (automation pending live sample).
exports.nupayOnboardingWebhook = asyncHandler(async (req, res) => {
    logNupayEvent(req, 'NuPay merchant onboarding webhook received');
    const body = req.body || {};

    const mid = body.mid ? String(body.mid).trim() : '';
    const clientReferenceId = body.client_reference_id ? String(body.client_reference_id).trim() : '';
    if (!mid && !clientReferenceId) {
        return res.status(400).json({ status: false, message: 'mid or client_reference_id is required', responseCode: '400' });
    }

    const where = mid ? { credentialId: mid } : { onboardingClientReferenceId: clientReferenceId };
    const record = await paymentLinkOnboarding.findOne({ where });
    if (!record) {
        logNupayEvent(req, `NuPay onboarding webhook: no local record for mid=${mid || clientReferenceId}`);
        return res.status(200).json({ status: true, message: 'received' });
    }

    const status = mapOnboardingStatus(body.code);
    const credentialsLink = body.credentials_link || record.credentialsLink;
    await record.update({
        status,
        nupayRefNo: body.nupay_ref_no || record.nupayRefNo,
        credentialsLink,
        remarks: body.message || record.remarks,
        ...(status === 'active' ? { activatedAt: new Date() } : {}),
        providerResponse: { ...(record.providerResponse || {}), onboardingWebhook: body },
    });

    // On success, fetch this merchant's API credentials from the vault link (password = onboarding
    // phone), store them encrypted, once. Non-blocking — failure just leaves them unset for retry.
    if (status === 'active' && credentialsLink && record.phone && !record.nupayAccessKey) {
        const creds = await tryFetchNupayCredentials(credentialsLink, record.phone, req?.LogTraceId);
        if (creds) {
            await record.update({
                nupayAccessKey: encryptCred(creds.accessKey),
                nupayAccessSecret: encryptCred(creds.accessSecret),
                nupayProviderId: creds.providerId || record.nupayProviderId,
                credentialsFetchedAt: new Date(),
            });
        }
    }

    logNupayEvent(req, `NuPay onboarding status for credential ${record.credentialId}: ${status}`);
    return res.status(200).json({ status: true, message: 'received' });
});

// Log-only stubs below (payouts scope — separate developer). Always ACK 200.

// POST /api/v1/webhook/nupay/payment/refund — payout refund event (payload not documented yet)
exports.nupayRefundWebhook = asyncHandler(async (req, res) => {
    logNupayEvent(req, 'NuPay refund webhook received');
    return res.status(200).json({ status: true, message: 'received' });
});

// POST /api/v1/webhook/nupay/payment/payout/update — Unified Wallet transaction.debit (payout status)
exports.nupayPayoutDebitWebhook = asyncHandler(async (req, res) => {
    logNupayEvent(req, 'NuPay payout debit webhook received');
    return res.status(200).json({ status: true, message: 'received' });
});

// POST /api/v1/webhook/nupay/payment/wallet/credit — Unified Wallet transaction.credit (funds received)
exports.nupayWalletCreditWebhook = asyncHandler(async (req, res) => {
    logNupayEvent(req, 'NuPay wallet credit webhook received');
    return res.status(200).json({ status: true, message: 'received' });
});
