'use strict';

const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/error-response');
const Employee = require('../models/entities/employee');
const BankDetails = require('../models/entities/bankDetails');
const Salary = require('../models/entities/salary');
const { validateCashfreeBankAccount } = require('../models/use-cases/verifyAccount');
const { generateExcelBufferAndType } = require('../utils/documentToBuffer');
const { customLog } = require('../utils/loggerHelper');
const { manageBeneficiary } = require('../utils/decentroGateway');
const { fetchVendorCredentials } = require('../utils/credentialsClient');
const { filterEmployeesOfCorporate } = require('../utils/tenantScope');
const { escapeSearch } = require('../utils/escapeRegex');

const ACTIVE_STATUSES = ['ACTIVE', 'CONFIRMED', 'INPROBATION'];
const PAST_STATUSES   = ['RESIGNED', 'SUSPENDED'];
const ALL_STATUSES    = ['ACTIVE', 'CONFIRMED', 'INPROBATION', 'LEAVE', 'RESIGNED', 'SUSPENDED'];

const PAST_OFFBOARDING_TYPES = ['RESIGNATION', 'SUSPENSION', 'RESIGNED', 'SUSPENDED'];

const buildPastEmployeeFilter = () => ({
  $and: [
    {
      'offBoardingInformation.offBoardingType': { $in: PAST_OFFBOARDING_TYPES },
    },
  ],
});

exports.listEmployees = asyncHandler(async (req, res) => {
  const corporateUser = req.user?._id;
  if (!corporateUser) return res.status(400).json({ status: false, message: 'corporateId is required', responseCode: '001' });

  const { search } = req.query;
  const status = req.query.status?.toUpperCase();
  const hasBank = req.query.hasBank === 'true';
  const unverified = req.query.unverified === 'true';
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  const filter = {
    corporateUser,
    isEmployeeDeleted: false,
    'employeeInformation.employeeStatus': { $in: ACTIVE_STATUSES },
    'offBoardingInformation.offBoardingType': { $in: [null, ''] },
  };

  if (hasBank) {
    const bankFilter = { isDefaultAccount: true, accountNumber: { $exists: true, $ne: null } };
    if (unverified) bankFilter.bankAccountStatus = { $ne: 'Approved' };
    const bankRecords = await BankDetails.find(bankFilter).select('employeeId').lean();
    const idsWithBank = bankRecords.map(b => b.employeeId);
    filter._id = { $in: idsWithBank };
    filter['employeeInformation.employeeStatus'] = { $in: ACTIVE_STATUSES };
    filter['offBoardingInformation.offBoardingType'] = { $in: [null, ''] };
  }

  if (status === 'ALL') {
    delete filter['employeeInformation.employeeStatus'];
    delete filter['offBoardingInformation.offBoardingType'];
  } else if (status === 'PAST') {
    delete filter['employeeInformation.employeeStatus'];
    delete filter['offBoardingInformation.offBoardingType'];
    Object.assign(filter, buildPastEmployeeFilter());
  } else if (status === 'ACTIVE') {
    filter['employeeInformation.employeeStatus'] = { $in: ACTIVE_STATUSES };
  } else if (status && ALL_STATUSES.includes(status)) {
    filter['employeeInformation.employeeStatus'] = status;
    if (!ACTIVE_STATUSES.includes(status)) {
      delete filter['offBoardingInformation.offBoardingType'];
    }
  }

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
      .select('profileImage personalInformation.fullName personalInformation.email employeeInformation.employeeId employeeInformation.employeeStatus employeeInformation.dateOfJoin offBoardingInformation.offBoardingDate offBoardingInformation.lastWorkingDay')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);

  const employeeIds = employees.map(e => e._id);

  const [bankDetailsList, salaries] = await Promise.all([
    BankDetails.find({ employeeId: { $in: employeeIds }, isDefaultAccount: true }).lean(),
    Salary.find({ corporateUser, employee: { $in: employeeIds }, paymentStatus: 'APPROVED' })
      .sort({ year: -1, month: -1 })
      .lean(),
  ]);

  const bankMap = {};
  bankDetailsList.forEach(bd => { bankMap[bd.employeeId.toString()] = bd; });

  const salaryMap = {};
  salaries.forEach(s => {
    const key = s.employee.toString();
    if (!salaryMap[key]) salaryMap[key] = s;
  });

  const rows = employees.map(emp => {
    const bd  = bankMap[emp._id.toString()]  || null;
    const sal = salaryMap[emp._id.toString()] || null;

    return {
      id:                    emp._id,
      profileImage:          emp.profileImage                            || null,
      fullName:              emp.personalInformation?.fullName            || null,
      email:                 emp.personalInformation?.email               || null,
      employeeId:            emp.employeeInformation?.employeeId          || null,
      employeeStatus:        emp.employeeInformation?.employeeStatus      || null,
      dateOfJoin:            emp.employeeInformation?.dateOfJoin          || null,
      offBoardingDate:       emp.offBoardingInformation?.offBoardingDate  || null,
      lastWorkingDay:        emp.offBoardingInformation?.lastWorkingDay   || null,
      fullAndFinalSettlement: sal?.totalPayable ?? null,
      salary:                sal?.totalPayable ?? null,
      accountName:       bd?.accountName       || null,
      accountNumber:     bd?.accountNumber     || null,
      bankName:          bd?.bankName          || null,
      ifscCode:          bd?.ifscCode          || null,
      upiId:             bd?.upiId             || null,
      transactionType:   bd?.transactionType   || null,
      bankAccountStatus: bd?.bankAccountStatus || 'Pending Verification',
      beneficiaryStatus: bd?.beneficiaryStatus || 'Pending',
      remark:            bd?.remark            || null,
    };
  });

  return res.status(200).json({
    status: true,
    message: 'Employees fetched successfully',
    data: { rows, count: total,  },
    responseCode: '000',
  });
});

exports.updateEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const corporateUser  = req.user?._id;

  let bankDetails = await BankDetails.findOne({ employeeId, isDefaultAccount: true });

  // Verification/beneficiary statuses are set only by the verify and add-beneficiary flows,
  // never from the client.
  const allowed = ['transactionType', 'remark', 'accountNumber', 'accountName', 'bankName', 'ifscCode', 'upiId'];

  if (bankDetails) {
    const accountChanged =
      (req.body.accountNumber !== undefined && req.body.accountNumber !== bankDetails.accountNumber) ||
      (req.body.ifscCode !== undefined && req.body.ifscCode !== bankDetails.ifscCode);
    allowed.forEach(field => {
      if (req.body[field] !== undefined) bankDetails[field] = req.body[field];
    });
    if (req.body.remarks !== undefined) bankDetails.remark = req.body.remarks;
    // A changed destination account must be verified and added as a beneficiary again.
    if (accountChanged) {
      bankDetails.bankAccountStatus = 'Pending';
      bankDetails.beneficiaryStatus = 'Pending';
    }
  } else {
    const data = { employeeId, corporateUser, isDefaultAccount: true };
    allowed.forEach(field => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });
    if (req.body.remarks !== undefined) data.remark = req.body.remarks;
    bankDetails = new BankDetails(data);
  }

  await bankDetails.save();

  return res.status(200).json({
    status: true,
    message: 'Employee details updated successfully',
    data: bankDetails,
    responseCode: '000',
  });
});

exports.getSalaryBreakup = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;
  const corporateUser = req.user?._id;

  const salary = await Salary.findOne({ corporateUser, employee: employeeId })
    .sort({ year: -1, month: -1 })
    .lean();

  if (!salary) return next(new ErrorResponse('No salary record found for this employee', 404));

  const si = salary.salaryInformation || {};

  const earnings = [];
  if (si.basicPay > 0)            earnings.push({ componentName: 'Basic Pay',              calculatedAmount: si.basicPay });
  if (si.increamentAmount > 0)    earnings.push({ componentName: 'Increment',              calculatedAmount: si.increamentAmount });
  if (si.hraAmount > 0)           earnings.push({ componentName: 'House Rent Allowance',   calculatedAmount: si.hraAmount });
  if (si.daAmount > 0)            earnings.push({ componentName: 'Dearness Allowance',     calculatedAmount: si.daAmount });
  if (si.other > 0)               earnings.push({ componentName: 'Other Allowance',        calculatedAmount: si.other });
  if (salary.totalBonus > 0)      earnings.push({ componentName: 'Bonus',                  calculatedAmount: salary.totalBonus });
  if (salary.totalIncentive > 0)  earnings.push({ componentName: 'Incentives',             calculatedAmount: salary.totalIncentive });
  if (salary.totalOvertime > 0)   earnings.push({ componentName: 'Overtime Allowance',     calculatedAmount: salary.totalOvertime });
  if (salary.totalReimbursement > 0) earnings.push({ componentName: 'Reimbursement',       calculatedAmount: salary.totalReimbursement });

  const deductions = [];
  if (si.epfAmount > 0) deductions.push({ componentName: 'Provident Fund (PF)', calculatedAmount: si.epfAmount });
  if (si.esiAmount > 0) deductions.push({ componentName: 'ESI',                 calculatedAmount: si.esiAmount });
  if (si.lwfAmount > 0) deductions.push({ componentName: 'LWF',                 calculatedAmount: si.lwfAmount });
  if (si.tdsAmount > 0) deductions.push({ componentName: 'TDS',                 calculatedAmount: si.tdsAmount });

  const otherDeduction = (si.deductionAmount || 0) - (si.epfAmount || 0) - (si.esiAmount || 0) - (si.lwfAmount || 0);
  if (otherDeduction > 0) deductions.push({ componentName: 'Other Deductions', calculatedAmount: otherDeduction });

  if (salary.leaveDeduction > 0) deductions.push({ componentName: 'Leave Deduction', calculatedAmount: salary.leaveDeduction });

  const grossSalary     = earnings.reduce((sum, e) => sum + e.calculatedAmount, 0);
  const knownDeductions = deductions.reduce((sum, d) => sum + d.calculatedAmount, 0);
  const netPayable      = salary.totalPayable ?? 0;
  const gap             = Math.round((grossSalary - knownDeductions - netPayable) * 100) / 100;
  if (gap > 0) deductions.push({ componentName: 'Other Deductions', calculatedAmount: gap });

  const totalDeductions = deductions.reduce((sum, d) => sum + d.calculatedAmount, 0);

  return res.status(200).json({
    status: true,
    message: 'Salary breakup fetched successfully',
    data: {
      month:          salary.month,
      year:           salary.year,
      grossSalary,
      totalDeductions,
      totalPayable:   salary.totalPayable ?? 0,
      earnings,
      deductions,
    },
    responseCode: '000',
  });
});

exports.verifyBankAccount = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;

  const bankDetails = await BankDetails.findOne({ employeeId, isDefaultAccount: true });
  if (!bankDetails) return next(new ErrorResponse('No default bank details found for this employee', 404));

  if (!bankDetails.accountNumber || !bankDetails.ifscCode)
    return next(new ErrorResponse('Bank account number and IFSC are required to verify', 400));

  const { perform_name_match } = req.body;

  let result;
  try {
    result = await validateCashfreeBankAccount({
      payload: {
        perform_name_match,
        beneficiary_details: {
          account_number: bankDetails.accountNumber,
          ifsc:           bankDetails.ifscCode,
          name:           bankDetails.accountName,
        },
      },
    });
  } catch (err) {
    customLog(null, 'error', { message: err.message, data: err.response?.data });
    return next(new ErrorResponse(err.message || 'Bank account verification failed', 502));
  }

  bankDetails.bankAccountStatus = result?.accountValid ? 'Completed' : 'Failed';
  await bankDetails.save();

  return res.status(200).json({
    status: true,
    message: result?.message || 'Bank account verified successfully',
    data: result,
    responseCode: '000',
  });
});

exports.addBeneficiary = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.params;
  const corporateId = req.user?._id;

  const bankDetails = await BankDetails.findOne({ employeeId, isDefaultAccount: true });
  if (!bankDetails) return next(new ErrorResponse('No default bank details found for this employee', 404));

  if (!['Approved', 'Completed'].includes(bankDetails.bankAccountStatus))
    return next(new ErrorResponse('Bank account must be verified before adding a beneficiary', 400));

  const { sender_mobile } = req.body;

  let vaRecord;
  try {
    vaRecord = await fetchVendorCredentials({ accessKey: corporateId.toString(), serviceType: 'VIRTUAL_ACCOUNT' });
    console.log("VAA record", vaRecord);
  } catch (err) {
    return next(new ErrorResponse(err.message || 'Failed to fetch corporate virtual account', 500));
  }
  const senderAccountNumber = vaRecord?.virtualAccountNumber;
  if (!senderAccountNumber)
    return next(new ErrorResponse('Payroll virtual account not found for this corporate', 400));

  const result = await manageBeneficiary({
    action:               'ADD',
    senderAccountNumber,
    accountNumber:        bankDetails.accountNumber,
    ifscCode:             bankDetails.ifscCode,
    name:                 bankDetails.accountName,
    transferType:         bankDetails.transactionType,
    mobile:               sender_mobile,
  });

  bankDetails.beneficiaryStatus = 'Added';
  await bankDetails.save();

  return res.status(200).json({
    status: true,
    message: 'Beneficiary added successfully',
    data: result,
    responseCode: '000',
  });
});

exports.bulkVerifyBankAccounts = asyncHandler(async (req, res, next) => {
  const { employeeIds } = req.body;

  if (!Array.isArray(employeeIds) || employeeIds.length === 0)
    return next(new ErrorResponse('employeeIds array is required', 400));

  const ownedEmployeeIds = new Set((await filterEmployeesOfCorporate(employeeIds, req.user?._id)).map(String));

  const results = await Promise.all(employeeIds.map(async (employeeId) => {
    if (!ownedEmployeeIds.has(String(employeeId))) {
      return { employeeId, success: false, message: 'Employee not found' };
    }

    const bankDetails = await BankDetails.findOne({ employeeId, isDefaultAccount: true });

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      return { employeeId, success: false, message: 'No valid bank details found' };
    }

    let decentroResult;
    try {
      decentroResult = await validateCashfreeBankAccount({
        payload: {
          perform_name_match: true,
          beneficiary_details: {
            account_number: bankDetails.accountNumber,
            ifsc:           bankDetails.ifscCode,
            name:           bankDetails.accountName,
          },
        },
      });
    } catch (err) {
      customLog(null, 'error', { message: `Error verifying bank account for employee ${employeeId}`, error: err.message });
      return { employeeId, success: false, message: err.message };
    }

    const isSuccess = decentroResult?.accountValid === true;
    bankDetails.bankAccountStatus = isSuccess ? 'Completed' : 'Failed';
    await bankDetails.save();

    return {
      employeeId,
      success: isSuccess,
      message: decentroResult?.message || (isSuccess ? 'Bank account verified successfully' : 'Verification failed'),
      bankAccountStatus: bankDetails.bankAccountStatus,
      data: decentroResult,
    };
  }));

  const succeeded = results.filter(r => r.success).length;
  const failed    = results.filter(r => !r.success).length;

  return res.status(200).json({
    status: failed === 0,
    message: `Bulk verification complete: ${succeeded} succeeded, ${failed} failed`,
    data: {
      summary: { total: results.length, succeeded, failed },
      results,
    },
    responseCode: failed === 0 ? '000' : '001',
  });
});

exports.listPendingVerification = asyncHandler(async (req, res) => {
  const corporateUser = req.user?._id;
  if (!corporateUser) return res.status(400).json({ status: false, message: 'corporateId is required', responseCode: '001' });

  const bankRecords = await BankDetails.find({
    isDefaultAccount: true,
    accountNumber: { $exists: true, $ne: null },
    ifscCode: { $exists: true, $ne: null },
    bankAccountStatus: { $ne: 'Approved' },
  }).select('employeeId bankAccountStatus beneficiaryStatus').lean();

  const employeeIdToStatus = {};
  bankRecords.forEach(b => {
    employeeIdToStatus[b.employeeId.toString()] = {
      bankAccountStatus: b.bankAccountStatus || 'Pending Verification',
      beneficiaryStatus: b.beneficiaryStatus || 'Pending',
    };
  });

  const employeeIds = bankRecords.map(b => b.employeeId);

  const employees = await Employee.find({
    _id: { $in: employeeIds },
    corporateUser,
    isEmployeeDeleted: false,
    'employeeInformation.employeeStatus': { $in: ACTIVE_STATUSES },
    'offBoardingInformation.offBoardingType': { $in: [null, ''] },
  })
    .select('personalInformation.fullName personalInformation.email employeeInformation.employeeStatus')
    .lean();

  const rows = employees.map(emp => {
    const statuses = employeeIdToStatus[emp._id.toString()] || {};
    return {
      id:               emp._id,
      fullName:         emp.personalInformation?.fullName       || null,
      email:            emp.personalInformation?.email          || null,
      employeeStatus:   emp.employeeInformation?.employeeStatus || null,
      bankAccountStatus: statuses.bankAccountStatus || 'Pending Verification',
      beneficiaryStatus: statuses.beneficiaryStatus || 'Pending',
    };
  });

  return res.status(200).json({
    status: true,
    message: 'Pending verification employees fetched successfully',
    data: rows,
    responseCode: '000',
  });
});

exports.listPendingBeneficiary = asyncHandler(async (req, res) => {
  const corporateUser = req.user?._id;
  if (!corporateUser) return res.status(400).json({ status: false, message: 'corporateId is required', responseCode: '001' });

  const employees = await Employee.find({
    corporateUser,
    isEmployeeDeleted: false,
    'employeeInformation.employeeStatus': { $in: ACTIVE_STATUSES },
    'offBoardingInformation.offBoardingType': { $in: [null, ''] },
  })
    .select('personalInformation.fullName personalInformation.email employeeInformation.employeeStatus')
    .lean();

  const employeeIds = employees.map(e => e._id);

  const bankRecords = await BankDetails.find({
    employeeId: { $in: employeeIds },
    isDefaultAccount: true,
  }).select('employeeId bankAccountStatus beneficiaryStatus accountNumber ifscCode accountName transactionType').lean();

  const bankMap = {};
  bankRecords.forEach(b => { bankMap[b.employeeId.toString()] = b; });

  const rows = employees
    .map(emp => {
      const bank = bankMap[emp._id.toString()] || null;
      return {
        id:                emp._id,
        fullName:          emp.personalInformation?.fullName       || null,
        email:             emp.personalInformation?.email          || null,
        employeeStatus:    emp.employeeInformation?.employeeStatus || null,
        bankAccountStatus: bank?.bankAccountStatus                 || 'Pending',
        beneficiaryStatus: bank?.beneficiaryStatus                 || 'Pending',
        accountNumber:     bank?.accountNumber                     || null,
        accountName:       bank?.accountName                       || null,
        ifscCode:          bank?.ifscCode                          || null,
        transactionType:   bank?.transactionType                   || null,
      };
    })
    .filter(row => row.beneficiaryStatus !== 'Added');

  return res.status(200).json({
    status: true,
    message: 'Employees pending bank setup fetched successfully',
    data: rows,
    responseCode: '000',
  });
});

exports.listVerifiedEmployees = asyncHandler(async (req, res) => {
  const corporateUser = req.user?._id;
  if (!corporateUser) return res.status(400).json({ status: false, message: 'corporateId is required', responseCode: '001' });

  const bankRecords = await BankDetails.find({
    isDefaultAccount: true,
    bankAccountStatus: 'Approved',
    beneficiaryStatus: 'Added',
  }).select('employeeId bankAccountStatus beneficiaryStatus accountNumber accountName bankName ifscCode transactionType upiId').lean();

  const employeeIdToBank = {};
  bankRecords.forEach(b => { employeeIdToBank[b.employeeId.toString()] = b; });

  const employeeIds = bankRecords.map(b => b.employeeId);

  const [employees, salaries] = await Promise.all([
    Employee.find({
      _id: { $in: employeeIds },
      corporateUser,
      isEmployeeDeleted: false,
      'employeeInformation.employeeStatus': { $in: ACTIVE_STATUSES },
      'offBoardingInformation.offBoardingType': { $in: [null, ''] },
    })
      .select('personalInformation.fullName personalInformation.email employeeInformation.employeeId employeeInformation.employeeStatus')
      .lean(),
    Salary.find({ corporateUser, employee: { $in: employeeIds }, paymentStatus: 'APPROVED' })
      .sort({ year: -1, month: -1 })
      .lean(),
  ]);

  const salaryMap = {};
  salaries.forEach(s => {
    const key = s.employee.toString();
    if (!salaryMap[key]) salaryMap[key] = s;
  });

  const rows = employees.map(emp => {
    const bank = employeeIdToBank[emp._id.toString()] || {};
    const sal  = salaryMap[emp._id.toString()] || null;
    return {
      id:                emp._id,
      fullName:          emp.personalInformation?.fullName            || null,
      email:             emp.personalInformation?.email               || null,
      employeeId:        emp.employeeInformation?.employeeId          || null,
      employeeStatus:    emp.employeeInformation?.employeeStatus      || null,
      salary:            sal?.totalPayable ?? null,
      bankAccountStatus: bank.bankAccountStatus || null,
      beneficiaryStatus: bank.beneficiaryStatus || null,
      accountNumber:     bank.accountNumber     || null,
      accountName:       bank.accountName       || null,
      bankName:          bank.bankName          || null,
      ifscCode:          bank.ifscCode          || null,
      transactionType:   bank.transactionType   || null,
      upiId:             bank.upiId             || null,
    };
  });

  return res.status(200).json({
    status: true,
    message: 'Verified employees fetched successfully',
    data: { rows, count: rows.length },
    responseCode: '000',
  });
});

exports.bulkAddBeneficiaries = asyncHandler(async (req, res, next) => {
  console.log("Request body in bulk add beneficiaries:", req.body);
  const corporateId = req.user?._id;
  const { employeeIds, sender_mobile } = req.body;

  if (!Array.isArray(employeeIds) || employeeIds.length === 0)
    return next(new ErrorResponse('employeeIds array is required', 400));

  let vaRecord;
  try {
    vaRecord = await fetchVendorCredentials({ accessKey: corporateId.toString(), serviceType: 'VIRTUAL_ACCOUNT' });
    console.log("VAA record from controller!!", vaRecord);
  } catch (err) {
    console.log("Error fetching VA record in add benficiary controller!!", err);
    customLog(req?.LogTraceId, 'error', { message: err?.message });
    return next(new ErrorResponse(err.message || 'Failed to fetch corporate virtual account', 500));
  }
  const senderAccountNumber = vaRecord?.virtualAccountNumber;
  if (!senderAccountNumber)
    return next(new ErrorResponse('Payroll virtual account not found for this corporate', 400));

  const ownedEmployeeIds = new Set((await filterEmployeesOfCorporate(employeeIds, corporateId)).map(String));

  const results = await Promise.all(employeeIds.map(async (employeeId) => {
    if (!ownedEmployeeIds.has(String(employeeId))) {
      return { employeeId, success: false, message: 'Employee not found' };
    }

    const bankDetails = await BankDetails.findOne({ employeeId, isDefaultAccount: true });
    console.log(`Bank details for employee ${employeeId}:`, bankDetails);

    if (!bankDetails) return { employeeId, success: false, message: 'No bank details found' };
    if (!bankDetails.accountNumber || !bankDetails.ifscCode)
      return { employeeId, success: false, message: 'Bank account number and IFSC are required' };

    const alreadyVerified = ['Approved', 'Completed'].includes(bankDetails.bankAccountStatus);
    console.log('alreadyVerified!!', alreadyVerified, bankDetails.bankAccountStatus);
    if (!alreadyVerified) {
      let verifyResult;
      try {
        verifyResult = await validateCashfreeBankAccount({
          payload: {
            perform_name_match: true,
            beneficiary_details: {
              account_number: bankDetails.accountNumber,
              ifsc:           bankDetails.ifscCode,
              name:           bankDetails.accountName,
            },
          },
        });
        console.log(`Verification result for employee ${employeeId}:`, verifyResult);
      } catch (err) {
        customLog(null, 'error', { message: `Bank verification error for employee ${employeeId}`, error: err.message });
        return { employeeId, success: false, message: err.message || 'Bank account verification failed' };
      }

      bankDetails.bankAccountStatus = verifyResult?.accountValid ? 'Completed' : 'Failed';
      await bankDetails.save();

      if (!verifyResult?.accountValid) {
        return {
          employeeId,
          success: false,
          message: verifyResult?.message || 'Bank account verification failed',
          bankAccountStatus: bankDetails.bankAccountStatus,
          data: verifyResult,
        };
      }
    }

    let decentroResult;
    try {
      decentroResult = await manageBeneficiary({
        action:               'ADD',
        senderAccountNumber,
        accountNumber:        bankDetails.accountNumber,
        ifscCode:             bankDetails.ifscCode,
        name:                 bankDetails.accountName,
        transferType:         bankDetails.transactionType,
        mobile:               sender_mobile,
      });
    } catch (err) {
      console.log("Error for adding beneficiary", err);
      return { employeeId, success: false, message: err.message };
    }

    const isSuccess = decentroResult?.status === 'SUCCESS';
    if (isSuccess) {
      bankDetails.beneficiaryStatus = 'Added';
      await bankDetails.save();
    }

    return {
      employeeId,
      success: isSuccess,
      message: decentroResult?.message || (isSuccess ? 'Beneficiary added successfully' : 'Failed to add beneficiary'),
      bankAccountStatus: bankDetails.bankAccountStatus,
      beneficiaryStatus: bankDetails.beneficiaryStatus,
      data: decentroResult,
    };
  }));

  const succeeded = results.filter(r => r.success).length;
  const failed    = results.filter(r => !r.success).length;

  return res.status(200).json({
    status: failed === 0,
    message: `Bulk beneficiary add complete: ${succeeded} succeeded, ${failed} failed`,
    data: {
      summary: { total: results.length, succeeded, failed },
      results,
    },
    responseCode: failed === 0 ? '000' : '001',
  });
});

exports.exportEmployees = asyncHandler(async (req, res, next) => {
  const corporateUser = req.user?._id;
  if (!corporateUser) return next(new ErrorResponse('corporateId is required', 400));

  const type = req.query.type;
  if (!type || !['active', 'past'].includes(type)) {
    return next(new ErrorResponse('type must be "active" or "past"', 400));
  }

  const isPast = type === 'past';
  const statusFilter = isPast ? PAST_STATUSES : ACTIVE_STATUSES;

  const filter = {
    corporateUser,
    isEmployeeDeleted: false,
    ...(isPast
      ? buildPastEmployeeFilter()
      : {
        'employeeInformation.employeeStatus': { $in: statusFilter },
        'offBoardingInformation.offBoardingType': { $in: [null, ''] },
      }),
  };

  const employees = await Employee.find(filter)
    .select('personalInformation.fullName personalInformation.email employeeInformation.employeeId employeeInformation.dateOfJoin offBoardingInformation.offBoardingDate')
    .lean();

  if (employees.length === 0) {
    return next(new ErrorResponse('No data available to export', 400));
  }

  const employeeIds = employees.map(e => e._id);

  const [bankDetailsList, salaries] = await Promise.all([
    BankDetails.find({ employeeId: { $in: employeeIds }, isDefaultAccount: true }).lean(),
    Salary.find({ corporateUser, employee: { $in: employeeIds } }).sort({ year: -1, month: -1 }).lean(),
  ]);

  const bankMap = {};
  bankDetailsList.forEach(bd => { bankMap[bd.employeeId.toString()] = bd; });

  const salaryMap = {};
  salaries.forEach(s => {
    const key = s.employee.toString();
    if (!salaryMap[key]) salaryMap[key] = s;
  });

  const formatDate = d => d ? new Date(d).toISOString().split('T')[0] : 'N/A';

  let excelData;
  if (isPast) {
    excelData = employees.map(emp => {
      const bd  = bankMap[emp._id.toString()]  || {};
      const sal = salaryMap[emp._id.toString()] || {};
      return {
        'Employee':                `${emp.personalInformation?.fullName || 'N/A'} (${emp.personalInformation?.email || 'N/A'})`,
        'Employee ID':             emp.employeeInformation?.employeeId          || 'N/A',
        'Joining Date':            formatDate(emp.employeeInformation?.dateOfJoin),
        'Offboarding Date':        formatDate(emp.offBoardingInformation?.offBoardingDate),
        'Full and Final Settlement': sal?.totalPayable ?? 'N/A',
        'Remark':                  bd?.remark || 'N/A',
      };
    });
  } else {
    excelData = employees.map(emp => {
      const bd  = bankMap[emp._id.toString()]  || {};
      const sal = salaryMap[emp._id.toString()] || {};
      return {
        'Employee':            `${emp.personalInformation?.fullName || 'N/A'} (${emp.personalInformation?.email || 'N/A'})`,
        'Employee ID':         emp.employeeInformation?.employeeId          || 'N/A',
        'Salary':              sal?.totalPayable ?? 'N/A',
        'Account Detail':      bd?.accountNumber ? `${bd.accountNumber} (${bd.bankName || 'N/A'})` : 'N/A',
        'Account Holder Name': bd?.accountName   || 'N/A',
        'IFSC Code':           bd?.ifscCode      || 'N/A',
        'Transaction Type':         bd?.transactionType   || 'N/A',
        'Bank Verification Status': bd?.bankAccountStatus || 'Pending Verification',
        'Beneficiary Status':       bd?.beneficiaryStatus || 'Pending',
      };
    });
  }

  const { buffer, fileType } = await generateExcelBufferAndType(excelData);

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: `${isPast ? 'Past' : 'Active'} employees exported successfully`,
    data: { buffer, fileType },
  });
});
