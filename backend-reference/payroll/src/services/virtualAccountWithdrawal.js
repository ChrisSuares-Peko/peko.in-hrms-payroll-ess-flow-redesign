const { v4: uuidv4 } = require('uuid');

const ErrorResponse = require('../utils/error-response');
const { fetchVendorCredentials } = require('../utils/credentialsClient');
const {
  getVirtualAccountBalanceV2,
  initiateTransfer,
  getTransferStatus,
  extractBalance,
} = require('../utils/decentroGateway');
const {
  upsertByCorporateUser: upsertVirtualAccountByCorporateUser,
} = require('../models/use-cases/corporateVirtualAccount');
const {
  createVirtualAccountTransaction,
} = require('../models/use-cases/virtualAccountTransaction');
const {
  createWithdrawalRequest,
  updateWithdrawalRequest,
  findWithdrawalRequestByReferenceId,
  findWithdrawalRequestByDecentroTxnId,
  findWithdrawalRequestsByCorporateUser,
} = require('../models/use-cases/virtualAccountWithdrawalRequest');

const SUCCESS_STATUSES = new Set(['SUCCESS', 'COMPLETED', 'COMPLETE', 'PAID', 'PROCESSED']);
const FAILED_STATUSES = new Set(['FAILED', 'FAILURE', 'FAILD', 'REJECTED', 'CANCELLED', 'CANCELED', 'EXPIRED', 'ERROR']);
const TRANSFER_TYPES = new Set(['IMPS', 'NEFT', 'RTGS']);

const trimValue = (value) => String(value ?? '').trim();
const roundMoney = (value) => Number(Number(value).toFixed(2));

const isProductionEnvironment = () => process.env.NODE_ENV === 'production';

const toPlainObject = (doc) => (typeof doc?.toObject === 'function' ? doc.toObject() : doc);

const getNested = (source, keys) => {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => acc?.[part], source);
    if (value !== undefined && value !== null && trimValue(value)) {
      return value;
    }
  }
  return null;
};

const normalizeProviderStatus = (payload = {}) => {
  const rawStatus = trimValue(getNested(payload, [
    'status',
    'transactionStatus',
    'transaction_status',
    'data.status',
    'data.transactionStatus',
    'data.transaction_status',
    'body.status',
    'body.transactionStatus',
    'body.transaction_status',
    'body.data.status',
    'body.data.transactionStatus',
    'body.data.transaction_status',
  ])).toUpperCase();

  if (SUCCESS_STATUSES.has(rawStatus)) return { status: 'SUCCESS', providerStatus: rawStatus };
  if (FAILED_STATUSES.has(rawStatus)) return { status: 'FAILED', providerStatus: rawStatus };
  return { status: 'INITIATED', providerStatus: rawStatus || 'PENDING' };
};

const extractProviderMessage = (payload = {}) => {
  const value = getNested(payload, [
    'message',
    'providerResponse',
    'response_key',
    'data.message',
    'data.providerResponse',
    'data.response_key',
    'error.message',
    'body.message',
    'body.providerResponse',
    'body.response_key',
    'body.data.message',
    'body.data.providerResponse',
    'body.data.response_key',
    'body.error.message',
  ]);
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.message) return trimValue(value.message);
  return trimValue(value);
};

const extractReferenceId = (payload = {}) =>
  getNested(payload, [
    'referenceId',
    'reference_id',
    'data.referenceId',
    'data.reference_id',
    'body.referenceId',
    'body.reference_id',
    'body.data.referenceId',
    'body.data.reference_id',
  ]);

const extractDecentroTxnId = (payload = {}) =>
  getNested(payload, [
    'decentroTxnId',
    'decentro_txn_id',
    'transactionId',
    'transaction_id',
    'data.decentroTxnId',
    'data.decentro_txn_id',
    'data.transactionId',
    'data.transaction_id',
    'body.decentroTxnId',
    'body.decentro_txn_id',
    'body.transactionId',
    'body.transaction_id',
    'body.data.decentroTxnId',
    'body.data.decentro_txn_id',
    'body.data.transactionId',
    'body.data.transaction_id',
  ]);

const extractBankReferenceNumber = (payload = {}) =>
  getNested(payload, [
    'bankReferenceNumber',
    'bank_reference_number',
    'data.bankReferenceNumber',
    'data.bank_reference_number',
    'body.bankReferenceNumber',
    'body.bank_reference_number',
    'body.data.bankReferenceNumber',
    'body.data.bank_reference_number',
  ]);

const extractProviderBalance = (payload = {}) => {
  const value = getNested(payload, [
    'newBalance',
    'new_balance',
    'balance',
    'data.newBalance',
    'data.new_balance',
    'data.balance',
    'body.newBalance',
    'body.new_balance',
    'body.balance',
    'body.data.newBalance',
    'body.data.new_balance',
    'body.data.balance',
  ]);
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const buildMockTransferStatusResponse = (request) => {
  const decentroTxnId = request.decentroTxnId || `MOCK_${request.referenceId}`;
  return {
    status: 'SUCCESS',
    transaction_status: 'SUCCESS',
    decentro_txn_id: decentroTxnId,
    reference_id: request.referenceId,
    message: 'Mock virtual account withdrawal completed successfully',
    data: {
      status: 'SUCCESS',
      transaction_status: 'SUCCESS',
      reference_id: request.referenceId,
      decentro_txn_id: decentroTxnId,
      bank_reference_number: request.bankReferenceNumber || 'MOCKBANKREF',
    },
  };
};

const cloneStatusHistory = (request) =>
  (request.statusHistory || []).map((item) =>
    typeof item.toObject === 'function' ? item.toObject() : item
  );

const getPaymentLinksOnboardingSnapshot = async (corporateUserId) => {
  const onboarding = await fetchVendorCredentials({
    accessKey: String(corporateUserId),
    serviceType: 'VIRTUAL_ACCOUNT',
  });

  if (!onboarding) {
    throw new ErrorResponse('Payment Links onboarding is not completed', 400);
  }

  if (trimValue(onboarding.status).toLowerCase() !== 'active') {
    throw new ErrorResponse('Payment Links onboarding is not active', 400);
  }

  const virtualAccountNumber = trimValue(onboarding.virtualAccountNumber);
  const accountNumber = trimValue(onboarding.accountNumber);
  const ifscCode = trimValue(onboarding.ifsc).toUpperCase();
  const beneficiaryName = trimValue(onboarding.accountHolderName || onboarding.businessName);

  if (!virtualAccountNumber) {
    throw new ErrorResponse('Virtual account not found. Please complete Payment Links onboarding.', 400);
  }

  if (!accountNumber || !ifscCode || !beneficiaryName) {
    throw new ErrorResponse('Settlement bank account details are missing from Payment Links onboarding', 400);
  }

  return {
    virtualAccountNumber,
    virtualAccountIfsc: trimValue(onboarding.virtualIfsc) || null,
    accountName: beneficiaryName,
    beneficiary: {
      name: beneficiaryName,
      bankName: trimValue(onboarding.bankName) || null,
      accountNumber,
      ifscCode,
      phone: trimValue(onboarding.phone) || null,
    },
  };
};

const getSourceVirtualAccount = async ({ corporateUserId }) => {
  const onboarding = await getPaymentLinksOnboardingSnapshot(corporateUserId);
  const virtualAccount = await upsertVirtualAccountByCorporateUser(corporateUserId, {
    virtualAccountNumber: onboarding.virtualAccountNumber,
    virtualAccountIfsc: onboarding.virtualAccountIfsc,
    name: onboarding.accountName,
  });

  const providerData = await getVirtualAccountBalanceV2({
    accountNumber: onboarding.virtualAccountNumber,
    customerId: corporateUserId,
  });
  const balance = extractBalance(providerData);

  return {
    onboarding,
    virtualAccount,
    providerData,
    balance,
  };
};

const createLocalDebitTransaction = async ({ request, providerResponse }) => {
  const plainRequest = toPlainObject(request);
  const transaction = await createVirtualAccountTransaction({
    corporateUser: plainRequest.corporateUser,
    virtualAccountNumber: plainRequest.sourceVirtualAccount.virtualAccountNumber,
    referenceId: `VAW_TXN_${plainRequest.referenceId}`,
    sourceReferenceId: plainRequest.referenceId,
    sourceType: 'VA_WITHDRAWAL',
    type: 'DEBIT',
    amount: plainRequest.amount,
    status: 'SUCCESS',
    decentroTxnId: plainRequest.decentroTxnId || extractDecentroTxnId(providerResponse) || null,
    bankReferenceNumber: plainRequest.bankReferenceNumber || extractBankReferenceNumber(providerResponse) || null,
    balanceBefore: plainRequest.sourceVirtualAccount.balanceBefore,
    balanceAfter:
      extractProviderBalance(providerResponse) ??
      roundMoney((plainRequest.sourceVirtualAccount.balanceBefore || 0) - plainRequest.amount),
    providerRequest: plainRequest.providerRequest,
    providerResponse,
    metadata: {
      withdrawalRequestId: plainRequest._id,
      beneficiary: plainRequest.beneficiary,
      transferType: plainRequest.transferType,
    },
  });

  await updateWithdrawalRequest({
    id: plainRequest._id,
    data: {
      virtualAccountTransaction: transaction._id,
      'sourceVirtualAccount.balanceAfter': transaction.balanceAfter,
    },
  });

  return transaction;
};

const applyProviderStatus = async ({ request, providerResponse, statusMessage }) => {
  const normalized = normalizeProviderStatus(providerResponse);
  const providerMessage = extractProviderMessage(providerResponse) || statusMessage || null;
  const decentroTxnId = extractDecentroTxnId(providerResponse) || request.decentroTxnId || null;
  const bankReferenceNumber = extractBankReferenceNumber(providerResponse) || request.bankReferenceNumber || null;
  const occurredAt = new Date();

  const updated = await updateWithdrawalRequest({
    id: request._id,
    data: {
      status: normalized.status,
      providerStatus: normalized.providerStatus,
      providerMessage,
      decentroTxnId,
      bankReferenceNumber,
      providerResponse: normalized.status === 'INITIATED' ? request.providerResponse : providerResponse,
      statusResponse: providerResponse,
      completedAt: normalized.status === 'SUCCESS' ? occurredAt : request.completedAt,
      failedAt: normalized.status === 'FAILED' ? occurredAt : request.failedAt,
      statusReason: normalized.status === 'FAILED' ? (providerMessage || 'Withdrawal failed') : request.statusReason,
      statusHistory: [
        ...cloneStatusHistory(request),
        {
          status: normalized.status,
          providerStatus: normalized.providerStatus,
          message: providerMessage || 'Withdrawal status updated',
          occurredAt,
          raw: providerResponse,
        },
      ],
    },
  });

  if (normalized.status === 'SUCCESS') {
    try {
      await createLocalDebitTransaction({ request: updated, providerResponse });
    } catch (ledgerError) {
      await updateWithdrawalRequest({
        id: updated._id,
        data: {
          statusReason: ledgerError.message || 'Unable to create local virtual account transaction',
        },
      });
    }
  }

  return updated;
};

const buildResponse = (request, availableBalance) => {
  const plainRequest = toPlainObject(request);
  return {
    referenceId: plainRequest.referenceId,
    amount: plainRequest.amount,
    transferType: plainRequest.transferType,
    status: plainRequest.status,
    decentroTxnId: plainRequest.decentroTxnId || null,
    availableBalance,
    beneficiaryAccountNumber: plainRequest.beneficiary?.accountNumber || null,
    beneficiaryIfsc: plainRequest.beneficiary?.ifscCode || null,
    createdAt: plainRequest.createdAt,
  };
};

exports.createVirtualAccountWithdrawal = async ({
  corporateUserId,
  amount,
  transferType = 'IMPS',
  remarks = '',
}) => {
  const numericAmount = Number(amount);
  const normalizedTransferType = trimValue(transferType || 'IMPS').toUpperCase();

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ErrorResponse('Valid amount is required', 400);
  }

  if (!TRANSFER_TYPES.has(normalizedTransferType)) {
    throw new ErrorResponse('transferType must be IMPS, NEFT, or RTGS', 400);
  }

  const { onboarding, providerData, balance } = await getSourceVirtualAccount({ corporateUserId });

  if (balance === null || balance === undefined) {
    throw new ErrorResponse('Virtual account balance is unavailable. Please try again.', 502);
  }

  if (numericAmount > balance) {
    throw new ErrorResponse(`Requested amount (${numericAmount}) exceeds available balance (${balance})`, 400);
  }

  const referenceId = `VAW_${uuidv4()}`;
  const providerRequest = {
    referenceId,
    amount: numericAmount,
    transferType: normalizedTransferType,
    fromAccount: onboarding.virtualAccountNumber,
    beneficiaryDetails: onboarding.beneficiary,
    purposeMessage: 'Virtual account withdrawal',
  };

  let request = await createWithdrawalRequest({
    corporateUser: corporateUserId,
    referenceId,
    amount: numericAmount,
    transferType: normalizedTransferType,
    status: 'PENDING',
    remarks: trimValue(remarks) || null,
    sourceVirtualAccount: {
      virtualAccountNumber: onboarding.virtualAccountNumber,
      virtualAccountIfsc: onboarding.virtualAccountIfsc,
      accountName: onboarding.accountName,
      balanceBefore: balance,
      providerData,
    },
    beneficiary: onboarding.beneficiary,
    providerRequest,
    statusHistory: [{
      status: 'PENDING',
      message: 'Withdrawal request created',
      occurredAt: new Date(),
      raw: { amount: numericAmount, transferType: normalizedTransferType },
    }],
  });

  try {
    const providerResponse = await initiateTransfer({
      credentialId: corporateUserId,
      corporateUserId,
      ...providerRequest,
    });

    const normalized = normalizeProviderStatus(providerResponse);
    request = await updateWithdrawalRequest({
      id: request._id,
      data: {
        status: normalized.status,
        providerStatus: normalized.providerStatus,
        providerMessage: extractProviderMessage(providerResponse),
        decentroTxnId: extractDecentroTxnId(providerResponse),
        bankReferenceNumber: extractBankReferenceNumber(providerResponse),
        providerResponse,
        initiatedAt: new Date(),
        completedAt: normalized.status === 'SUCCESS' ? new Date() : null,
        failedAt: normalized.status === 'FAILED' ? new Date() : null,
        statusHistory: [
          ...cloneStatusHistory(request),
          {
            status: normalized.status,
            providerStatus: normalized.providerStatus,
            message: extractProviderMessage(providerResponse) || 'Withdrawal payout initiated',
            occurredAt: new Date(),
            raw: providerResponse,
          },
        ],
      },
    });

    if (normalized.status === 'SUCCESS') {
      try {
        await createLocalDebitTransaction({ request, providerResponse });
      } catch (ledgerError) {
        await updateWithdrawalRequest({
          id: request._id,
          data: {
            statusReason: ledgerError.message || 'Unable to create local virtual account transaction',
          },
        });
      }
      request = await findWithdrawalRequestByReferenceId(referenceId);
    }

    return buildResponse(request, balance);
  } catch (error) {
    await updateWithdrawalRequest({
      id: request._id,
      data: {
        status: 'FAILED',
        providerStatus: 'ERROR',
        providerMessage: error.message,
        providerResponse: error.response?.data || { message: error.message },
        failedAt: new Date(),
        statusReason: error.message || 'Withdrawal payout failed',
        statusHistory: [
          ...cloneStatusHistory(request),
          {
            status: 'FAILED',
            providerStatus: 'ERROR',
            message: error.message || 'Withdrawal payout failed',
            occurredAt: new Date(),
            raw: error.response?.data || { message: error.message },
          },
        ],
      },
    });

    throw error;
  }
};

exports.listVirtualAccountWithdrawals = async ({ corporateUserId, page, limit }) => {
  const result = await findWithdrawalRequestsByCorporateUser({
    corporateUser: corporateUserId,
    page,
    limit,
  });

  return {
    ...result,
    rows: result.rows.map((row) => {
      const plainRow = toPlainObject(row);
      return {
        id: String(plainRow._id),
        ...buildResponse(plainRow),
      };
    }),
  };
};

exports.refreshVirtualAccountWithdrawalStatus = async ({ corporateUserId, referenceId }) => {
  const request = await findWithdrawalRequestByReferenceId(referenceId);

  if (!request || String(request.corporateUser) !== String(corporateUserId)) {
    throw new ErrorResponse('Withdrawal request not found', 404);
  }

  if (request.status === 'FAILED' || (request.status === 'SUCCESS' && request.virtualAccountTransaction)) {
    return buildResponse(request);
  }

  const providerResponse = isProductionEnvironment()
    ? await getTransferStatus({
        credentialId: corporateUserId,
        corporateUserId,
        referenceId: request.referenceId,
        decentroTxnId: request.decentroTxnId,
      })
    : buildMockTransferStatusResponse(request);

  const updated = await applyProviderStatus({
    request,
    providerResponse,
    statusMessage: 'Withdrawal status refreshed',
  });

  return buildResponse(updated);
};

exports.processVirtualAccountWithdrawalWebhook = async ({ body = {}, headers = {} }) => {
  const referenceId = extractReferenceId(body);
  const decentroTxnId = extractDecentroTxnId(body);

  if (!referenceId && !decentroTxnId) {
    throw new ErrorResponse('referenceId is missing', 400);
  }

  let request = referenceId
    ? await findWithdrawalRequestByReferenceId(referenceId)
    : null;

  if (!request && decentroTxnId) {
    request = await findWithdrawalRequestByDecentroTxnId(decentroTxnId);
  }

  if (!request) {
    throw new ErrorResponse('Virtual account withdrawal request not found', 404);
  }

  if (request.status === 'FAILED' || (request.status === 'SUCCESS' && request.virtualAccountTransaction)) {
    return {
      referenceId: request.referenceId,
      decentroTxnId: request.decentroTxnId || decentroTxnId || null,
      status: request.status,
      alreadyFinalized: true,
    };
  }

  const updated = await applyProviderStatus({
    request,
    providerResponse: { body, headers },
    statusMessage: 'Withdrawal payout webhook received',
  });

  return {
    referenceId: updated.referenceId,
    decentroTxnId: updated.decentroTxnId || null,
    status: updated.status,
  };
};
