'use strict';

const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/error-response');
const Employee = require('../models/entities/employee');
const BankDetails = require('../models/entities/bankDetails');
const OneTimePayment = require('../models/entities/oneTimePayment');
const { fetchVendorCredentials } = require('../utils/credentialsClient');
const { getVirtualAccountBalanceV2, initiateTransfer, extractBalance } = require('../utils/decentroGateway');
const { escapeSearch } = require('../utils/escapeRegex');

const ACTIVE_STATUSES = ['ACTIVE', 'CONFIRMED', 'INPROBATION'];

// ---- helpers ---------------------------------------------------------------



const extractProviderStatus = (res = {}) => {
  const d = res.data || {};
  return String(
    d.transaction_status || d.transactionStatus || d.txn_status ||
    d.transfer_status || d.status ||
    res.transaction_status || res.transactionStatus ||
    res.transfer_status || res.status || ''
  ).toUpperCase();
};

const extractProviderMessage = (res = {}) =>
  String(
    res.message || res.status_description || res.response_message ||
    res.data?.message || res.data?.status_description || ''
  );

const extractDecentroTxnId = (res = {}) =>
  String(
    res.decentro_txn_id || res.decentroTxnId ||
    res.data?.decentro_txn_id || res.data?.decentroTxnId ||
    res.data?.transaction_id || ''
  );

const SUCCESS_STATUSES = new Set(['SUCCESS', 'COMPLETED', 'COMPLETE', 'PAID', 'PROCESSED']);
const FAILED_STATUSES  = new Set(['FAILED', 'FAILURE', 'FAILD', 'REJECTED', 'CANCELLED', 'CANCELED', 'EXPIRED', 'ERROR']);

// ---- controllers -----------------------------------------------------------

/**
 * GET /one-time-payment/employees
 * Employees with verified bank (Approved) and active beneficiary (Added)
 */
exports.listEligibleEmployees = asyncHandler(async (req, res) => {
  const corporateUser = req.user._id;
  const { search } = req.query;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  // Only employees whose default bank account is verified + beneficiary added
  const bankRecords = await BankDetails.find({
    isDefaultAccount: true,
    bankAccountStatus: 'Approved',
    beneficiaryStatus: 'Added',
  }).select('employeeId').lean();

  const eligibleIds = bankRecords.map(b => b.employeeId);

  const filter = {
    corporateUser,
    isEmployeeDeleted: false,
    'employeeInformation.employeeStatus': { $in: ACTIVE_STATUSES },
    'offBoardingInformation.offBoardingType': { $in: [null, ''] },
    _id: { $in: eligibleIds },
  };

  if (search) {
    const regex = new RegExp(escapeSearch(search), 'i');
    filter.$or = [
      { 'personalInformation.fullName': regex },
      { 'employeeInformation.employeeId': regex },
      { 'personalInformation.email': regex },
    ];
  }

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .select('personalInformation.fullName personalInformation.email employeeInformation.employeeId employeeInformation.employeeStatus employeeInformation.dateOfJoin')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);

  const empIds = employees.map(e => e._id);
  const bankList = await BankDetails.find({ employeeId: { $in: empIds }, isDefaultAccount: true }).lean();
  const bankMap = {};
  bankList.forEach(b => { bankMap[b.employeeId.toString()] = b; });

  const rows = employees.map(emp => {
    const bd = bankMap[emp._id.toString()] || null;
    return {
      id:               emp._id,
      fullName:         emp.personalInformation?.fullName       || null,
      email:            emp.personalInformation?.email          || null,
      employeeId:       emp.employeeInformation?.employeeId     || null,
      employeeStatus:   emp.employeeInformation?.employeeStatus || null,
      dateOfJoin:       emp.employeeInformation?.dateOfJoin     || null,
      accountName:      bd?.accountName      || null,
      accountNumber:    bd?.accountNumber    || null,
      bankName:         bd?.bankName         || null,
      ifscCode:         bd?.ifscCode         || null,
      bankAccountStatus: bd?.bankAccountStatus || null,
      beneficiaryStatus: bd?.beneficiaryStatus || null,
    };
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Eligible employees fetched successfully',
    data: { rows, count: total },
  });
});

/**
 * POST /one-time-payment
 * Initiate a one-time payment payout to an employee
 */
exports.initiateOneTimePayment = asyncHandler(async (req, res) => {
  const corporateUser = req.user._id;
  console.log(corporateUser,"corporateUserrrr")
  const { employeeId, amount, month: monthParam, remark } = req.body;

  if (!employeeId || !amount || !monthParam) {
    throw new ErrorResponse('employeeId, amount and month are required', 400);
  }
  if (Number(amount) <= 0) {
    throw new ErrorResponse('amount must be greater than 0', 400);
  }

  // Parse "YYYY-MM" → { year, month }
  const [parsedYear, parsedMonth] = String(monthParam).split('-').map(Number);
  if (!parsedYear || !parsedMonth || parsedMonth < 1 || parsedMonth > 12) {
    throw new ErrorResponse('month must be in YYYY-MM format', 400);
  }

  // Validate employee belongs to corporate
  const employee = await Employee.findOne({
    _id: employeeId,
    corporateUser,
    isEmployeeDeleted: false,
    'employeeInformation.employeeStatus': { $in: ACTIVE_STATUSES },
  }).select('personalInformation.fullName personalInformation.email').lean();

  if (!employee) {
    throw new ErrorResponse('Employee not found or not active', 404);
  }

  // Validate bank is verified + beneficiary added
  const bankDetails = await BankDetails.findOne({
    employeeId,
    bankAccountStatus: 'Approved',
    beneficiaryStatus: 'Added',
  }).lean();

  if (!bankDetails) {
    throw new ErrorResponse('Employee does not have a verified bank account with an active beneficiary', 400);
  }

  // Get corporate virtual account via Redis pub/sub → payment MS MySQL
  const vaRecord = await fetchVendorCredentials({
    accessKey:corporateUser.toString(),
    serviceType: 'VIRTUAL_ACCOUNT',
  });
 
  if (!vaRecord?.virtualAccountNumber) {
    throw new ErrorResponse('Payroll virtual account not found for this merchant', 400);
  }

  // Always debit the caller's own virtual account; a client-supplied account is ignored.
  const payFromAccount = vaRecord.virtualAccountNumber;

  // Check VA balance
  const balanceData = await getVirtualAccountBalanceV2({
    accountNumber: vaRecord.virtualAccountNumber,
    customerId: corporateUser,
  });
  const availableBalance = extractBalance(balanceData);

  if (availableBalance !== null && availableBalance < Number(amount)) {
    throw new ErrorResponse(
      `Insufficient balance. Available: ₹${availableBalance}, Required: ₹${amount}`,
      400
    );
  }

  const referenceId = `OTP_${uuidv4()}`;

  const providerRequest = {
    referenceId,
    amount: Number(amount),
    transferType: 'IMPS',
    fromAccount: payFromAccount,
    beneficiaryDetails: {
      name:          bankDetails.accountName,
      accountNumber: bankDetails.accountNumber,
      ifscCode:      bankDetails.ifscCode,
      email:         employee.personalInformation?.email || '',
    },
    purposeMessage: remark || `One-time payment ${parsedMonth}/${parsedYear}`,
  };

  // Persist as PENDING before calling provider
  const record = await OneTimePayment.create({
    corporateUser,
    employee: employeeId,
    amount:   Number(amount),
    remark:   remark || '',
    month:    parsedMonth,
    year:     parsedYear,
    payFrom:  payFromAccount,
    referenceId,
    paymentStatus: 'PENDING',
    providerRequest,
    initiatedAt: new Date(),
    statusHistory: [{ status: 'PENDING', message: 'Payout request queued', occurredAt: new Date() }],
  });

  let providerResponse;
  try {
    providerResponse = await initiateTransfer({
      credentialId: corporateUser,
      corporateUserId: corporateUser,
      ...providerRequest,
    });
  } catch (err) {
    await OneTimePayment.findByIdAndUpdate(record._id, {
      paymentStatus: 'FAILED',
      providerResponse: { error: err.message },
      failedAt: new Date(),
      $push: { statusHistory: { status: 'FAILED', message: err.message, occurredAt: new Date() } },
    });
    throw new ErrorResponse(`Transfer initiation failed: ${err.message}`, 500);
  }

  const providerStatus  = extractProviderStatus(providerResponse);
  const providerMessage = extractProviderMessage(providerResponse);
  const decentroTxnId   = extractDecentroTxnId(providerResponse);

  const isFailed    = FAILED_STATUSES.has(providerStatus);
  const isSucceeded = SUCCESS_STATUSES.has(providerStatus);

  const finalStatus = isFailed ? 'FAILED' : isSucceeded ? 'SUCCESS' : 'INITIATED';

  const update = {
    paymentStatus:    finalStatus,
    decentroTxnId,
    providerResponse,
    $push: {
      statusHistory: {
        status: finalStatus,
        message: providerMessage || `Payout ${finalStatus.toLowerCase()}`,
        occurredAt: new Date(),
        raw: providerResponse,
      },
    },
  };
  if (isSucceeded) update.completedAt = new Date();
  if (isFailed)    update.failedAt    = new Date();

  const updated = await OneTimePayment.findByIdAndUpdate(record._id, update, { new: true });

  return res.status(201).json({
    status: true,
    responseCode: '000',
    message: 'One-time payment initiated',
    data: {
      id:            updated._id,
      referenceId:   updated.referenceId,
      decentroTxnId: updated.decentroTxnId,
      paymentStatus: updated.paymentStatus,
      amount:        updated.amount,
      month:         updated.month,
      year:          updated.year,
    },
  });
});

/**
 * GET /one-time-payment
 * List one-time payment history for the corporate
 */
exports.listOneTimePayments = asyncHandler(async (req, res) => {
  const corporateUser = req.user._id;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const { month, year, status } = req.query;

  const filter = { corporateUser };
  if (month) filter.month = Number(month);
  if (year)  filter.year  = Number(year);
  if (status) filter.paymentStatus = status.toUpperCase();

  const [records, total] = await Promise.all([
    OneTimePayment.find(filter)
      .populate('employee', 'personalInformation.fullName personalInformation.email employeeInformation.employeeId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    OneTimePayment.countDocuments(filter),
  ]);

  const rows = records.map(r => ({
    id:            r._id,
    referenceId:   r.referenceId,
    decentroTxnId: r.decentroTxnId,
    paymentStatus: r.paymentStatus,
    amount:        r.amount,
    remark:        r.remark,
    month:         r.month,
    year:          r.year,
    payFrom:       r.payFrom,
    initiatedAt:   r.initiatedAt,
    completedAt:   r.completedAt,
    failedAt:      r.failedAt,
    employee: {
      id:         r.employee?._id,
      fullName:   r.employee?.personalInformation?.fullName   || null,
      email:      r.employee?.personalInformation?.email      || null,
      employeeId: r.employee?.employeeInformation?.employeeId || null,
    },
  }));

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'One-time payments fetched successfully',
    data: { rows, count: total },
  });
});
