const {
  asyncHandler,
  registerEnachMandate,
  getEnachMandateRegistrationStatus,
  manageEnachMandateAction,
  executeEnachMandate,
  getEnachMandateExecutionStatus,
  createPendingUnifiedTransaction,
  upsertUnifiedTransactionStatus,
  ErrorResponse,
  addEnachMandate,
  findAllEnachMandates,
  findEnachMandateByReferenceId,
  updateEnachMandateByReferenceId,
  addEnachMandateExecution,
  findAllEnachMandateExecutions,
  updateEnachMandateExecutionStatus,
  ENACH_SUCCESS_STATUSES,
  ENACH_FAILED_STATUSES,
  ENACH_SAME_DAY_CUTOFF_HOUR_IST,
  ENACH_EXECUTION_TERMINAL_STATUSES,
  ENACH_EXECUTION_PENDING_STATUSES,
  logUnifiedSyncError,
  syncLedgerEntry,
  syncLedgerEntryStatus,
  getEnachStatusType,
  customLog,
  normalizeFrequency,
  normalizeCategoryCode,
  resolveExecutionStatus,
  getISTDateTimeParts,
  normalizeToISTYmd,
  addDaysToYmd,
  buildEnachInitiationGuard,
} = require("./common");

exports.createEnachMandate = asyncHandler(async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      account_number,
      account_type,
      bank_code,
      authentication_mode,
      amount_rule,
      category_code,
      amount,
      frequency,
      start_date,
      end_date,
    } = req.body;

    if (!customer_name || !String(customer_name).trim()) {
      throw new ErrorResponse("customer_name is required", 400);
    }

    if (!customer_phone || !String(customer_phone).trim()) {
      throw new ErrorResponse("customer_phone is required", 400);
    }

    if (!account_number || !String(account_number).trim()) {
      throw new ErrorResponse("account_number is required", 400);
    }

    if (!account_type || !String(account_type).trim()) {
      throw new ErrorResponse("account_type is required", 400);
    }

    if (!bank_code || !String(bank_code).trim()) {
      throw new ErrorResponse("bank_code is required", 400);
    }

    if (!authentication_mode || !String(authentication_mode).trim()) {
      throw new ErrorResponse("authentication_mode is required", 400);
    }

    if (!amount_rule || !String(amount_rule).trim()) {
      throw new ErrorResponse("amount_rule is required", 400);
    }

    if (!category_code || !String(category_code).trim()) {
      throw new ErrorResponse("category_code is required", 400);
    }

    const normalizedFrequency = normalizeFrequency(frequency);
    if (!normalizedFrequency) {
      throw new ErrorResponse("Invalid frequency value", 400);
    }

    const normalizedCategoryCode = normalizeCategoryCode(category_code);
    if (!normalizedCategoryCode) {
      throw new ErrorResponse("Invalid category_code value", 400);
    }

    const result = await registerEnachMandate({
      customer_name,
      customer_phone,
      customer_email,
      account_number,
      account_type,
      bank_code,
      authentication_mode,
      amount,
      amount_rule: String(amount_rule).trim().toLowerCase(),
      category_code: normalizedCategoryCode,
      end_date,
      frequency: normalizedFrequency,
      start_date,
      uistream: false,
    });

    const decentroMandateId =
      result?.data?.decentro_mandate_id ||
      result?.providerResponse?.data?.decentro_mandate_id ||
      null;

    await addEnachMandate({
      customer_name: String(customer_name).trim(),
      customer_phone: String(customer_phone).trim(),
      customer_email: customer_email ? String(customer_email).trim() : null,
      account_number: String(account_number).trim(),
      account_type: String(account_type).trim().toUpperCase(),
      bank_code: String(bank_code).trim().toUpperCase(),
      authentication_mode: String(authentication_mode).trim(),
      amount,
      frequency: normalizedFrequency,
      start_date,
      end_date,
      amount_rule: String(amount_rule).trim().toLowerCase(),
      category_code: normalizedCategoryCode,
      reference_id: result.reference_id,
      decentro_txn_id: result.decentro_txn_id,
      decentro_mandate_id: decentroMandateId,
      status: result.mandate_status || result.status || "PENDING",
      uistreams:false,
      corporateUser: req.user.id,
      mandate_link: result.mandate_link,
    });

    return res.status(200).json({
      status: true,
      message: "ENACH mandate created successfully",
      responseCode: "000",
      data: {
        reference_id: result.reference_id,
        decentro_txn_id: result.decentro_txn_id,
        decentro_mandate_id: decentroMandateId,
        status: result.mandate_status || result.status,
        mandate_link: result.mandate_link,
        message: result.message,
        providerResponse: result.providerResponse,
      },
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", { message: "Error in createEnachMandate", error: err?.message });
      if(err?.response?.data?.response_key === "error_invalid_bankcode" || err?.response?.data?.message?.toLowerCase()?.includes("bank") ){
        return res.status(err.statusCode || 400).json({
          status: false,
          message: "Please enter a valid bank code.",
          responseCode: err.responseCode || "001",
          data: {},
        });
      }
      return res.status(err.statusCode || 400).json({
        status: false,
        message: err?.response?.data?.message || "Something went wrong",
        responseCode: err.responseCode || "001",
        data: {},
      });
    
  }
});

exports.getEnachMandates = asyncHandler(async (req, res) => {
  const corporateUser = req.user?.id;
  if (!corporateUser) {
    return res.status(400).json({
      status: false,
      message: "Credential (user) id missing",
      responseCode: "001",
      data: {},
    });
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const status = req.query.status || null;
  const search = req.query.search || null;

  const { count, rows } = await findAllEnachMandates({
    corporateUser,
    page: page - 1,
    limit,
    status,
    search,
  });

  return res.status(200).json({
    status: true,
    message: "ENACH mandates fetched successfully",
    responseCode: "000",
    data: {
      rows,
      count,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  });
});

exports.getEnachMandateStatus = asyncHandler(async (req, res) => {
  const reference_id = req.params.reference_id;
  const corporateUser = req.user?.id;

  if (!corporateUser) {
    return res.status(400).json({
      status: false,
      message: "Credential (user) id missing",
      responseCode: "001",
      data: {},
    });
  }

  if (!reference_id) {
    return res.status(400).json({
      status: false,
      message: "Mandate reference_id is required",
      responseCode: "400",
      data: {},
    });
  }

  const mandate = await findEnachMandateByReferenceId(reference_id);
  if (!mandate || Number(mandate.corporateUser) !== Number(corporateUser)) {
    return res.status(404).json({
      status: false,
      message: "ENACH mandate not found",
      responseCode: "404",
      data: {},
    });
  }

  const decentroTxnId = mandate?.decentro_txn_id
    ? String(mandate.decentro_txn_id).trim()
    : "";

  if (!decentroTxnId) {
    return res.status(400).json({
      status: false,
      message: "Mandate cannot be verified because decentro_txn_id is missing",
      responseCode: "400",
      data: {
        reference_id,
      },
    });
  }

  let providerResponse = null;
  let resolvedStatus = String(mandate.status || "PENDING").toUpperCase();
  let decentroMandateId = null;

  try {
    providerResponse = await getEnachMandateRegistrationStatus({
      decentro_txn_id: decentroTxnId,
    });

    const providerStatus = String(
      providerResponse?.data?.mandate_status ||
      providerResponse?.data?.transaction_status ||
      providerResponse?.data?.status ||
      ""
    ).toUpperCase();

    if (providerStatus) {
      resolvedStatus = providerStatus;
    }

    decentroMandateId = providerResponse?.data?.decentro_mandate_id || null;
  } catch (providerErr) {
    customLog(req?.LogTraceId, "error", { message: "Error fetching ENACH mandate status from provider", error: providerErr?.message });
    // Use DB status if provider call fails.
  }

  await updateEnachMandateByReferenceId(reference_id, {
    status: resolvedStatus,
    decentro_mandate_id: decentroMandateId || mandate?.decentro_mandate_id || null,
  });

  const status_type = getEnachStatusType(resolvedStatus);

  return res.status(200).json({
    status: true,
    message: "ENACH mandate status fetched successfully",
    responseCode: "000",
    data: {
      status: resolvedStatus,
      status_type,
      reference_id,
      decentro_txn_id: decentroTxnId,
      decentro_mandate_id: decentroMandateId,
      providerResponse,
    },
  });
});

exports.manageEnachMandate = asyncHandler(async (req, res) => {
  const reference_id = req.params.reference_id;
  const corporateUser = req.user?.id;
  const requestedAction = String(req.body?.action || "CANCEL")
    .trim()
    .toUpperCase();
  const action = requestedAction === "RESUME" ? "UNPAUSE" : requestedAction;

  if (!corporateUser) {
    return res.status(400).json({
      status: false,
      message: "Credential (user) id missing",
      responseCode: "001",
      data: {},
    });
  }

  if (!reference_id || !String(reference_id).trim()) {
    return res.status(400).json({
      status: false,
      message: "Mandate reference_id is required",
      responseCode: "400",
      data: {},
    });
  }

  if (!["CANCEL", "PAUSE", "UNPAUSE"].includes(action)) {
    return res.status(400).json({
      status: false,
      message:
        "Invalid action type provided. Accepted values are CANCEL, PAUSE, UNPAUSE or RESUME.",
      responseCode: "400",
      data: {},
    });
  }

  const mandate = await findEnachMandateByReferenceId(reference_id);
  if (!mandate || Number(mandate.corporateUser) !== Number(corporateUser)) {
    return res.status(404).json({
      status: false,
      message: "ENACH mandate not found",
      responseCode: "404",
      data: {},
    });
  }

  const decentroTxnId = mandate?.decentro_txn_id;
  if (!decentroTxnId) {
    return res.status(400).json({
      status: false,
      message: "Mandate cannot be managed because decentro_txn_id is missing",
      responseCode: "400",
      data: {
        reference_id,
      },
    });
  }

  const statusResult = await getEnachMandateRegistrationStatus({
    decentro_txn_id: decentroTxnId,
  });

  const liveStatus = String(
    statusResult?.data?.mandate_status || mandate.status || ""
  ).toUpperCase();

  const decentroMandateId =
    statusResult?.data?.decentro_mandate_id ||
    mandate?.decentro_mandate_id ||
    req.body?.decentro_mandate_id ||
    null;

  if (!decentroMandateId) {
    return res.status(400).json({
      status: false,
      message: "decentro_mandate_id not found for the mandate",
      responseCode: "400",
      data: {
        reference_id,
        decentro_txn_id: decentroTxnId,
      },
    });
  }

  const eligibilityByAction = {
    CANCEL: ["ACTIVE", "REGISTERED"],
    PAUSE: ["ACTIVE", "REGISTERED"],
    UNPAUSE: ["PAUSED"],
  };
  const allowedStatuses = eligibilityByAction[action] || ["ACTIVE", "REGISTERED"];
  if (!allowedStatuses.includes(liveStatus)) {
    return res.status(400).json({
      status: false,
      message: `Mandate must be in ${allowedStatuses.join(
        " or "
      )} status to ${action.toLowerCase()}.`,
      responseCode: "400",
      data: {
        status: liveStatus,
        reference_id,
        decentro_txn_id: decentroTxnId,
        decentro_mandate_id: decentroMandateId,
      },
    });
  }

  const manageResult = await manageEnachMandateAction({
    action,
    decentro_mandate_id: decentroMandateId,
  });

  const resolvedStatus = String(
    manageResult?.mandate_status ||
      {
        CANCEL: "CANCELLATION_PENDING",
        PAUSE: "PAUSE_PENDING",
        UNPAUSE: "UNPAUSE_PENDING",
      }[action] ||
      mandate.status
  ).toUpperCase();

  await updateEnachMandateByReferenceId(reference_id, {
    status: resolvedStatus,
    decentro_mandate_id: decentroMandateId,
  });

  return res.status(200).json({
    status: true,
    message: manageResult?.message || "ENACH mandate action processed successfully",
    responseCode: "000",
    data: {
      action,
      requested_action: requestedAction,
      status: resolvedStatus,
      message: manageResult?.message,
      reference_id,
      decentro_txn_id: decentroTxnId,
      decentro_mandate_id:
        manageResult?.decentro_mandate_id || decentroMandateId,
      mandate_status_description: manageResult?.mandate_status_description,
      response_key: manageResult?.response_key,
      provider_reference_id: manageResult?.reference_id,
    },
  });
});

exports.executeEnachMandatePayment = asyncHandler(async (req, res) => {
  const reference_id = req.params.reference_id;
  const corporateUser = req.user?.id;
  const { amount, debit_date, split_settlement_rule_urn } = req.body || {};

  if (!corporateUser) {
    return res.status(400).json({
      status: false,
      message: "Credential (user) id missing",
      responseCode: "001",
      data: {},
    });
  }

  if (!reference_id || !String(reference_id).trim()) {
    return res.status(400).json({
      status: false,
      message: "Mandate reference_id is required",
      responseCode: "400",
      data: {},
    });
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({
      status: false,
      message: "Valid amount is required",
      responseCode: "400",
      data: {},
    });
  }

  const mandate = await findEnachMandateByReferenceId(reference_id);
  if (!mandate || Number(mandate.corporateUser) !== Number(corporateUser)) {
    return res.status(404).json({
      status: false,
      message: "ENACH mandate not found",
      responseCode: "404",
      data: {},
    });
  }

  const decentroTxnId = mandate?.decentro_txn_id
    ? String(mandate.decentro_txn_id).trim()
    : "";
  if (!decentroTxnId) {
    return res.status(400).json({
      status: false,
      message: "Mandate cannot be executed because decentro_txn_id is missing",
      responseCode: "400",
      data: {
        reference_id,
      },
    });
  }

  const statusResult = await getEnachMandateRegistrationStatus({
    decentro_txn_id: decentroTxnId,
  });
  const liveStatus = String(
    statusResult?.data?.mandate_status || mandate.status || ""
  ).toUpperCase();
  const decentroMandateId =
    statusResult?.data?.decentro_mandate_id ||
    mandate?.decentro_mandate_id ||
    null;

  if (!decentroMandateId) {
    return res.status(400).json({
      status: false,
      message: "decentro_mandate_id not found for the mandate",
      responseCode: "400",
      data: {
        reference_id,
        decentro_txn_id: decentroTxnId,
      },
    });
  }

  if (!["ACTIVE", "REGISTERED"].includes(liveStatus)) {
    return res.status(400).json({
      status: false,
      message:
        "Mandate must be in ACTIVE or REGISTERED status to initiate payment.",
      responseCode: "400",
      data: {
        status: liveStatus,
        reference_id,
        decentro_txn_id: decentroTxnId,
        decentro_mandate_id: decentroMandateId,
      },
    });
  }

  const initiationGuard = await buildEnachInitiationGuard({
    reference_id,
    corporateUser,
    frequency: mandate?.frequency,
  });

  if (!initiationGuard.can_initiate) {
    return res.status(400).json({
      status: false,
      message: initiationGuard.message,
      responseCode: "400",
      data: {
        reference_id,
        frequency: initiationGuard.frequency,
        last_counted_execution_at: initiationGuard.last_counted_execution_at,
        next_allowed_at: initiationGuard.next_allowed_at,
      },
    });
  }

  const nowIST = getISTDateTimeParts(new Date());
  const todayIST = nowIST.ymd;
  const mandateCreatedDateIST = normalizeToISTYmd(mandate?.createdAt);
  const requestedDebitDateIST = debit_date ? normalizeToISTYmd(debit_date) : null;
  const mandateStartDateIST = normalizeToISTYmd(mandate?.start_date);
  const minDebitDateFromMandateStart = mandateStartDateIST
    ? addDaysToYmd(mandateStartDateIST, 2)
    : null;

  if (!requestedDebitDateIST) {
    return res.status(400).json({
      status: false,
      message:
        "Debit date should have at least 2 days gap from the mandate start date. Please provide a valid Debit date. Hint: debit_date(string), format: yyyy-mm-dd",
      responseCode: "400",
      data: {},
    });
  }

  if (requestedDebitDateIST && requestedDebitDateIST < todayIST) {
    return res.status(400).json({
      status: false,
      message: "debit_date cannot be in the past.",
      responseCode: "400",
      data: {},
    });
  }

  if (
    minDebitDateFromMandateStart &&
    requestedDebitDateIST < minDebitDateFromMandateStart
  ) {
    return res.status(400).json({
      status: false,
      message:
        "Debit date should have at least 2 days gap from the mandate start date. Please provide a valid Debit date. Hint: debit_date(string), format: yyyy-mm-dd",
      responseCode: "400",
      data: {
        min_debit_date: minDebitDateFromMandateStart,
        mandate_start_date: mandateStartDateIST,
      },
    });
  }

  if (
    requestedDebitDateIST &&
    mandateCreatedDateIST &&
    requestedDebitDateIST === mandateCreatedDateIST
  ) {
    return res.status(400).json({
      status: false,
      message:
        "Same-day registration and presentation are not allowed. Please choose a future debit date.",
      responseCode: "400",
      data: {},
    });
  }

  if (
    requestedDebitDateIST === todayIST &&
    nowIST.hour >= ENACH_SAME_DAY_CUTOFF_HOUR_IST
  ) {
    return res.status(400).json({
      status: false,
      message:
        "Same-day debit initiation is allowed only before 11:00 AM IST. Please choose a future debit date.",
      responseCode: "400",
      data: {},
    });
  }

  const effectiveDebitDateIST = requestedDebitDateIST;

  if (decentroMandateId && decentroMandateId !== mandate?.decentro_mandate_id) {
    await updateEnachMandateByReferenceId(reference_id, {
      decentro_mandate_id: decentroMandateId,
    });
  }

  const executeResult = await executeEnachMandate({
    amount: numericAmount,
    decentro_mandate_id: decentroMandateId,
    debit_date: effectiveDebitDateIST,
    split_settlement_rule_urn,
  });
  const executionProviderResponse =
    executeResult?.providerResponse &&
    typeof executeResult.providerResponse === "object"
      ? executeResult.providerResponse
      : { raw_provider_response: executeResult?.providerResponse || null };
  const resolvedStatus = resolveExecutionStatus(
    executionProviderResponse,
    "INITIATED"
  );
  const isTerminalStatus = ENACH_EXECUTION_TERMINAL_STATUSES.has(resolvedStatus);
  const processedOrFailedAt = isTerminalStatus ? new Date() : null;
  const createdExecution = await addEnachMandateExecution({
    execution_reference_id: executeResult.reference_id,
    mandate_reference_id: reference_id,
    enach_mandate_id: mandate.id || null,
    corporateUser,
    decentro_mandate_id:
      executeResult.decentro_mandate_id || decentroMandateId || null,
    decentro_txn_id: executeResult.decentro_txn_id || null,
    transaction_reference: null,
    payment_date: executeResult.payment_date || effectiveDebitDateIST || null,
    amount: numericAmount,
    status: resolvedStatus,
    processed_or_failed_at: processedOrFailedAt,
    provider_response: {
      ...executionProviderResponse,
      request_payload: {
        split_settlement_rule_urn:
          executeResult?.split_settlement_rule_urn ||
          (split_settlement_rule_urn ? String(split_settlement_rule_urn).trim() : null),
        debit_date: effectiveDebitDateIST,
      },
    },
  });

  try {
    await createPendingUnifiedTransaction({
      credentialId: corporateUser,
      source: "enach_initiation",
      sourceTxnId: executeResult.reference_id,
      sourceParentId: reference_id,
      providerTxnId: executeResult.decentro_txn_id || null,
      amount: numericAmount,
      customerName: mandate.customer_name || null,
      customerPhone: mandate.customer_phone || null,
      reference: executeResult.reference_id || null,
      createdMilestoneAt: createdExecution?.createdAt || new Date(),
      rawPayload:
        executionProviderResponse &&
        typeof executionProviderResponse === "object"
          ? { providerResponse: executionProviderResponse }
          : null,
    });

    await upsertUnifiedTransactionStatus({
      credentialId: corporateUser,
      source: "enach_initiation",
      sourceTxnId: executeResult.reference_id,
      sourceParentId: reference_id,
      providerTxnId: executeResult.decentro_txn_id || null,
      status: resolvedStatus,
      amount: numericAmount,
      customerName: mandate.customer_name || null,
      customerPhone: mandate.customer_phone || null,
      reference: executeResult.reference_id || null,
      createdMilestoneAt: createdExecution?.createdAt || new Date(),
      occurredAt: processedOrFailedAt || createdExecution?.createdAt || new Date(),
      rawPayload:
        executionProviderResponse &&
        typeof executionProviderResponse === "object"
          ? { providerResponse: executionProviderResponse }
          : null,
      event: {
        key: `status_${String(resolvedStatus).toLowerCase()}`,
        label: `Status updated to ${String(resolvedStatus).toUpperCase()}`,
        status: resolvedStatus,
        occurredAt: processedOrFailedAt || createdExecution?.createdAt || new Date(),
      },
    });
  } catch (unifiedSyncError) {
    await logUnifiedSyncError(req, "executeEnachMandatePayment", unifiedSyncError, {
      source: "enach_initiation",
      sourceTxnId: executeResult.reference_id,
      sourceParentId: reference_id,
      corporateUser,
    });
  }

  await syncLedgerEntry(
    req,
    "executeEnachMandatePayment",
    {
      transactionId: executeResult.decentro_txn_id || null,
      type: "CREDIT",
      amount: numericAmount,
      source: "ENACH_EXEC",
      status: "PENDING",
      referenceId: executeResult.reference_id || null,
      credentialId: corporateUser,
      metadata: {
        mandateReferenceId: reference_id,
        debitDate: effectiveDebitDateIST,
        splitSettlementRuleUrn:
          executeResult?.split_settlement_rule_urn ||
          (split_settlement_rule_urn ? String(split_settlement_rule_urn).trim() : null),
        providerResponse: executionProviderResponse || null,
      },
    },
    {
      source: "ENACH_EXEC",
      transactionId: executeResult.decentro_txn_id || null,
      sourceParentId: reference_id,
      corporateUser,
    }
  );

  return res.status(200).json({
    status: true,
    message: executeResult?.message || "Mandate payment initiated successfully",
    responseCode: "000",
    data: {
      reference_id,
      execution_reference_id: executeResult.reference_id,
      status: resolvedStatus,
      amount: numericAmount,
      payment_date: executeResult.payment_date || effectiveDebitDateIST || null,
      split_settlement_rule_urn:
        executeResult?.split_settlement_rule_urn ||
        (split_settlement_rule_urn ? String(split_settlement_rule_urn).trim() : null),
      decentro_txn_id: executeResult.decentro_txn_id || null,
      decentro_mandate_id:
        executeResult.decentro_mandate_id || decentroMandateId || null,
      response_key: executeResult.response_key || null,
    },
  });
});

exports.getEnachMandateExecutions = asyncHandler(async (req, res) => {
  const reference_id = req.params.reference_id;
  const corporateUser = req.user?.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

  if (!corporateUser) {
    return res.status(400).json({
      status: false,
      message: "Credential (user) id missing",
      responseCode: "001",
      data: {},
    });
  }

  if (!reference_id || !String(reference_id).trim()) {
    return res.status(400).json({
      status: false,
      message: "Mandate reference_id is required",
      responseCode: "400",
      data: {},
    });
  }

  const mandate = await findEnachMandateByReferenceId(reference_id);
  if (!mandate || Number(mandate.corporateUser) !== Number(corporateUser)) {
    return res.status(404).json({
      status: false,
      message: "ENACH mandate not found",
      responseCode: "404",
      data: {},
    });
  }

  const initialResult = await findAllEnachMandateExecutions({
    mandate_reference_id: reference_id,
    corporateUser,
    page: page - 1,
    limit,
  });

  await Promise.all(
    (initialResult?.rows || []).map(async (executionRow) => {
      const currentStatus = String(executionRow.status || "").toUpperCase();
      if (!ENACH_EXECUTION_PENDING_STATUSES.has(currentStatus)) {
        return;
      }

      try {
        const providerStatusResponse = await getEnachMandateExecutionStatus({
          reference_id: executionRow.execution_reference_id,
          decentro_txn_id: executionRow.decentro_txn_id,
          decentro_mandate_id: executionRow.decentro_mandate_id,
        });

        const resolvedStatus = resolveExecutionStatus(
          providerStatusResponse,
          currentStatus
        );
        const nextDecentroTxnId =
          providerStatusResponse?.decentro_txn_id ||
          providerStatusResponse?.decentro_transaction_id ||
          providerStatusResponse?.data?.decentro_txn_id ||
          executionRow.decentro_txn_id;
        const executionUpdateResult = await updateEnachMandateExecutionStatus({
          execution_reference_id: executionRow.execution_reference_id,
          decentro_txn_id: nextDecentroTxnId || null,
          status: resolvedStatus,
          provider_response: providerStatusResponse || {},
        });
        const updatedExecution =
          executionUpdateResult?.execution || executionRow;

        const statusOccurredAt =
          updatedExecution?.processed_or_failed_at ||
          updatedExecution?.successOrFailDate ||
          executionRow.processed_or_failed_at ||
          updatedExecution?.createdAt ||
          executionRow.createdAt ||
          new Date();
        try {
          if (executionUpdateResult?.statusChanged) {
            await upsertUnifiedTransactionStatus({
              credentialId: corporateUser,
              source: "enach_initiation",
              sourceTxnId: executionRow.execution_reference_id,
              sourceParentId: executionRow.mandate_reference_id || reference_id,
              providerTxnId: nextDecentroTxnId || null,
              status: resolvedStatus,
              amount: executionRow.amount,
              customerName: mandate.customer_name || null,
              customerPhone: mandate.customer_phone || null,
              reference:
                executionRow.transaction_reference ||
                executionRow.execution_reference_id ||
                null,
              createdMilestoneAt: executionRow.createdAt || new Date(),
              occurredAt: statusOccurredAt,
              rawPayload:
                providerStatusResponse && typeof providerStatusResponse === "object"
                  ? { providerResponse: providerStatusResponse }
                  : null,
              event: {
                key: `status_${String(resolvedStatus).toLowerCase()}`,
                label: `Status updated to ${String(resolvedStatus).toUpperCase()}`,
                status: resolvedStatus,
                occurredAt: statusOccurredAt,
              },
            });
          }
        } catch (unifiedSyncError) {
          await logUnifiedSyncError(
            req,
            "getEnachMandateExecutions.statusSync",
            unifiedSyncError,
            {
              source: "enach_initiation",
              sourceTxnId: executionRow.execution_reference_id,
              sourceParentId: executionRow.mandate_reference_id || reference_id,
              corporateUser,
            }
          );
        }

        if (executionUpdateResult?.statusChanged) {
          const enachLedgerStatus = ENACH_SUCCESS_STATUSES.has(resolvedStatus)
            ? "SUCCESS"
            : ENACH_FAILED_STATUSES.has(resolvedStatus)
            ? "FAILED"
            : null;
          if (enachLedgerStatus) {
            await syncLedgerEntryStatus(
              req,
              "getEnachMandateExecutions.ledgerStatusSync",
              {
                transactionId: nextDecentroTxnId || executionRow.decentro_txn_id,
                status: enachLedgerStatus,
              },
              {
                source: "enach_initiation",
                referenceId: executionRow.execution_reference_id,
                corporateUser,
              }
            );
          }
        }
      } catch (syncErr) {
        customLog(req?.LogTraceId, "error", { message: "Error syncing ENACH execution status from provider", error: syncErr?.message });
        // Keep persisted status if provider status sync fails.
      }
    })
  );

  const { count, rows } = await findAllEnachMandateExecutions({
    mandate_reference_id: reference_id,
    corporateUser,
    page: page - 1,
    limit,
  });

  const initiationGuard = await buildEnachInitiationGuard({
    reference_id,
    corporateUser,
    frequency: mandate?.frequency,
  });

  return res.status(200).json({
    status: true,
    message: "ENACH mandate executions fetched successfully",
    responseCode: "000",
    data: {
      rows,
      count,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      initiation_guard: initiationGuard,
    },
  });
});
