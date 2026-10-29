const { initiateTransfer } = require("../utils/decentroGateway");
const paymentLinkOnboarding = require("../models/entities/paymentLinkOnboarding");
const paymentLinks = require("../models/entities/paymentLink");
const { createSettlementRecord } = require("../models/use-cases/settlementRecords");
const { v4 } = require("uuid");
const paymentQrs = require("../models/entities/paymentQr");
const { Op } = require("sequelize");
const EnachMandateExecution = require("../models/entities/eNachMandateExecution");
const transactionLedger = require("../models/entities/transactionLedger");

// Maps the settlement sourceType to the ledger source enum value.
const SETTLEMENT_LEDGER_SOURCE = {
  payment_link:    "SETTLEMENT_PAYMENT_LINK",
  payment_qr:      "SETTLEMENT_PAYMENT_QR",
  enach_execution: "SETTLEMENT_ENACH_EXEC",
};

// Non-blocking ledger DEBIT write — errors are logged but never propagate.
const writeLedgerDebit = async ({ sourceType, referenceId, decentroTxnId, amount, credentialId, status, meta }) => {
  try {
    const ledgerSource = SETTLEMENT_LEDGER_SOURCE[sourceType] || "PAYOUT";
    // Use decentroTxnId as the unique transactionId when available; fall back to referenceId.
    const transactionId = decentroTxnId || referenceId;
    await transactionLedger.create({
      transactionId,
      type: "DEBIT",
      amount,
      source: ledgerSource,
      status,
      referenceId,
      credentialId: Number(credentialId),
      metadata: meta || null,
    });
  } catch (ledgerErr) {
    console.error("[settlePaymentLinks] ledger DEBIT write failed", {
      referenceId,
      sourceType,
      error: ledgerErr?.message,
    });
  }
};

exports.settlePaymentLinks = async () => {
  // decentroSettlementToMVA();

  const now = new Date();
  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const [successPaymentLinks, successPaymentQrs, successEnachExec] =
    await Promise.all([
      paymentLinks.findAll({
        where: {
          status: "SUCCESS",
          createdAt: {
            [Op.lte]: oneDayAgo,
          },
        },
      }),
      paymentQrs.findAll({
        where: {
          status: "SUCCESS",
          createdAt: {
            [Op.lte]: oneDayAgo,
          },
        },
      }),
      EnachMandateExecution.findAll({
        where: {
          status: "SUCCESS",
          createdAt: {
            [Op.lte]: oneDayAgo,
          },
        },
      }),
    ]);

  const getBeneficiaryDetails = async (credentialId) => {
    const onboardedDetails = await paymentLinkOnboarding.findOne({
      where: {
        credentialId,
      },
    });

    return {
      name: onboardedDetails?.businessName || null,
      accountNumber: onboardedDetails?.accountNumber || null,
      ifscCode: onboardedDetails?.ifsc || null,
    };
  };

  const createSettlementAttempt = async ({
    sourceType,
    settlementRecordId,
    credentialId,
    amount,
    referenceId,
    beneficiaryDetails,
    originalReferenceId = null,
    originalTxnId = null,
    extraMeta = {},
    onSuccess,
  }) => {
    const transferType = "IMPS";
    try {
      const decentroRes = await initiateTransfer({
        amount,
        transferType,
        referenceId,
        beneficiaryDetails,
      });
      const decentroTxnId =
        decentroRes?.decentroTxnId || decentroRes?.data?.decentroTxnId || null;
      const txnStatusRaw =
        decentroRes?.data?.transactionStatus || decentroRes?.transactionStatus || null;
      const normalizedTxnStatus = String(txnStatusRaw || "").trim().toUpperCase();
      const isSuccess = normalizedTxnStatus === "SUCCESS";

      const settlementMeta = {
        scheduler: "settlePaymentLinks",
        source: sourceType,
        originalReferenceId,
        originalTxnId,
        requestPayload: { amount, transferType, referenceId, beneficiaryDetails },
        providerResponse: decentroRes || null,
        ...extraMeta,
      };

      await createSettlementRecord({
        paymentLinkId: String(settlementRecordId),
        credentialId: credentialId ? String(credentialId) : null,
        amount,
        transferType,
        referenceId,
        decentroTxnId,
        txnStatus: normalizedTxnStatus || "UNKNOWN",
        beneficiaryName: beneficiaryDetails.name,
        beneficiaryAccountNumber: beneficiaryDetails.accountNumber,
        beneficiaryIfsc: beneficiaryDetails.ifscCode,
        settledAt: isSuccess ? new Date() : null,
        meta: settlementMeta,
      });

      await writeLedgerDebit({
        sourceType,
        referenceId,
        decentroTxnId,
        amount,
        credentialId,
        status: isSuccess ? "SUCCESS" : "PENDING",
        meta: settlementMeta,
      });

      if (isSuccess && typeof onSuccess === "function") {
        await onSuccess();
      }
    } catch (error) {
      const errorMeta = {
        scheduler: "settlePaymentLinks",
        source: sourceType,
        originalReferenceId,
        originalTxnId,
        requestPayload: { amount, transferType, referenceId, beneficiaryDetails },
        error: error?.decentroError || error?.message || "Settlement initiation failed",
        ...extraMeta,
      };

      await createSettlementRecord({
        paymentLinkId: String(settlementRecordId),
        credentialId: credentialId ? String(credentialId) : null,
        amount,
        transferType,
        referenceId,
        txnStatus: "ERROR",
        beneficiaryName: beneficiaryDetails.name,
        beneficiaryAccountNumber: beneficiaryDetails.accountNumber,
        beneficiaryIfsc: beneficiaryDetails.ifscCode,
        settledAt: null,
        meta: errorMeta,
      });

      await writeLedgerDebit({
        sourceType,
        referenceId,
        decentroTxnId: null,
        amount,
        credentialId,
        status: "FAILED",
        meta: errorMeta,
      });
    }
  };

  const paymentLinkTasks = successPaymentLinks.map(async (val) => {
    const referenceId = `STL_PYTL_${v4()}`;
    const beneficiaryDetails = await getBeneficiaryDetails(val.credentialId);

    await createSettlementAttempt({
      sourceType: "payment_link",
      settlementRecordId: val.id,
      credentialId: val.credentialId,
      amount: val.amount,
      referenceId,
      beneficiaryDetails,
      originalReferenceId: val.reference_id || null,
      originalTxnId: val.decentro_txn_id || null,
      onSuccess: async () => {
        await paymentLinks.update(
          { status: "SETTLEMENT_PROCESSING" },
          { where: { id: val.id } }
        );
      },
    });
  });

  const paymentQrTasks = successPaymentQrs.map(async (val) => {
    const referenceId = `STL_PYQR_${v4()}`;
    const beneficiaryDetails = await getBeneficiaryDetails(val.credentialId);

    await createSettlementAttempt({
      sourceType: "payment_qr",
      settlementRecordId: val.id,
      credentialId: val.credentialId,
      amount: val.amount,
      referenceId,
      beneficiaryDetails,
      originalReferenceId: val.reference_id || null,
      originalTxnId: val.decentro_txn_id || null,
      onSuccess: async () => {
        await paymentQrs.update(
          { status: "SETTLEMENT_PROCESSING" },
          { where: { id: val.id } }
        );
      },
    });
  });

  const enachExecutionTasks = successEnachExec.map(async (execution) => {
    const referenceId = `STL_ENEX_${v4()}`;
    const beneficiaryDetails = await getBeneficiaryDetails(execution.corporateUser);

    await createSettlementAttempt({
      sourceType: "enach_execution",
      settlementRecordId: execution.id,
      credentialId: execution.corporateUser,
      amount: execution.amount,
      referenceId,
      beneficiaryDetails,
      originalReferenceId: execution.execution_reference_id || null,
      originalTxnId: execution.decentro_txn_id || null,
      extraMeta: {
        executionReferenceId: execution.execution_reference_id || null,
        mandateReferenceId: execution.mandate_reference_id || null,
      },
      onSuccess: async () => {
        await EnachMandateExecution.update(
          { status: "SETTLEMENT_PROCESSING", settledDate: new Date() },
          { where: { id: execution.id } }
        );
      },
    });
  });

  await Promise.allSettled([
    ...paymentLinkTasks,
    ...paymentQrTasks,
    ...enachExecutionTasks,
  ]);
};
