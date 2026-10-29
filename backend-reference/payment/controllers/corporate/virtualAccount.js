const asyncHandler = require("../../middlewares/async");
const { customLog } = require("../../utils/loggerHelper");
const { v4: uuidv4 } = require("uuid");
const {
  loadVirtualAccount,
  unloadVirtualAccount,
  getVALoadUnloadStatus,
} = require("../../utils/decentroGateway");
const {
  create: createVATxn,
  updateOnSuccess,
  updateOnFailure,
  findOne: findOneVATxn,
  findAll: findAllVATxns,
} = require("../../models/use-cases/vaLoadUnloadTransaction");
const {
  createEntry: createLedgerEntry,
  updateEntryStatus: updateLedgerStatus,
  getAvailableBalance,
} = require("../../models/use-cases/transactionLedger");

const generateRefId = (type) =>
  `VA_${type}_${uuidv4().replace(/-/g, "").slice(0, 20).toUpperCase()}`;

const interpretStatus = (decentroResponse) => {
  const txnStatus =
    decentroResponse?.data?.transactionStatus ||
    decentroResponse?.transactionStatus;
  if (typeof txnStatus !== "string") return "PENDING";
  const v = txnStatus.toLowerCase();
  if (v === "success" || v === "completed") return "COMPLETED";
  if (v === "failure" || v === "failed") return "FAILED";
  return "PENDING";
};

const ledgerStatusFromVA = (vaStatus) =>
  vaStatus === "COMPLETED" ? "SUCCESS" : vaStatus === "FAILED" ? "FAILED" : "PENDING";

const handleLoadUnload = async (req, res, type) => {
  const credentialId = req.user.id;
  const corporateUserId = req.user.corporateId;
  const { virtualAccountNumber, amount, purposeMessage, remarks } = req.body;

  if (!virtualAccountNumber || amount === undefined || amount === null) {
    return res.status(400).json({
      status: false,
      message: "virtualAccountNumber and amount are required",
      responseCode: "400",
      data: {},
    });
  }
  const numericAmount = parseFloat(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({
      status: false,
      message: "amount must be a positive number",
      responseCode: "400",
      data: {},
    });
  }

  if (type === "UNLOAD") {
    const availableBalance = await getAvailableBalance(credentialId);
    if (numericAmount > availableBalance) {
      return res.status(400).json({
        status: false,
        message: "Insufficient balance. Your available balance is ₹" + availableBalance.toFixed(2),
        responseCode: "400",
        data: { availableBalance },
      });
    }
  }

  const referenceId = generateRefId(type);
  const ledgerType = type === "LOAD" ? "CREDIT" : "DEBIT";
  const ledgerSource = type === "LOAD" ? "VA_LOAD" : "VA_UNLOAD";

  const record = await createVATxn({
    credentialId,
    corporateUserId,
    type,
    virtualAccountNumber,
    amount: numericAmount,
    referenceId,
    status: "PENDING",
    purposeMessage,
    remarks,
    requestPayload: { virtualAccountNumber, amount: numericAmount, purposeMessage, remarks, type },
    transactionDate: new Date(),
  });

  await createLedgerEntry({
    credentialId,
    transactionId: referenceId,
    type: ledgerType,
    amount: numericAmount,
    source: ledgerSource,
    status: "PENDING",
    referenceId,
    remarks: remarks || `VA ${type.toLowerCase()} for ${virtualAccountNumber}`,
  });

  let decentroResponse;
  try {
    const fn = type === "LOAD" ? loadVirtualAccount : unloadVirtualAccount;
    decentroResponse = await fn({
      credentialId,
      corporateUserId,
      referenceId,
      virtualAccountNumber,
      amount: numericAmount,
      purposeMessage,
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", { message: `Error in handleLoadUnload (${type})`, error: err?.message });
    await updateOnFailure(record.id, {
      errorPayload: err.decentroError || { message: err.message },
      providerMessage: err.message,
    });
    await updateLedgerStatus(referenceId, "FAILED");
    return res.status(400).json({
      status: false,
      message: err.message,
      responseCode: "400",
      data: err.decentroError || {},
    });
  }

  const finalStatus = interpretStatus(decentroResponse);
  const decentroTxnId = decentroResponse?.decentroTxnId || decentroResponse?.data?.decentroTxnId;
  const bankReferenceNumber = decentroResponse?.data?.bankReferenceNumber;
  const providerMessage = decentroResponse?.message || decentroResponse?.data?.message;

  await updateOnSuccess(record.id, {
    decentroTxnId,
    status: finalStatus,
    providerMessage,
    bankReferenceNumber,
    responsePayload: decentroResponse,
  });
  await updateLedgerStatus(referenceId, ledgerStatusFromVA(finalStatus));

  return res.status(200).json({
    status: true,
    message: type === "LOAD" ? "Funds loaded successfully" : "Funds unloaded successfully",
    responseCode: "000",
    data: {
      id: record.id,
      referenceId,
      decentroTxnId,
      transactionStatus: finalStatus,
      amount: numericAmount,
      type,
    },
  });
};

exports.loadFunds = asyncHandler(async (req, res) => handleLoadUnload(req, res, "LOAD"));
exports.unloadFunds = asyncHandler(async (req, res) => handleLoadUnload(req, res, "UNLOAD"));

exports.getLoadUnloadById = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const { id } = req.params;
  const record = await findOneVATxn(id, credentialId);
  if (!record) {
    return res.status(404).json({
      status: false,
      message: "VA load/unload transaction not found",
      responseCode: "404",
      data: {},
    });
  }
  return res.status(200).json({
    status: true,
    message: "Transaction fetched",
    responseCode: "000",
    data: record,
  });
});

exports.listLoadUnload = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const { type, status, from, to, page, itemsPerPage } = req.query;
  const result = await findAllVATxns({
    credentialId,
    type,
    status,
    from,
    to,
    page: page ? parseInt(page, 10) : 1,
    itemsPerPage: itemsPerPage ? parseInt(itemsPerPage, 10) : 10,
  });
  return res.status(200).json({
    status: true,
    message: "Transactions fetched",
    responseCode: "000",
    data: { count: result.count, rows: result.rows },
  });
});

exports.getLoadUnloadStatus = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const corporateUserId = req.user.corporateId;
  const { id } = req.params;

  const record = await findOneVATxn(id, credentialId);
  if (!record) {
    return res.status(404).json({
      status: false,
      message: "VA load/unload transaction not found",
      responseCode: "404",
      data: {},
    });
  }

  if (record.status !== "PENDING") {
    return res.status(200).json({
      status: true,
      message: "Transaction status fetched",
      responseCode: "000",
      data: record,
    });
  }

  let decentroResponse;
  try {
    decentroResponse = await getVALoadUnloadStatus({
      credentialId,
      corporateUserId,
      referenceId: record.referenceId,
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", { message: "Error in getLoadUnloadStatus", error: err?.message });
    return res.status(400).json({
      status: false,
      message: err.message,
      responseCode: "400",
      data: err.decentroError || {},
    });
  }

  const finalStatus = interpretStatus(decentroResponse);
  const decentroTxnId = decentroResponse?.decentroTxnId || decentroResponse?.data?.decentroTxnId;
  const providerMessage = decentroResponse?.message || decentroResponse?.data?.message;
  const bankReferenceNumber = decentroResponse?.data?.bankReferenceNumber;

  if (finalStatus !== "PENDING") {
    await updateOnSuccess(record.id, {
      decentroTxnId,
      status: finalStatus,
      providerMessage,
      bankReferenceNumber,
      responsePayload: decentroResponse,
    });
    await updateLedgerStatus(record.referenceId, ledgerStatusFromVA(finalStatus));
  }

  const fresh = await findOneVATxn(id, credentialId);
  return res.status(200).json({
    status: true,
    message: "Transaction status synced",
    responseCode: "000",
    data: fresh,
  });
});
