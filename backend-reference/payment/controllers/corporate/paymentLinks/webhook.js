const {
  asyncHandler,
  getEnachMandateRegistrationStatus,
  updatePaymentLinkStatus,
  findPaymentLinkByIdentifiers,
  upsertUnifiedTransactionStatus,
  findPaymentQrByIdentifiers,
  updatePaymentQrStatus,
  findEnachMandateByReferenceId,
  updateEnachMandateByReferenceId,
  findEnachMandateExecutionByDecentroTxnId,
  findEnachMandateExecutionByReferenceId,
  updateEnachMandateExecutionStatus,
  ENACH_SUCCESS_STATUSES,
  ENACH_FAILED_STATUSES,
  customLog,
  logUnifiedSyncError,
  resolveExecutionStatus,
  DECENTRO_COLLECTION_CALLBACK_ACK,
  parseOccurredAt,
  normalizeCollectionType,
  isWebhookCollectionPayload,
  syncUnifiedCollectionWebhookStatus,
  handleLegacyPaymentStatusVerification,
  PAYMENT_SUCCESS_STATUSES,
  PAYMENT_FAILED_STATUSES,
  syncLedgerEntryStatus,
} = require("./common");

exports.verifyPayment = asyncHandler(async (req, res, next) => {
  try {
    if (!isWebhookCollectionPayload(req.body)) {
      return handleLegacyPaymentStatusVerification(req, res);
    }

    const reference_id = req.body?.reference_id
      ? String(req.body.reference_id).trim()
      : "";
    const decentroTxnId = req.body?.decentro_txn_id
      ? String(req.body.decentro_txn_id).trim()
      : "";
    const providerStatus = String(req.body?.transaction_status || "")
      .trim()
      .toUpperCase();
    const collectionType = normalizeCollectionType(req.body?.collection_type);
    const statusOccurredAt =
      parseOccurredAt(req.body?.callback_timestamp) || new Date();

    if (!providerStatus) {
      return res.status(400).json({
        status: false,
        message: "transaction_status is required",
        responseCode: "400",
        data: {},
      });
    }

    if (!reference_id && !decentroTxnId) {
      return res.status(400).json({
        status: false,
        message: "reference_id or decentro_txn_id is required",
        responseCode: "400",
        data: {},
      });
    }

    if (collectionType && !["payment_link", "dynamic_qr"].includes(collectionType)) {
      await customLog(req?.LogTraceId, "info", {
        context: "verifyPayment.unsupportedCollectionType",
        collection_type: collectionType,
        reference_id: reference_id || null,
        decentro_txn_id: decentroTxnId || null,
      });

      return res.status(200).json({response_code:DECENTRO_COLLECTION_CALLBACK_ACK});
    }

    let source = collectionType === "dynamic_qr" ? "payment_qr" : "payment_link";
    let localRecord = null;

    if (source === "payment_link") {
      localRecord = await findPaymentLinkByIdentifiers({
        reference_id: reference_id || null,
        decentro_txn_id: decentroTxnId || null,
      });
    }

    if (!collectionType && !localRecord) {
      source = "payment_qr";
      localRecord = await findPaymentQrByIdentifiers({
        reference_id: reference_id || null,
        decentro_txn_id: decentroTxnId || null,
      });
    }

    if (collectionType === "dynamic_qr") {
      localRecord = await findPaymentQrByIdentifiers({
        reference_id: reference_id || null,
        decentro_txn_id: decentroTxnId || null,
      });
    }

    if (!localRecord) {
      return res.status(404).json({
        status: false,
        message: "No local transaction found for the callback payload",
        responseCode: "404",
        data: {},
      });
    }

    const updateResult =
      source === "payment_link"
        ? await updatePaymentLinkStatus({
            reference_id: localRecord.reference_id,
            status: providerStatus,
            rawPayload: req.body,
            occurredAt: statusOccurredAt,
            skipUnifiedSync: true,
          })
        : await updatePaymentQrStatus({
            reference_id: localRecord.reference_id,
            status: providerStatus,
            rawPayload: req.body,
            occurredAt: statusOccurredAt,
            skipUnifiedSync: true,
          });

    const updatedRecord =
      source === "payment_link"
        ? updateResult?.paymentLink || null
        : updateResult?.paymentQr || null;

    if (updatedRecord && updateResult?.statusChanged) {
      await syncUnifiedCollectionWebhookStatus({
        req,
        source,
        record: updatedRecord,
        status: providerStatus,
        occurredAt: statusOccurredAt,
        rawPayload: req.body,
      });

      const ledgerStatus = PAYMENT_SUCCESS_STATUSES.has(providerStatus)
        ? "SUCCESS"
        : PAYMENT_FAILED_STATUSES.has(providerStatus)
        ? "FAILED"
        : null;
      if (ledgerStatus) {
        await syncLedgerEntryStatus(
          req,
          "verifyPayment.ledgerStatusSync",
          {
            transactionId: updatedRecord.decentro_txn_id,
            status: ledgerStatus,
            metadata: req.body && typeof req.body === "object"
              ? { webhookPayload: req.body }
              : null,
          },
          { source, referenceId: updatedRecord.reference_id, corporateUser: updatedRecord.credentialId }
        );
      }
    }

    return res.status(200).send(DECENTRO_COLLECTION_CALLBACK_ACK);
  } catch (err) {
    next(err);
  }
});

exports.verifyEnachExecutionWebhook = asyncHandler(async (req, res, next) => {
  try {
    const executionReferenceId = req.body?.Transaction_reference
      ? String(req.body.Transaction_reference).trim()
      : req.body?.transaction_reference
      ? String(req.body.transaction_reference).trim()
      : "";
    const decentroTxnId = req.body?.decentro_txn_id
      ? String(req.body.decentro_txn_id).trim()
      : "";
    const mandateReferenceId = req.body?.unique_mandate_reference_number
      ? String(req.body.unique_mandate_reference_number).trim()
      : "";
    const resolvedStatus = resolveExecutionStatus(
      req.body,
      req.body?.status || "INITIATED"
    );
    const statusOccurredAt =
      parseOccurredAt(req.body?.callback_timestamp) ||
      parseOccurredAt(req.body?.payment_date) ||
      new Date();

    if (!executionReferenceId && !decentroTxnId) {
      return res.status(400).json({
        status: false,
        message: "Transaction_reference or decentro_txn_id is required",
        responseCode: "400",
        data: {},
      });
    }

    const existingExecution =
      (await findEnachMandateExecutionByReferenceId(executionReferenceId)) ||
      (await findEnachMandateExecutionByDecentroTxnId(decentroTxnId));

    if (!existingExecution) {
      return res.status(404).json({
        status: false,
        message: "ENACH execution not found for the callback payload",
        response_code: "CB_E00009",
        data: {},
      });
    }

    const executionUpdateResult = await updateEnachMandateExecutionStatus({
      execution_reference_id:
        existingExecution.execution_reference_id || executionReferenceId || null,
      decentro_txn_id: decentroTxnId || existingExecution.decentro_txn_id || null,
      status: resolvedStatus,
      provider_response: req.body,
      occurredAt: statusOccurredAt,
    });

    const updatedExecution = executionUpdateResult?.execution || existingExecution;
    const mandate =
      updatedExecution?.mandate_reference_id || mandateReferenceId
        ? await findEnachMandateByReferenceId(
            updatedExecution?.mandate_reference_id || mandateReferenceId
          )
        : null;

    if (executionUpdateResult?.statusChanged) {
      try {
        await upsertUnifiedTransactionStatus({
          credentialId: updatedExecution.corporateUser,
          source: "enach_initiation",
          sourceTxnId: updatedExecution.execution_reference_id,
          sourceParentId: updatedExecution.mandate_reference_id || mandateReferenceId || null,
          providerTxnId:
            updatedExecution.decentro_txn_id || decentroTxnId || null,
          status: resolvedStatus,
          amount: updatedExecution.amount,
          customerName: mandate?.customer_name || null,
          customerPhone: mandate?.customer_phone || null,
          reference:
            updatedExecution.transaction_reference ||
            updatedExecution.execution_reference_id ||
            null,
          createdMilestoneAt: updatedExecution.createdAt || new Date(),
          occurredAt: statusOccurredAt,
          rawPayload:
            req.body && typeof req.body === "object"
              ? { webhookPayload: req.body }
              : null,
          event: {
            key: `status_${String(resolvedStatus).toLowerCase()}`,
            label: `Status updated to ${String(resolvedStatus).toUpperCase()}`,
            status: resolvedStatus,
            occurredAt: statusOccurredAt,
          },
        });
      } catch (unifiedSyncError) {
        await logUnifiedSyncError(
          req,
          "verifyEnachExecutionWebhook.statusSync",
          unifiedSyncError,
          {
            source: "enach_initiation",
            sourceTxnId: updatedExecution.execution_reference_id,
            sourceParentId: updatedExecution.mandate_reference_id || mandateReferenceId || null,
            corporateUser: updatedExecution.corporateUser,
          }
        );
      }

      const enachLedgerStatus = ENACH_SUCCESS_STATUSES.has(resolvedStatus)
        ? "SUCCESS"
        : ENACH_FAILED_STATUSES.has(resolvedStatus)
        ? "FAILED"
        : null;
      if (enachLedgerStatus) {
        await syncLedgerEntryStatus(
          req,
          "verifyEnachExecutionWebhook.ledgerStatusSync",
          {
            transactionId: updatedExecution.decentro_txn_id || decentroTxnId,
            status: enachLedgerStatus,
            metadata: req.body && typeof req.body === "object"
              ? { webhookPayload: req.body }
              : null,
          },
          {
            source: "enach_initiation",
            referenceId: updatedExecution.execution_reference_id,
            corporateUser: updatedExecution.corporateUser,
          }
        );
      }
    }

    return res.status(200).json({
      response_code: "CB_S00000"
    });
  } catch (err) {
    next(err);
  }
});

exports.verifyEnachMandate = asyncHandler(async (req, res, next) => {
  try {
    const reference_id = req.query.reference_id;

    console.log(reference_id)
    if (!reference_id) {
      return res.status(400).json({
        status: false,
        message: "Mandate reference_id is required",
        data: {
          status: "ERROR",
        },
        responseCode: "400",
      });
    }

    const mandate = await findEnachMandateByReferenceId(reference_id);
    if (!mandate) {
      return res.status(404).json({
        status: false,
        message: "ENACH mandate not found",
        data: {
          status: "ERROR",
        },
        responseCode: "404",
      });
    }

    let resolvedStatus = String(mandate.status || "PENDING").toUpperCase();
    const decentroTxnId =
      req.query.decentro_txn_id || mandate.decentro_txn_id || null;
    const decentroMandateId = req.query.decentro_mandate_id || null;

    if (decentroTxnId || decentroMandateId) {
      try {
        const result = await getEnachMandateRegistrationStatus({
          decentro_txn_id: decentroTxnId,
          decentro_mandate_id: decentroMandateId,
        });

        const providerStatus =
          result?.data?.mandate_status ||
          result?.data?.transaction_status ||
          result?.data?.status;

        if (providerStatus) {
          resolvedStatus = String(providerStatus).toUpperCase();
          await updateEnachMandateByReferenceId(reference_id, {
            status: resolvedStatus,
          });
        }
      } catch {
        // Keep DB status as fallback if provider verification is unavailable.
      }
    }

    const successStatuses = ["SUCCESS", "ACTIVE", "REGISTERED"];
    const pendingStatuses = ["PENDING", "INITIATED"];
    const failedStatuses = [
      "FAILURE",
      "FAILED",
      "ERROR",
      "REJECTED",
      "EXPIRED",
      "INACTIVE",
      "SESSION_TIMEOUT",
      "SESSION_CANCELLED",
      "CANCELLED",
      "CANCELED",
    ];

    if (failedStatuses.includes(resolvedStatus)) {
      return res.status(400).json({
        status: false,
        message: "ENACH mandate verification failed",
        responseCode: "400",
        data: {
          status: resolvedStatus,
          reference_id,
          decentro_txn_id: decentroTxnId,
        },
      });
    }

    return res.status(200).json({
      status: true,
      message:
        successStatuses.includes(resolvedStatus)
          ? "ENACH mandate verified successfully"
          : "ENACH mandate status fetched successfully",
      responseCode: "000",
      data: {
        status: resolvedStatus,
        status_type: successStatuses.includes(resolvedStatus)
          ? "success"
          : pendingStatuses.includes(resolvedStatus)
          ? "pending"
          : "unknown",
        reference_id,
        decentro_txn_id: decentroTxnId,
      },
    });
  } catch (err) {
    next(err);
  }
});
