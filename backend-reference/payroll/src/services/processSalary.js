const { v4: uuidv4 } = require('uuid');

const Salary = require('../models/entities/salary');
const ErrorResponse = require('../utils/error-response');
const { resolvePayrollCycle, ensureSalaryRecords } = require('./salarySync');
const {
  getSalaryDetails,
  getSalaryInfo,
} = require('../models/use-cases/salary');
const {
  upsertByCorporateUser: upsertVirtualAccountByCorporateUser,
} = require('../models/use-cases/corporateVirtualAccount');
const { fetchVendorCredentials } = require('../utils/credentialsClient');
const {
  createSalaryPayoutBatch,
  findSalaryPayoutBatch,
  findLatestSalaryPayoutBatch,
  createSalaryPayoutTransaction,
  updateSalaryPayoutTransaction,
  findSalaryPayoutTransactions,
  findSalaryPayoutTransactionByReferenceId,
  findSalaryPayoutTransactionByDecentroTxnId,
  findRefreshableSalaryPayoutTransactions,
  findActiveSalaryPayoutBySalary,
  findLatestTransactionsBySalaryIds,
  recalculateSalaryPayoutBatch,
} = require('../models/use-cases/processSalary');
const {
  getVirtualAccountBalanceV2,
  initiateTransfer,
  getTransferStatus,
  extractBalance,
} = require('../utils/decentroGateway');

const SUCCESS_STATUSES = new Set([
  'SUCCESS',
  'COMPLETED',
  'COMPLETE',
  'PAID',
  'PROCESSED',
]);

const FAILED_STATUSES = new Set([
  'FAILED',
  'FAILURE',
  'FAILD',
  'REJECTED',
  'CANCELLED',
  'CANCELED',
  'EXPIRED',
  'ERROR',
]);

const ACTIVE_PAYOUT_STATUSES = new Set(['PENDING', 'INITIATED']);
const PAYABLE_SALARY_STATUSES = new Set(['PENDING', 'APPROVED', 'FAILD']);

const isProductionEnvironment = () => process.env.NODE_ENV === 'production';

const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const roundMoney = (value) => Number(toNumber(value).toFixed(2));

const trimValue = (value) => String(value || '').trim();

const parsePositiveInteger = (value, fieldName, fallback) => {
  const source = value === undefined || value === null || value === '' ? fallback : value;
  const numericValue = Number.parseInt(source, 10);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw new ErrorResponse(`${fieldName} must be a positive number`, 400);
  }

  return numericValue;
};

const parseMonthYear = ({ month, year }) => {
  const now = new Date();
  const resolvedMonth = parsePositiveInteger(month, 'month', now.getMonth() + 1);
  const resolvedYear = parsePositiveInteger(year, 'year', now.getFullYear());

  if (resolvedMonth < 1 || resolvedMonth > 12) {
    throw new ErrorResponse('month must be between 1 and 12', 400);
  }

  return { month: resolvedMonth, year: resolvedYear };
};

const getPayrollCycleContext = async ({ corporateUserId, month, year, ensureSalaryRows = true }) => {
  const context = await resolvePayrollCycle({ corporateUserId, month, year });

  if (ensureSalaryRows) {
    // Pre-calculated rows are reused; only missing/stale employees are recalculated.
    const salaryGeneration = await ensureSalaryRecords({
      month,
      year,
      corporateUserID: corporateUserId,
      cycleStart: context.cycleStart,
      cycleEnd: context.cycleEnd,
      payrollStartsFrom: context.payrollStartsFrom,
      salaryCycleDay: context.salaryCycleDay,
    });

    if (!salaryGeneration.status) {
      throw new ErrorResponse(salaryGeneration.message || 'Failed to generate salary details', 400);
    }
  }

  return context;
};

const fetchSalaryRows = async ({
  corporateUserId,
  month,
  year,
  page = 1,
  limit = 10,
  searchText = '',
  ensureSalaryRows = true,
  paymentStatuses,
  requireBeneficiaryAdded,
}) => {
  const context = await getPayrollCycleContext({
    corporateUserId,
    month,
    year,
    ensureSalaryRows,
  });

  const salaryDetails = await getSalaryDetails({
    page,
    limit,
    searchText,
    cycleStart: context.cycleStart,
    cycleEnd: context.cycleEnd,
    corporateUserID: corporateUserId,
    noOfWorkingDays: context.workingDaysCount,
    paymentStatuses,
    requireBeneficiaryAdded,
  });

  return { context, salaryDetails };
};

const extractProviderStatus = (providerResponse = {}) => {
  const data = providerResponse.data || {};
  return trimValue(
    data.transaction_status ||
      data.transactionStatus ||
      data.txn_status ||
      data.transfer_status ||
      data.status ||
      providerResponse.transaction_status ||
      providerResponse.transactionStatus ||
      providerResponse.txn_status ||
      providerResponse.transfer_status ||
      providerResponse.status
  ).toUpperCase();
};

const extractProviderMessage = (providerResponse = {}) =>
  trimValue(
    providerResponse.message ||
      providerResponse.status_description ||
      providerResponse.response_message ||
      providerResponse.data?.message ||
      providerResponse.data?.status_description ||
      providerResponse.data?.response_message
  );

const extractDecentroTxnId = (providerResponse = {}) =>
  trimValue(
    providerResponse.decentro_txn_id ||
      providerResponse.decentroTxnId ||
      providerResponse.decentro_transaction_id ||
      providerResponse.data?.decentro_txn_id ||
      providerResponse.data?.decentroTxnId ||
      providerResponse.data?.decentro_transaction_id ||
      providerResponse.data?.transaction_id
  );

const extractReferenceId = (providerResponse = {}) =>
  trimValue(
    providerResponse.referenceId ||
      providerResponse.reference_id ||
      providerResponse.transfer_reference_id ||
      providerResponse.data?.referenceId ||
      providerResponse.data?.reference_id ||
      providerResponse.data?.transfer_reference_id
  );

const normalizeStatusFromProvider = (providerResponse = {}) => {
  const providerStatus = extractProviderStatus(providerResponse);

  if (SUCCESS_STATUSES.has(providerStatus)) {
    return { status: 'SUCCESS', providerStatus };
  }

  if (FAILED_STATUSES.has(providerStatus)) {
    return { status: 'FAILED', providerStatus };
  }

  return { status: 'INITIATED', providerStatus: providerStatus || 'PENDING' };
};

const buildMockTransferStatusResponse = (transaction) => {
  const decentroTxnId = transaction.decentroTxnId || `MOCK_${transaction.referenceId}`;

  return {
    status: 'SUCCESS',
    transactionStatus: 'SUCCESS',
    transaction_status: 'SUCCESS',
    decentroTxnId,
    decentro_txn_id: decentroTxnId,
    message: 'Mock payout completed successfully',
    data: {
      status: 'SUCCESS',
      transaction_status: 'SUCCESS',
      reference_id: transaction.referenceId,
      decentro_txn_id: decentroTxnId,
    },
  };
};

const cloneStatusHistory = (transaction) =>
  (transaction.statusHistory || []).map((item) =>
    typeof item.toObject === 'function' ? item.toObject() : item
  );


const getSourceVirtualAccount = async ({ corporateUserId, includeBalance = true }) => {
  // Always fetch the corporate's VA from the payment MS broker (paymentLinkOnboarding).
  // We don't trust the local cache because we want to pick up any newly-onboarded VA
  // and any stale records from earlier code paths.
  //
  // Broker call shape: { accessKey: corporateUserId, serviceType: 'VIRTUAL_ACCOUNT' }
  // — the broker reads paymentLinkOnboarding by credentialId. `initiateTransfer`
  // uses the `vendor_payouts` creds; VA ledger debits are handled out-of-band
  // via the Decentro webhook, so payroll no longer calls update_balance directly.
  let vaFromBroker = null;
  try {
    vaFromBroker = await fetchVendorCredentials({
      accessKey: String(corporateUserId),
      serviceType: 'VIRTUAL_ACCOUNT',
    });
  } catch (err) {
    throw new ErrorResponse(
      `Payroll virtual account lookup failed: ${err.message}`,
      400
    );
  }

  if (!vaFromBroker || !vaFromBroker.virtualAccountNumber) {
    throw new ErrorResponse(
      'Payroll virtual account not found. Ensure the merchant has completed payment-link onboarding.',
      400
    );
  }

  // Refresh the local mirror so the SalaryPayoutTransaction snapshot stays consistent.
  const virtualAccount = await upsertVirtualAccountByCorporateUser(corporateUserId, {
    virtualAccountNumber: vaFromBroker.virtualAccountNumber,
    virtualAccountIfsc: vaFromBroker.virtualIfsc || null,
    name: vaFromBroker.accountHolderName || null,
  });

  let providerData = {};
  let balance = null;

  if (includeBalance) {
    providerData = await getVirtualAccountBalanceV2({
      accountNumber: virtualAccount.virtualAccountNumber,
      customerId: corporateUserId,
    });
    balance = extractBalance(providerData);
  }

  return {
    virtualAccount,
    providerData,
    balance,
    snapshot: {
      virtualAccountNumber: virtualAccount.virtualAccountNumber,
      virtualAccountIfsc: virtualAccount.virtualAccountIfsc || null,
      accountName: virtualAccount.name || null,
      balanceBefore: balance,
      providerData,
    },
  };
};

const getDefaultBankDetails = (row) => {
  const bankDetails = Array.isArray(row.bankDetails) ? row.bankDetails : [];
  return bankDetails.find((bank) => bank.isDefaultAccount) || bankDetails[0] || null;
};

const getEmployeeName = (employee = {}) => trimValue(employee.personalInformation?.fullName);

const getEmployeeEmail = (employee = {}) =>
  trimValue(employee.personalInformation?.email || employee.employeeInformation?.workEmailId);

const buildReadiness = ({ row, bankDetails, latestPayout }) => {
  const salaryStatus = trimValue(row.paymentStatus || 'N/A').toUpperCase();
  const amount = roundMoney(row.totalPayable);

  if (!row.employee?.id) {
    return { isPayoutReady: false, payoutBlockReason: 'Employee details are missing' };
  }

  if (!PAYABLE_SALARY_STATUSES.has(salaryStatus)) {
    return {
      isPayoutReady: false,
      payoutBlockReason: salaryStatus === 'PAID'
        ? 'Salary is already paid'
        : 'Salary is not payable for this cycle',
    };
  }

  if (amount <= 0) {
    return { isPayoutReady: false, payoutBlockReason: 'Net payable salary must be greater than zero' };
  }

  if (!bankDetails) {
    return { isPayoutReady: false, payoutBlockReason: 'Default bank details are missing' };
  }

  if (!trimValue(bankDetails.accountName)) {
    return { isPayoutReady: false, payoutBlockReason: 'Account holder name is missing' };
  }

  if (!trimValue(bankDetails.accountNumber)) {
    return { isPayoutReady: false, payoutBlockReason: 'Account number is missing' };
  }

  if (!trimValue(bankDetails.ifscCode)) {
    return { isPayoutReady: false, payoutBlockReason: 'IFSC code is missing' };
  }

  if (latestPayout && ACTIVE_PAYOUT_STATUSES.has(trimValue(latestPayout.status).toUpperCase())) {
    return { isPayoutReady: false, payoutBlockReason: 'Payout is already in progress' };
  }

  return { isPayoutReady: true, payoutBlockReason: null };
};

const getTotalDeduction = (row) =>
  roundMoney(
    toNumber(row.totalOtherDeduction) +
      toNumber(row.leaveDeduction) +
      toNumber(row.salaryInformation?.deductionAmount) +
      toNumber(row.salaryInformation?.tdsAmount)
  );

const mapSalaryRow = (row, latestPayout) => {
  const employee = row.employee || {};
  const bankDetails = getDefaultBankDetails(row);
  const readiness = buildReadiness({ row, bankDetails, latestPayout });

  return {
    salaryId: String(row.id || row._id || ''),
    employeeId: String(employee.id || employee._id || row.employee || ''),
    employeeCode: employee.employeeInformation?.employeeId || null,
    employeeName: getEmployeeName(employee) || null,
    employeeEmail: getEmployeeEmail(employee) || null,
    designation: employee.employeeInformation?.designation || null,
    department: row.department?.departmentName || null,
    monthlySalary: roundMoney(row.monthlySalary),
    totalBonus: roundMoney(row.totalBonus),
    totalIncentive: roundMoney(row.totalIncentive),
    totalOvertime: roundMoney(row.totalOvertime),
    totalReimbursement: roundMoney(row.totalReimbursement),
    totalDeduction: getTotalDeduction(row),
    totalPayable: roundMoney(row.totalPayable),
    bankDetails: bankDetails
      ? {
          id: String(bankDetails._id || bankDetails.id || ''),
          accountName: bankDetails.accountName || null,
          accountNumber: bankDetails.accountNumber || null,
          bankName: bankDetails.bankName || null,
          ifscCode: bankDetails.ifscCode || null,
          isDefaultAccount: Boolean(bankDetails.isDefaultAccount),
          transactionType: bankDetails.transactionType || null,
        }
      : null,
    isPayoutReady: readiness.isPayoutReady,
    payoutBlockReason: readiness.payoutBlockReason,
    salaryPaymentStatus: row.paymentStatus || 'N/A',
    latestPayoutStatus: latestPayout?.status || null,
    latestBatchReferenceId: latestPayout?.batchReferenceId || null,
  };
};

const getProcessRows = async ({
  corporateUserId,
  month,
  year,
  page,
  limit,
  searchText,
  ensureSalaryRows = true,
  paymentStatuses,
  requireBeneficiaryAdded,
}) => {
  const { context, salaryDetails } = await fetchSalaryRows({
    corporateUserId,
    month,
    year,
    page,
    limit,
    searchText,
    ensureSalaryRows,
    paymentStatuses,
    requireBeneficiaryAdded,
  });

  const rows = Array.isArray(salaryDetails.rows) ? salaryDetails.rows : [];
  const latestPayoutsBySalaryId = await findLatestTransactionsBySalaryIds({
    corporateUser: corporateUserId,
    salaryIds: rows.map((row) => row.id || row._id).filter(Boolean),
  });

  return {
    context,
    salaryDetails,
    rows: rows.map((row) => mapSalaryRow(row, latestPayoutsBySalaryId[String(row.id || row._id)])),
  };
};

exports.getProcessSalaryDetails = async ({ corporateUserId, month, year }) => {
  const resolved = parseMonthYear({ month, year });
  const { context, salaryDetails } = await fetchSalaryRows({
    corporateUserId,
    ...resolved,
    page: 1,
    limit: 1,
    ensureSalaryRows: true,
  });
  const salaryInfo = await getSalaryInfo(
    corporateUserId,
    resolved.month,
    resolved.year,
    context.cycleStart,
    context.cycleEnd
  );
  const sourceAccount = await getSourceVirtualAccount({ corporateUserId, includeBalance: true });
  const latestBatch = await findLatestSalaryPayoutBatch({
    corporateUser: corporateUserId,
    month: resolved.month,
    year: resolved.year,
  });

  return {
    month: resolved.month,
    year: resolved.year,
    salaryCycle: salaryDetails.salaryCycle,
    payingDate: salaryInfo.payingDate || null,
    payrollStartDate: context.payrollStartsFrom || null,
    workingDays: context.workingDaysCount,
    numberOfEmployees: salaryInfo.noOfEmployees || salaryDetails.count || 0,
    totalDeduction: roundMoney(salaryInfo.totalDeduction),
    totalPayable: roundMoney(salaryInfo.totalPayable),
    salaryPaymentStatus: salaryInfo.paymentStatus || 'N/A',
    sourceAccount: {
      virtualAccountNumber: sourceAccount.virtualAccount.virtualAccountNumber,
      virtualAccountIfsc: sourceAccount.virtualAccount.virtualAccountIfsc || null,
      accountName: sourceAccount.virtualAccount.name || null,
      availableBalance: sourceAccount.balance,
      providerData: sourceAccount.providerData,
    },
    latestBatch,
  };
};

exports.getProcessSalaryEmployees = async ({
  corporateUserId,
  month,
  year,
  page,
  limit,
  searchText,
}) => {
  const resolved = parseMonthYear({ month, year });
  const resolvedPage = parsePositiveInteger(page, 'page', 1);
  const resolvedLimit = parsePositiveInteger(limit, 'limit', 10);

  const result = await getProcessRows({
    corporateUserId,
    ...resolved,
    page: resolvedPage,
    limit: resolvedLimit,
    searchText: trimValue(searchText),
    ensureSalaryRows: resolvedPage === 1 && !trimValue(searchText),
    paymentStatuses: ['APPROVED'],
    requireBeneficiaryAdded: true,
  });

  return {
    count: result.salaryDetails.count || 0,
    page: resolvedPage,
    limit: resolvedLimit,
    salaryCycle: result.salaryDetails.salaryCycle,
    totalPayableSum: result.salaryDetails.totalPayableSum,
    rows: result.rows,
  };
};

const buildReferenceId = ({ batchReferenceId, employeeId }) =>
  `SAL_${batchReferenceId}_${String(employeeId).slice(-6)}_${uuidv4().slice(0, 8)}`;

const createSkippedTransaction = async ({
  row,
  corporateUserId,
  batchReferenceId,
  month,
  year,
  reason,
  sourceAccount,
}) => createSalaryPayoutTransaction({
  corporateUser: corporateUserId,
  batchReferenceId,
  salary: row.salaryId,
  employee: row.employeeId,
  month,
  year,
  referenceId: buildReferenceId({ batchReferenceId, employeeId: row.employeeId }),
  amount: row.totalPayable,
  transferType: 'IMPS',
  sourceAccount,
  beneficiary: row.bankDetails || {},
  status: 'SKIPPED',
  statusReason: reason,
  statusHistory: [{
    status: 'SKIPPED',
    message: reason,
    occurredAt: new Date(),
  }],
});

exports.processSalaryPayouts = async ({
  corporateUserId,
  month,
  year,
  salaryIds,
  remarks,
  rawRequest,
}) => {
  const resolved = parseMonthYear({ month, year });
  const selectedSalaryIds = Array.isArray(salaryIds)
    ? salaryIds.map((id) => trimValue(id)).filter(Boolean)
    : [];
  const selectedSalarySet = new Set(selectedSalaryIds);

  const sourceAccount = await getSourceVirtualAccount({ corporateUserId, includeBalance: true });
  console.log(sourceAccount,"source account")
  const salaryData = await getProcessRows({
    corporateUserId,
    ...resolved,
    page: 1,
    limit: 10000,
    searchText: '',
    ensureSalaryRows: true,
  });

  const rowsToProcess = salaryData.rows.filter((row) =>
    selectedSalarySet.size === 0 || selectedSalarySet.has(row.salaryId)
  );

  if (rowsToProcess.length === 0) {
    throw new ErrorResponse('No salary records found for processing', 400);
  }

  const batchReferenceId = `SALB_${Date.now()}_${uuidv4().slice(0, 8)}`;
  const totalRequestedAmount = roundMoney(
    rowsToProcess.reduce((sum, row) => sum + toNumber(row.totalPayable), 0)
  );

  if (sourceAccount.balance !== null && totalRequestedAmount > sourceAccount.balance) {
    throw new ErrorResponse(
      `Insufficient virtual account balance. Available: ₹${roundMoney(sourceAccount.balance)}, Required: ₹${totalRequestedAmount}. Please top up the virtual account before processing payroll.`,
      400
    );
  }

  await createSalaryPayoutBatch({
    corporateUser: corporateUserId,
    batchReferenceId,
    month: resolved.month,
    year: resolved.year,
    sourceAccount: sourceAccount.snapshot,
    requestedCount: rowsToProcess.length,
    totalRequestedAmount,
    remarks: trimValue(remarks),
    rawRequest,
  });

  let remainingBalance = sourceAccount.balance;
  const hasKnownBalance = remainingBalance !== null;
  const results = [];

  for (const row of rowsToProcess) {
    const sourceSnapshot = {
      virtualAccountNumber: sourceAccount.virtualAccount.virtualAccountNumber,
      virtualAccountIfsc: sourceAccount.virtualAccount.virtualAccountIfsc || null,
      accountName: sourceAccount.virtualAccount.name || null,
    };

    try {
      const activePayout = await findActiveSalaryPayoutBySalary({
        corporateUser: corporateUserId,
        salaryId: row.salaryId,
      });

      let blockReason = row.payoutBlockReason;
      if (activePayout) {
        blockReason = 'Payout is already in progress';
      } else if (hasKnownBalance && toNumber(row.totalPayable) > remainingBalance) {
        blockReason = 'Insufficient virtual account balance';
      }

      if (blockReason) {
        await createSkippedTransaction({
          row,
          corporateUserId,
          batchReferenceId,
          month: resolved.month,
          year: resolved.year,
          reason: blockReason,
          sourceAccount: sourceSnapshot,
        });
        results.push({ salaryId: row.salaryId, employeeId: row.employeeId, status: 'SKIPPED', message: blockReason });
        continue;
      }

      const referenceId = buildReferenceId({ batchReferenceId, employeeId: row.employeeId });
      const providerRequest = {
        referenceId,
        amount: row.totalPayable,
        transferType: 'IMPS',
        fromAccount: sourceAccount.virtualAccount.virtualAccountNumber,
        beneficiaryDetails: {
          name: row.bankDetails.accountName,
          accountNumber: row.bankDetails.accountNumber,
          ifscCode: row.bankDetails.ifscCode,
          email: row.employeeEmail,
        },
        purposeMessage: `Salary payout ${resolved.month}/${resolved.year}`,
      };

      const transaction = await createSalaryPayoutTransaction({
        corporateUser: corporateUserId,
        batchReferenceId,
        salary: row.salaryId,
        employee: row.employeeId,
        month: resolved.month,
        year: resolved.year,
        referenceId,
        amount: row.totalPayable,
        transferType: 'IMPS',
        sourceAccount: sourceSnapshot,
        beneficiary: {
          ...row.bankDetails,
          email: row.employeeEmail,
        },
        status: 'PENDING',
        providerRequest,
        statusHistory: [{
          status: 'PENDING',
          message: 'Payout request queued',
          occurredAt: new Date(),
        }],
      });

      try {
        const providerResponse = await initiateTransfer({
          credentialId: corporateUserId,
          corporateUserId,
          ...providerRequest,
        });
        const providerStatus = extractProviderStatus(providerResponse);
        const providerMessage = extractProviderMessage(providerResponse);
        const decentroTxnId = extractDecentroTxnId(providerResponse);
        const failedOnInitiation = FAILED_STATUSES.has(providerStatus);
        const mockSuccessOnInitiation = !isProductionEnvironment() && SUCCESS_STATUSES.has(providerStatus);
        const transactionStatus = failedOnInitiation
          ? 'FAILED'
          : mockSuccessOnInitiation
            ? 'SUCCESS'
            : 'INITIATED';
        const statusOccurredAt = new Date();
        const successMessage = mockSuccessOnInitiation
          ? 'Mock payout completed successfully'
          : 'Payout initiated';

        await updateSalaryPayoutTransaction({
          id: transaction._id,
          data: {
            status: transactionStatus,
            providerStatus,
            providerMessage,
            decentroTxnId,
            providerResponse,
            initiatedAt: failedOnInitiation ? undefined : statusOccurredAt,
            completedAt: transactionStatus === 'SUCCESS' ? statusOccurredAt : undefined,
            failedAt: failedOnInitiation ? statusOccurredAt : undefined,
            statusReason: failedOnInitiation ? (providerMessage || 'Payout initiation failed') : undefined,
            statusHistory: [
              ...cloneStatusHistory(transaction),
              {
                status: transactionStatus,
                providerStatus,
                message: providerMessage || (
                  failedOnInitiation ? 'Payout initiation failed' : successMessage
                ),
                occurredAt: statusOccurredAt,
                raw: providerResponse,
              },
            ],
          },
        });

        if (!failedOnInitiation) {
          await updateSalaryFromPayoutStatus({
            corporateUserId,
            salaryId: row.salaryId,
            status: transactionStatus,
          });
        }

        if (!failedOnInitiation && hasKnownBalance) {
          remainingBalance = roundMoney(remainingBalance - toNumber(row.totalPayable));
        }

        results.push({
          salaryId: row.salaryId,
          employeeId: row.employeeId,
          status: transactionStatus,
          referenceId,
          decentroTxnId,
          message: providerMessage || successMessage,
        });
      } catch (error) {
        await updateSalaryPayoutTransaction({
          id: transaction._id,
          data: {
            status: 'FAILED',
            statusReason: error.message || 'Payout initiation failed',
            failedAt: new Date(),
            providerResponse: error.response?.data || { message: error.message },
            statusHistory: [
              ...cloneStatusHistory(transaction),
              {
                status: 'FAILED',
                message: error.message || 'Payout initiation failed',
                occurredAt: new Date(),
                raw: error.response?.data || { message: error.message },
              },
            ],
          },
        });

        results.push({
          salaryId: row.salaryId,
          employeeId: row.employeeId,
          status: 'FAILED',
          referenceId,
          message: error.message || 'Payout initiation failed',
        });
      }
    } catch (error) {
      results.push({
        salaryId: row.salaryId,
        employeeId: row.employeeId,
        status: 'FAILED',
        message: error.message || 'Unable to process employee payout',
      });
    }
  }

  const batch = await recalculateSalaryPayoutBatch({ corporateUser: corporateUserId, batchReferenceId });

  return {
    batchReferenceId,
    totalRequestedCount: batch.requestedCount,
    initiatedCount: batch.initiatedCount,
    skippedCount: batch.skippedCount,
    failedCount: batch.failedCount,
    successCount: batch.successCount,
    totalRequestedAmount: batch.totalRequestedAmount,
    totalInitiatedAmount: batch.totalInitiatedAmount,
    status: batch.status,
    results,
  };
};

const updateSalaryFromPayoutStatus = async ({ corporateUserId, salaryId, status }) => {
  if (status === 'SUCCESS') {
    await Salary.findOneAndUpdate(
      { _id: salaryId, corporateUser: corporateUserId },
      { $set: { paymentStatus: 'PAID', paidViaRollout: true, payingDate: new Date() } }
    );
  } else if (status === 'FAILED') {
    await Salary.findOneAndUpdate(
      { _id: salaryId, corporateUser: corporateUserId },
      { $set: { paymentStatus: 'FAILD' } }
    );
  } else if (status === 'INITIATED') {
    await Salary.findOneAndUpdate(
      { _id: salaryId, corporateUser: corporateUserId },
      { $set: { paymentStatus: 'INITIATED', payingDate: new Date() } }
    );
  }
};

exports.processSalaryPayoutWebhook = async ({ body = {}, headers = {} }) => {
  const referenceId = extractReferenceId(body);
  const decentroTxnId = extractDecentroTxnId(body);

  if (!referenceId && !decentroTxnId) {
    throw new ErrorResponse('referenceId is missing', 400);
  }

  let transaction = referenceId
    ? await findSalaryPayoutTransactionByReferenceId(referenceId)
    : null;

  if (!transaction && decentroTxnId) {
    transaction = await findSalaryPayoutTransactionByDecentroTxnId(decentroTxnId);
  }

  if (!transaction) {
    throw new ErrorResponse('Salary payout transaction not found', 404);
  }

  if (transaction.status === 'SUCCESS' || transaction.status === 'FAILED') {
    return {
      referenceId: transaction.referenceId,
      decentroTxnId: transaction.decentroTxnId || decentroTxnId || null,
      status: transaction.status,
      alreadyFinalized: true,
    };
  }

  const normalized = normalizeStatusFromProvider(body);
  const providerMessage = extractProviderMessage(body);
  const resolvedDecentroTxnId = decentroTxnId || transaction.decentroTxnId;
  const resolvedStatus = normalized.status === 'INITIATED' ? 'INITIATED' : normalized.status;
  const occurredAt = new Date();
  const callbackSnapshot = {
    body,
    headers,
  };

  await updateSalaryPayoutTransaction({
    id: transaction._id,
    data: {
      status: resolvedStatus,
      providerStatus: normalized.providerStatus,
      providerMessage,
      decentroTxnId: resolvedDecentroTxnId,
      statusResponse: callbackSnapshot,
      completedAt: resolvedStatus === 'SUCCESS' ? occurredAt : transaction.completedAt,
      failedAt: resolvedStatus === 'FAILED' ? occurredAt : transaction.failedAt,
      statusReason: resolvedStatus === 'FAILED'
        ? (providerMessage || 'Payout failed')
        : transaction.statusReason,
      statusHistory: [
        ...cloneStatusHistory(transaction),
        {
          status: resolvedStatus,
          providerStatus: normalized.providerStatus,
          message: providerMessage || 'Payout webhook received',
          occurredAt,
          raw: callbackSnapshot,
        },
      ],
    },
  });

  await updateSalaryFromPayoutStatus({
    corporateUserId: transaction.corporateUser,
    salaryId: transaction.salary,
    status: resolvedStatus,
  });

  await recalculateSalaryPayoutBatch({
    corporateUser: transaction.corporateUser,
    batchReferenceId: transaction.batchReferenceId,
  });

  return {
    referenceId: transaction.referenceId,
    decentroTxnId: resolvedDecentroTxnId || null,
    status: resolvedStatus,
    providerStatus: normalized.providerStatus,
  };
};

exports.refreshProcessSalaryStatus = async ({ corporateUserId, batchReferenceId }) => {
  const batch = await findSalaryPayoutBatch({ corporateUser: corporateUserId, batchReferenceId });

  if (!batch) {
    throw new ErrorResponse('Salary payout batch not found', 404);
  }

  const refreshableTransactions = await findRefreshableSalaryPayoutTransactions({
    corporateUser: corporateUserId,
    batchReferenceId,
  });
  const refreshResults = [];

  for (const transaction of refreshableTransactions) {
    try {
      const providerResponse = isProductionEnvironment()
        ? await getTransferStatus({
            credentialId: corporateUserId,
            corporateUserId,
            referenceId: transaction.referenceId,
            decentroTxnId: transaction.decentroTxnId,
          })
        : buildMockTransferStatusResponse(transaction);
      const normalized = normalizeStatusFromProvider(providerResponse);
      const providerMessage = extractProviderMessage(providerResponse);
      const decentroTxnId = extractDecentroTxnId(providerResponse) || transaction.decentroTxnId;
      const resolvedStatus = normalized.status === 'INITIATED' ? transaction.status : normalized.status;

      await updateSalaryPayoutTransaction({
        id: transaction._id,
        data: {
          status: resolvedStatus,
          providerStatus: normalized.providerStatus,
          providerMessage,
          decentroTxnId,
          statusResponse: providerResponse,
          completedAt: resolvedStatus === 'SUCCESS' ? new Date() : transaction.completedAt,
          failedAt: resolvedStatus === 'FAILED' ? new Date() : transaction.failedAt,
          statusHistory: [
            ...cloneStatusHistory(transaction),
            {
              status: resolvedStatus,
              providerStatus: normalized.providerStatus,
              message: providerMessage || 'Payout status refreshed',
              occurredAt: new Date(),
              raw: providerResponse,
            },
          ],
        },
      });

      await updateSalaryFromPayoutStatus({
        corporateUserId,
        salaryId: transaction.salary,
        status: resolvedStatus,
      });

      refreshResults.push({
        salaryId: String(transaction.salary),
        employeeId: String(transaction.employee),
        referenceId: transaction.referenceId,
        status: resolvedStatus,
        providerStatus: normalized.providerStatus,
      });
    } catch (error) {
      await updateSalaryPayoutTransaction({
        id: transaction._id,
        data: {
          statusReason: error.message || 'Unable to refresh payout status',
          statusResponse: error.response?.data || { message: error.message },
        },
      });

      refreshResults.push({
        salaryId: String(transaction.salary),
        employeeId: String(transaction.employee),
        referenceId: transaction.referenceId,
        status: transaction.status,
        refreshError: error.message || 'Unable to refresh payout status',
      });
    }
  }

  const updatedBatch = await recalculateSalaryPayoutBatch({ corporateUser: corporateUserId, batchReferenceId });
  const transactions = await findSalaryPayoutTransactions({ corporateUser: corporateUserId, batchReferenceId });

  return {
    batch: updatedBatch,
    refreshedCount: refreshableTransactions.length,
    refreshResults,
    transactions,
  };
};

// Shared with the Loss of Pay sheet (services/lossOfPay.js), which works on the same cycle.
exports.getPayrollCycleContext = getPayrollCycleContext;
exports.parseMonthYear = parseMonthYear;
