const asyncHandler = require("../../middlewares/async");
const { getMonthlyStats, getRecentPayouts, updateStatus, findAll: findAllTransactions, findAllForExport, findOne: findOneTransaction } = require("../../models/use-cases/payoutTransaction");
// F-PAY-32: payoutBeneficiary use-cases unused after commenting the Decentro beneficiary handlers.
/*
const {
  create,
  findAll,
  findOne,
  findDuplicate,
  update,
  deleteOne,
} = require("../../models/use-cases/payoutBeneficiary");
*/
const { countActive, findById: findNupayBeneficiary } = require("../../models/use-cases/nupayBeneficiary");
const {
  create: createRentBill,
  findAll: findAllRentBills,
  findOne: findOneRentBill,
  update: updateRentBill,
  deleteOne: deleteRentBill,
} = require("../../models/use-cases/rentBill");
const {
  create: createOtherBill,
  findAll: findAllOtherBills,
  findOne: findOneOtherBill,
  update: updateOtherBill,
  deleteOne: deleteOtherBill,
} = require("../../models/use-cases/otherBill");
const {
  create: createVendorPayout,
  findAll: findAllVendorPayouts,
  findOne: findOneVendorPayout,
  update: updateVendorPayout,
  deleteOne: deleteVendorPayout,
} = require("../../models/use-cases/vendorPayout");
const {
  create: createBillPayout,
  findAll: findAllBillPayouts,
  findOne: findOneBillPayout,
  update: updateBillPayout,
  deleteOne: deleteBillPayout,
} = require("../../models/use-cases/billPayout");
const { getTransferStatus } = require("../../utils/decentroGateway");
// F-PAY-32: verifyBankAccount unused after commenting the Decentro addBeneficiary handler.
// const { verifyBankAccount } = require("../../utils/cashfreeGateway");
// const { findPrimary: findPrimaryBankAccount } = require("../../models/use-cases/bankAccount");
const { buildPayoutReceiptHtml } = require("../../utils/payoutReceiptHtml");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const puppeteer = require("puppeteer");
const fs = require("fs");
// F-PAY-32: createLedgerEntry unused after commenting the Decentro initiatePayout handler.
// const {  createEntry: createLedgerEntry } = require("../../models/use-cases/transactionLedger");
// F-PAY-32: uuidv4 unused after commenting the Decentro VA/payout handlers.
// const { v4: uuidv4 } = require("uuid");

/**
 * GET /payout/dashboard
 */
exports.getDashboard = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  console.log("[getDashboard] credentialId", credentialId);
  const [monthlyStats, activeBeneficiaries, recentPayouts] = await Promise.all([
    getMonthlyStats(credentialId),
    countActive(credentialId),
    getRecentPayouts(credentialId, 7),
  ]);

  return res.status(200).json({
    status: true,
    message: "Dashboard fetched successfully",
    responseCode: "000",
    data: {
      totalPayoutsThisMonth: monthlyStats.totalPayoutsThisMonth,
      activeBeneficiaries,
      billsThisMonth: monthlyStats.billsThisMonth,
      recentPayouts,
    },
  });
});

/**
 * GET /payout/transactions
 */
exports.getTransactions = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { status, category, from, to, searchText, page = 1, itemsPerPage = 10 } = req.query;

  const result = await findAllTransactions({
    credentialId,
    status,
    category,
    from,
    to,
    searchText,
    page: parseInt(page),
    itemsPerPage: parseInt(itemsPerPage),
  });

  return res.status(200).json({
    status: true,
    message: "Transactions fetched successfully",
    responseCode: "000",
    data: result.rows,
    pagination: {
      total: result.count,
      page: parseInt(page),
      itemsPerPage: parseInt(itemsPerPage),
      totalPages: Math.ceil(result.count / parseInt(itemsPerPage)),
    },
  });
});

/**
 * GET /payout/transactions/export
 */
exports.exportTransactions = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { status, category, from, to, searchText } = req.query;

  const rows = await findAllForExport({ credentialId, status, category, from, to, searchText });
  console.log(rows,"dddddaaataaaa")
  if (!rows || rows.length === 0) {
    return res.status(401).json({ status: false, message: "No data available to export", responseCode: "401" });
  }

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = rows.map((t) => {
    const d = t.transactionDate ? new Date(t.transactionDate) : null;
    const dateStr = d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "";
    return {
      "Beneficiary": t.payoutBeneficiary?.name || t.payeeName || "",
      "Date & Time": dateStr,
      "Transaction ID": t.referenceId|| "",
      "Payment Method": t.transferType || "",
      "Reference": t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1).toLowerCase() : "",
      "Amount": t.amount || "",
      "Status": t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1).toLowerCase() : "",
    };
  });

  const { buffer, fileType } = await generateExcelBufferAndType(data, "excel");

  return res.status(200).json({
    'status': true,
    'data': { buffer, fileType },
    'message': 'Fetched excel/csv datas successfully',
    'responseCode': '000'
  })
});

/**
 * POST /payout/beneficiary
 */
/* F-PAY-32: unrouted Decentro handler (replaced by NuPay) — commented out, not removed.
exports.addBeneficiary = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const corporateUserId = req.user.corporateId;
  const {
    type,
    name,
    email,
    mobile,
    accountNumber,
    ifscCode,
    bankName,
    branchName,
    upiId,
    panNumber,
    address,
    transferMode,
    virtualAccountNumber,
    paymentCategory,
  } = req.body;
  if (!name) {
    return res.status(400).json({
      status: false,
      message: "name is required",
      responseCode: "400",
    });
  }

  const isUpi = (transferMode || "ACCOUNT_TRANSFER") === "UPI";
  if (isUpi && !upiId) {
    return res.status(400).json({
      status: false,
      message: "upiId is required for UPI transfer mode",
      responseCode: "400",
    });
  }
  if (!isUpi && (!accountNumber || !ifscCode)) {
    return res.status(400).json({
      status: false,
      message: "accountNumber and ifscCode are required for account transfers",
      responseCode: "400",
    });
  }

  const duplicate = await findDuplicate({ credentialId: corporateUserId, accountNumber, ifscCode, upiId });
  if (duplicate) {
    return res.status(409).json({
      status: false,
      message: "A beneficiary with the same account details already exists",
      responseCode: "409",
    });
  }

  if (!isUpi) {
    const verification = await verifyBankAccount({ bank_account: accountNumber, ifsc: ifscCode });
    if (!verification.valid) {
      return res.status(400).json({
        status: false,
        message: verification.message || "Bank account verification failed",
        responseCode: "400",
        data: verification.response || {},
      });
    }
  }

  let decentroBeneficiaryId = null;
  try {
    const decentroRes = await manageBeneficiary({
      credentialId,
      corporateUserId,
      action: "ADD",
      accountNumber,
      ifscCode,
      upiHandle: upiId,
      name,
      email,
      mobile,
      senderAccountNumber: virtualAccountNumber,
    });

    decentroBeneficiaryId = decentroRes?.data?.beneficiaryCode || null;
  } catch (err) {
    return res.status(400).json({
      status: false,
      message: err.message,
      responseCode: "400",
      data: err.decentroError || {},
    });
  }

  const beneficiary = await create({
    credentialId: corporateUserId,
    type: type || "INDIVIDUAL",
    name,
    email,
    mobile,
    accountNumber,
    ifscCode,
    bankName,
    branchName,
    upiId,
    panNumber,
    address,
    transferMode: transferMode || "ACCOUNT_TRANSFER",
    status: "ACTIVE",
    decentroBeneficiaryId,
    virtualAccountNumber: virtualAccountNumber || null,
    paymentCategory: paymentCategory || null,
  });
  return res.status(201).json({
    status: true,
    message: "Beneficiary added successfully",
    responseCode: "000",
    data: beneficiary,
  });
});
*/

/**
 * GET /payout/beneficiary
 * List all beneficiaries with optional status filter
 */
/* F-PAY-32: unrouted Decentro handler (replaced by NuPay) — commented out, not removed.
exports.getBeneficiaries = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { status, searchText } = req.query;

  const result = await findAll({ credentialId, status, searchText });

  return res.status(200).json({
    status: true,
    message: "Beneficiaries fetched successfully",
    responseCode: "000",
    data: result,
  });
});
*/

/**
 * PUT /payout/beneficiary/:id
 * Update beneficiary details
 */
/* F-PAY-32: unrouted Decentro handler (replaced by NuPay) — commented out, not removed.
exports.updateBeneficiary = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const corporateUserId = req.user.corporateId;
  const { id } = req.params;
  const { name, email, mobile, bankName, branchName, upiId, panNumber, address, status, accountNumber, ifscCode, transferMode, paymentCategory } = req.body;

  const existing = await findOne(id, credentialId);
  if (!existing) {
    return res.status(404).json({
      status: false,
      message: "Beneficiary not found",
      responseCode: "404",
    });
  }

  if (upiId && upiId !== existing.upiId) {
    const duplicate = await findDuplicate({ credentialId: corporateUserId, upiId, excludeId: id });
    if (duplicate) {
      return res.status(409).json({
        status: false,
        message: "A beneficiary with the same UPI ID already exists",
        responseCode: "409",
      });
    }
  }

  const isUpiUpdate = (transferMode || existing.transferMode) !== "UPI" ? false : true;
  const bankDetailsChanged = accountNumber && accountNumber !== existing.accountNumber || ifscCode && ifscCode !== existing.ifscCode;

  if (!isUpiUpdate && bankDetailsChanged) {
    const verifyAccount = accountNumber || existing.accountNumber;
    const verifyIfsc = ifscCode || existing.ifscCode;
    const verification = await verifyBankAccount({ bank_account: verifyAccount, ifsc: verifyIfsc });
    console.log(verification,"verificationnn")
    if (!verification.valid) {
      return res.status(400).json({
        status: false,
        message: verification.message || "Bank account verification failed",
        responseCode: "400",
        data: verification.response || {},
      });
    }
  }

  if (existing.decentroBeneficiaryId) {
    try {
      await manageBeneficiary({
        credentialId,
        corporateUserId,
        action: "MODIFY",
        beneficiaryCode: existing.decentroBeneficiaryId,
        name,
        email,
        mobile,
        accountNumber,
        ifscCode,
        upiHandle: upiId,
        senderAccountNumber: existing.virtualAccountNumber,
      });
    } catch (err) {
      const isNotFound = err.decentroError?.responseCode === "E00009";
      if (isNotFound) {
        try {
          const reAddRes = await manageBeneficiary({
            credentialId,
            corporateUserId,
            action: "ADD",
            accountNumber: accountNumber || existing.accountNumber,
            ifscCode: ifscCode || existing.ifscCode,
            upiHandle: upiId || existing.upiId,
            name: name || existing.name,
            email: email || existing.email,
            mobile: mobile || existing.mobile,
            senderAccountNumber: existing.virtualAccountNumber,
          });
          const newDecentroId = reAddRes?.data?.beneficiaryCode || null;
          if (newDecentroId) await update(existing.id, credentialId, { decentroBeneficiaryId: newDecentroId });
        } catch (reAddErr) {
          return res.status(400).json({
            status: false,
            message: reAddErr.message,
            responseCode: "400",
            data: reAddErr.decentroError || {},
          });
        }
      } else {
        return res.status(400).json({
          status: false,
          message: err.message,
          responseCode: "400",
          data: err.decentroError || {},
        });
      }
    }
  }

  await update(id, credentialId, {
    name,
    email,
    mobile,
    bankName,
    branchName,
    upiId,
    panNumber,
    address,
    status,
    accountNumber,
    ifscCode,
    transferMode,
    paymentCategory,
  });

  const updatedBeneficiary = await findOne(id, credentialId);

  return res.status(200).json({
    status: true,
    message: "Beneficiary updated successfully",
    data: updatedBeneficiary,
    responseCode: "000",
  });
});
*/

/**
 * DELETE /payout/beneficiary/:id
 */
/* F-PAY-32: unrouted Decentro handler (replaced by NuPay) — commented out, not removed.
exports.deleteBeneficiary = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const corporateUserId = req.user.corporateId;
  const { id } = req.params;

  const existing = await findOne(id, credentialId);
  if (!existing) {
    return res.status(404).json({
      status: false,
      message: "Beneficiary not found",
      responseCode: "404",
    });
  }

  if (existing.decentroBeneficiaryId) {
    try {
      await manageBeneficiary({
        credentialId,
        corporateUserId,
        action: "DISABLE",
        beneficiaryCode: existing.decentroBeneficiaryId,
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: err.message,
        responseCode: "400",
        data: err.decentroError || {},
      });
    }
  }

  await deleteOne(id, credentialId);

  return res.status(200).json({
    status: true,
    message: "Beneficiary deleted successfully",
    responseCode: "000",
  });
});
*/

// ─── Rent Bills ───────────────────────────────────────────────────────────────

/**
 * POST /payout/rent
 */
exports.createRentBill = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const {
    beneficiaryId,
    landlordName,
    propertyAddress,
    rentPeriod,
    dueDate,
    rentAmount,
    maintenanceCharges,
    leaseAgreementNumber,
    notes,
  } = req.body;

  if (!beneficiaryId || !landlordName || !propertyAddress || !rentPeriod || !dueDate || !rentAmount) {
    return res.status(400).json({
      status: false,
      message: "beneficiaryId, landlordName, propertyAddress, rentPeriod, dueDate and rentAmount are required",
      responseCode: "400",
    });
  }

  const beneficiary = await findNupayBeneficiary(beneficiaryId, credentialId);
  if (!beneficiary) {
    return res.status(404).json({
      status: false,
      message: "Beneficiary not found",
      responseCode: "404",
    });
  }

  // attachment URL is set by companyDocumentsFilesUpload middleware
  const attachmentUrl = req.body.attachment || null;

  const maintenance = parseFloat(maintenanceCharges) || 0;
  const totalAmount = parseFloat(rentAmount) + maintenance;

  const bill = await createRentBill({
    credentialId,
    nupayBeneficiaryId: beneficiaryId,
    landlordName,
    propertyAddress,
    rentPeriod,
    dueDate,
    rentAmount,
    maintenanceCharges: maintenance,
    totalAmount,
    leaseAgreementNumber,
    notes,
    attachmentUrl,
    status: "UNPAID",
  });

  return res.status(201).json({
    status: true,
    message: "Rent bill created successfully",
    responseCode: "000",
    data: bill,
  });
});

/**
 * GET /payout/rent
 */
exports.getRentBills = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { status, searchText } = req.query;

  const bills = await findAllRentBills({ credentialId, status, searchText });

  return res.status(200).json({
    status: true,
    message: "Rent bills fetched successfully",
    responseCode: "000",
    data: bills,
  });
});

/**
 * GET /payout/rent/:id
 */
exports.getRentBill = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { id } = req.params;

  const bill = await findOneRentBill(id, credentialId);
  if (!bill) {
    return res.status(404).json({
      status: false,
      message: "Rent bill not found",
      responseCode: "404",
    });
  }

  return res.status(200).json({
    status: true,
    message: "Rent bill fetched successfully",
    responseCode: "000",
    data: bill,
  });
});

/**
 * PUT /payout/rent/:id
 */
exports.updateRentBillHandler = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { id } = req.params;
  const {
    landlordName,
    propertyAddress,
    rentPeriod,
    dueDate,
    rentAmount,
    maintenanceCharges,
    leaseAgreementNumber,
    notes,
  } = req.body;

  const existing = await findOneRentBill(id, credentialId);
  if (!existing) {
    return res.status(404).json({
      status: false,
      message: "Rent bill not found",
      responseCode: "404",
    });
  }

  if (existing.status === "PAID") {
    return res.status(400).json({
      status: false,
      message: "Cannot edit a paid rent bill",
      responseCode: "400",
    });
  }

  const updatedRent = rentAmount !== undefined ? parseFloat(rentAmount) : parseFloat(existing.rentAmount);
  const updatedMaintenance = maintenanceCharges !== undefined ? parseFloat(maintenanceCharges) : parseFloat(existing.maintenanceCharges);
  const totalAmount = updatedRent + updatedMaintenance;

  await updateRentBill(id, credentialId, {
    landlordName,
    propertyAddress,
    rentPeriod,
    dueDate,
    rentAmount,
    maintenanceCharges,
    totalAmount,
    leaseAgreementNumber,
    notes,
  });

  return res.status(200).json({
    status: true,
    message: "Rent bill updated successfully",
    responseCode: "000",
  });
});

/**
 * DELETE /payout/rent/:id
 */
exports.deleteRentBillHandler = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { id } = req.params;

  const existing = await findOneRentBill(id, credentialId);
  if (!existing) {
    return res.status(404).json({
      status: false,
      message: "Rent bill not found",
      responseCode: "404",
    });
  }

  if (existing.status === "PAID") {
    return res.status(400).json({
      status: false,
      message: "Cannot delete a paid rent bill",
      responseCode: "400",
    });
  }

  await deleteRentBill(id, credentialId);

  return res.status(200).json({
    status: true,
    message: "Rent bill deleted successfully",
    responseCode: "000",
  });
});

// ─── Other Bills ──────────────────────────────────────────────────────────────

/**
 * POST /payout/bill
 */
exports.createOtherBillHandler = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { beneficiaryId, billTitle, payeeName, billReferenceNumber, dueDate, description, totalAmount, notes } = req.body;

  if (!beneficiaryId || !billTitle || !payeeName || !dueDate || !totalAmount) {
    return res.status(400).json({
      status: false,
      message: "beneficiaryId, billTitle, payeeName, dueDate and totalAmount are required",
      responseCode: "400",
    });
  }

  const beneficiary = await findNupayBeneficiary(beneficiaryId, credentialId);
  if (!beneficiary) {
    return res.status(404).json({ status: false, message: "Beneficiary not found", responseCode: "404" });
  }

  const attachmentUrl = req.body.attachment || null;

  const bill = await createOtherBill({
    credentialId,
    nupayBeneficiaryId: beneficiaryId,
    billTitle,
    payeeName,
    billReferenceNumber,
    dueDate,
    description,
    totalAmount,
    notes,
    attachmentUrl,
    status: "UNPAID",
  });

  return res.status(201).json({ status: true, message: "Bill created successfully", responseCode: "000", data: bill });
});

/**
 * GET /payout/bill
 */
exports.getOtherBills = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { status, searchText } = req.query;

  const bills = await findAllOtherBills({ credentialId, status, searchText });

  return res.status(200).json({ status: true, message: "Bills fetched successfully", responseCode: "000", data: bills });
});

/**
 * GET /payout/bill/:id
 */
exports.getOtherBill = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { id } = req.params;

  const bill = await findOneOtherBill(id, credentialId);
  if (!bill) return res.status(404).json({ status: false, message: "Bill not found", responseCode: "404" });

  return res.status(200).json({ status: true, message: "Bill fetched successfully", responseCode: "000", data: bill });
});

/**
 * PUT /payout/bill/:id
 */
exports.updateOtherBillHandler = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { id } = req.params;
  const { billTitle, payeeName, billReferenceNumber, dueDate, description, totalAmount, notes } = req.body;

  const existing = await findOneOtherBill(id, credentialId);
  if (!existing) return res.status(404).json({ status: false, message: "Bill not found", responseCode: "404" });

  if (existing.status === "PAID") {
    return res.status(400).json({ status: false, message: "Cannot edit a paid bill", responseCode: "400" });
  }

  await updateOtherBill(id, credentialId, { billTitle, payeeName, billReferenceNumber, dueDate, description, totalAmount, notes });

  return res.status(200).json({ status: true, message: "Bill updated successfully", responseCode: "000" });
});

/**
 * DELETE /payout/bill/:id
 */
exports.deleteOtherBillHandler = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { id } = req.params;

  const existing = await findOneOtherBill(id, credentialId);
  if (!existing) return res.status(404).json({ status: false, message: "Bill not found", responseCode: "404" });

  if (existing.status === "PAID") {
    return res.status(400).json({ status: false, message: "Cannot delete a paid bill", responseCode: "400" });
  }

  await deleteOtherBill(id, credentialId);

  return res.status(200).json({ status: true, message: "Bill deleted successfully", responseCode: "000" });
});

// ─── Vendor Payouts ───────────────────────────────────────────────────────────

exports.createVendorPayoutHandler = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { beneficiaryId, vendorName, invoiceNumber, invoiceDate, dueDate, description, totalAmount, notes } = req.body;

  if (!beneficiaryId || !vendorName || !dueDate || !totalAmount) {
    return res.status(400).json({ status: false, message: "beneficiaryId, vendorName, dueDate and totalAmount are required", responseCode: "400" });
  }

  const beneficiary = await findNupayBeneficiary(beneficiaryId, credentialId);
  if (!beneficiary) {
    return res.status(404).json({ status: false, message: "Beneficiary not found", responseCode: "404" });
  }

  const record = await createVendorPayout({
    credentialId,
    nupayBeneficiaryId: beneficiaryId,
    vendorName,
    invoiceNumber,
    invoiceDate,
    dueDate,
    description,
    totalAmount,
    notes,
    attachmentUrl: req.body.attachment || null,
    status: "UNPAID",
  });

  return res.status(201).json({ status: true, message: "Vendor payout created successfully", responseCode: "000", data: record });
});

exports.getVendorPayouts = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { status, searchText } = req.query;
  const records = await findAllVendorPayouts({ credentialId, status, searchText });
  return res.status(200).json({ status: true, message: "Vendor payouts fetched successfully", responseCode: "000", data: records });
});

exports.getVendorPayout = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const record = await findOneVendorPayout(req.params.id, credentialId);
  if (!record) return res.status(404).json({ status: false, message: "Vendor payout not found", responseCode: "404" });
  return res.status(200).json({ status: true, message: "Vendor payout fetched successfully", responseCode: "000", data: record });
});

exports.updateVendorPayoutHandler = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { id } = req.params;
  const existing = await findOneVendorPayout(id, credentialId);
  if (!existing) return res.status(404).json({ status: false, message: "Vendor payout not found", responseCode: "404" });
  if (existing.status === "PAID") return res.status(400).json({ status: false, message: "Cannot edit a paid vendor payout", responseCode: "400" });

  const { vendorName, invoiceNumber, invoiceDate, dueDate, description, totalAmount, notes } = req.body;
  await updateVendorPayout(id, credentialId, { vendorName, invoiceNumber, invoiceDate, dueDate, description, totalAmount, notes });
  return res.status(200).json({ status: true, message: "Vendor payout updated successfully", responseCode: "000" });
});

exports.deleteVendorPayoutHandler = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { id } = req.params;
  const existing = await findOneVendorPayout(id, credentialId);
  if (!existing) return res.status(404).json({ status: false, message: "Vendor payout not found", responseCode: "404" });
  if (existing.status === "PAID") return res.status(400).json({ status: false, message: "Cannot delete a paid vendor payout", responseCode: "400" });

  await deleteVendorPayout(id, credentialId);
  return res.status(200).json({ status: true, message: "Vendor payout deleted successfully", responseCode: "000" });
});

// ─── Bill Payouts ─────────────────────────────────────────────────────────────

exports.createBillPayoutHandler = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { beneficiaryId, billTitle, billerName, billNumber, billPeriod, dueDate, totalAmount, notes } = req.body;

  if (!beneficiaryId || !billTitle || !billerName || !dueDate || !totalAmount) {
    return res.status(400).json({ status: false, message: "beneficiaryId, billTitle, billerName, dueDate and totalAmount are required", responseCode: "400" });
  }

  const beneficiary = await findNupayBeneficiary(beneficiaryId, credentialId);
  if (!beneficiary) {
    return res.status(404).json({ status: false, message: "Beneficiary not found", responseCode: "404" });
  }

  const record = await createBillPayout({
    credentialId,
    payoutBeneficiaryId: beneficiaryId,
    billTitle,
    billerName,
    billNumber,
    billPeriod,
    dueDate,
    totalAmount,
    notes,
    attachmentUrl: req.body.attachment || null,
    status: "UNPAID",
  });

  return res.status(201).json({ status: true, message: "Bill payout created successfully", responseCode: "000", data: record });
});

exports.getBillPayouts = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { status, searchText } = req.query;
  const records = await findAllBillPayouts({ credentialId, status, searchText });
  return res.status(200).json({ status: true, message: "Bill payouts fetched successfully", responseCode: "000", data: records });
});

exports.getBillPayout = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const record = await findOneBillPayout(req.params.id, credentialId);
  if (!record) return res.status(404).json({ status: false, message: "Bill payout not found", responseCode: "404" });
  return res.status(200).json({ status: true, message: "Bill payout fetched successfully", responseCode: "000", data: record });
});

exports.updateBillPayoutHandler = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { id } = req.params;
  const existing = await findOneBillPayout(id, credentialId);
  if (!existing) return res.status(404).json({ status: false, message: "Bill payout not found", responseCode: "404" });
  if (existing.status === "PAID") return res.status(400).json({ status: false, message: "Cannot edit a paid bill payout", responseCode: "400" });

  const { billTitle, billerName, billNumber, billPeriod, dueDate, totalAmount, notes } = req.body;
  await updateBillPayout(id, credentialId, { billTitle, billerName, billNumber, billPeriod, dueDate, totalAmount, notes });
  return res.status(200).json({ status: true, message: "Bill payout updated successfully", responseCode: "000" });
});

exports.deleteBillPayoutHandler = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { id } = req.params;
  const existing = await findOneBillPayout(id, credentialId);
  if (!existing) return res.status(404).json({ status: false, message: "Bill payout not found", responseCode: "404" });
  if (existing.status === "PAID") return res.status(400).json({ status: false, message: "Cannot delete a paid bill payout", responseCode: "400" });

  await deleteBillPayout(id, credentialId);
  return res.status(200).json({ status: true, message: "Bill payout deleted successfully", responseCode: "000" });
});

/**
 * POST /payout/virtual-account
 * System-only: create a virtual account via Decentro V3
 */
/* F-PAY-20: dead Decentro VA endpoint (replaced by NuPay) — commented out, not removed.
exports.createVA = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { name, mobile, email, ifsc, generateStaticQr, referenceId } = req.body;

  if (!name) {
    return res.status(400).json({ status: false, message: "name is required", responseCode: "400" });
  }

  const refId = referenceId || `VA_${uuidv4().replace(/-/g, "").slice(0, 20).toUpperCase()}`;

  const customerVaIdentifier = `${credentialId}_${uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  const data = await createVirtualAccount({ referenceId: refId, name, customerVaIdentifier, mobile, email, ifsc, generateStaticQr });

  return res.status(200).json({
    status: true,
    message: "Virtual account created successfully",
    responseCode: "000",
    data,
  });
});
*/

/**
 * POST /payout/transfer
 * Initiate a payout to a saved beneficiary via Decentro V3
 */
/* F-PAY-32: unrouted Decentro handler (replaced by NuPay) — commented out, not removed.
exports.initiatePayout = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const corporateUserId = req.user.corporateId;
  const { beneficiaryId, amount, transferType, category, remarks ,virtualAccountNumber} = req.body;
  if (!beneficiaryId || !amount || !category) {
    return res.status(400).json({
      status: false,
      message: "beneficiaryId, amount and category are required",
      responseCode: "400",
    });
  }

  const beneficiary = await findNupayBeneficiary(beneficiaryId, credentialId);
  if (!beneficiary) {
    return res.status(404).json({
      status: false,
      message: "Beneficiary not found",
      responseCode: "404",
    });
  }

  // const primaryBankAccount = await findPrimaryBankAccount(credentialId);
  const fromAccount = virtualAccountNumber;

  const referenceId = `PAY_${uuidv4().replace(/-/g, "").slice(0, 20).toUpperCase()}`;
  // Determine transfer type from beneficiary's mode if not explicitly provided
  const resolvedTransferType = transferType || (beneficiary.transferMode === "UPI" ? "UPI" : "NEFT");

  const transaction = await createTransaction({
    credentialId,
    payoutBeneficiaryId: beneficiary.id,
    category,
    amount,
    payeeName: beneficiary.name,
    remarks,
    referenceId,
    transferType: resolvedTransferType,
    status: "PENDING",
    transactionDate: new Date(),
  });

  // Record DEBIT entry in ledger — status PENDING until webhook confirms
  await createLedgerEntry({
    credentialId,
    transactionId: referenceId,
    type: "DEBIT",
    amount,
    source: "PAYOUT",
    status: "PENDING",
    referenceId,
    payoutTransactionId: transaction.id,
    remarks: remarks || `Payout to ${beneficiary.name}`,
  });

  let decentroResponse;
  try {
    decentroResponse = await initiateTransfer({
      credentialId,
      corporateUserId,
      referenceId,
      amount,
      transferType: resolvedTransferType,
      purposeMessage: "Payout Transfer",
      virtualAccountNumber: fromAccount,
      beneficiaryDetails: {
        name: beneficiary.name,
        accountNumber: beneficiary.accountNumber,
        ifscCode: beneficiary.ifscCode,
        upiId: beneficiary.upiId,
        email: beneficiary.email,
        mobile: beneficiary.mobile,
      },
    });
  } catch (err) {
    await updateStatus(transaction.id, "FAILED", null);
    return res.status(400).json({
      status: false,
      message: err.message,
      responseCode: "400",
      data: err.decentroError || {},
    });
  }
 
  const decentroTxnId = decentroResponse?.decentroTxnId;
  const txnStatus = decentroResponse?.data?.transactionStatus;

  const finalStatus =
    txnStatus === "success" ? "COMPLETED" : txnStatus === "failure" ? "FAILED" : "PENDING";

  await updateStatus(transaction.id, finalStatus, decentroTxnId);


  return res.status(200).json({
    status: true,
    message: "Payout initiated successfully",
    responseCode: "000",
    data: {
      transactionId: transaction.id,
      referenceId,
      decentroTxnId,
      transactionStatus: finalStatus,
    },
  });
});
*/

/**
 * GET /payout/transactions/:id/status
 * Poll the status of a payout transaction from Decentro and sync it to DB
 */
exports.getPayoutStatus = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const corporateUserId = req.user.corporateId;
  const { id } = req.params;

  const transaction = await findOneTransaction(id, credentialId);
  if (!transaction) {
    return res.status(404).json({ status: false, message: "Transaction not found", responseCode: "404" });
  }

  if (transaction.status !== "PENDING") {
    return res.status(200).json({
      status: true,
      message: "Transaction status fetched",
      responseCode: "000",
      data: { transactionStatus: transaction.status, decentroTxnId: transaction.decentroTxnId },
    });
  }

  const decentroResult = await getTransferStatus({ credentialId, corporateUserId, referenceId: transaction.referenceId });
  console.log(decentroResult, "decentroResult in status check")
  const txnStatus = decentroResult?.data?.transactionStatus?.toLowerCase();
  const finalStatus = txnStatus === "success" ? "COMPLETED" : txnStatus === "failure" ? "FAILED" : "PENDING";
  const decentroTxnId = decentroResult?.decentroTxnId;
  console.log(decentroTxnId, "decentroTxnId in status check")

  if (finalStatus !== "PENDING") {
    await updateStatus(transaction.id, finalStatus, decentroTxnId);
  }

  return res.status(200).json({
    status: true,
    message: "Transaction status fetched",
    responseCode: "000",
    data: { transactionStatus: finalStatus, decentroTxnId },
  });
});

/**
 * GET /payout/transactions/:id/receipt
 * Download a PDF receipt for a completed payout
 */
exports.downloadPayoutReceipt = asyncHandler(async (req, res) => {
  const credentialId = parseInt(req.params.corporateId) || req.user.corporateId || req.user.id;
  const { id } = req.params;

  const transaction = await findOneTransaction(id, credentialId);
  if (!transaction) {
    return res.status(404).json({ status: false, message: "Transaction not found", responseCode: "404" });
  }

  if (transaction.status !== "COMPLETED") {
    return res.status(400).json({ status: false, message: "Receipt is only available for completed transactions", responseCode: "400" });
  }

  const txnDate = new Date(transaction.transactionDate);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = txnDate.getFullYear();
  const month = String(txnDate.getMonth() + 1).padStart(2, "0");
  const receiptNo = `RCP/${year}/${month}/${String(transaction.id).padStart(6, "0")}`;
  const hh = String(txnDate.getHours()).padStart(2, "0");
  const mm = String(txnDate.getMinutes()).padStart(2, "0");
  const date = `${txnDate.getDate()} ${MONTHS[txnDate.getMonth()]} ${year}, ${hh}:${mm}`;

  const beneficiary = transaction.payoutBeneficiary;

  const html = buildPayoutReceiptHtml({
    receiptNo,
    date,
    transactionId: transaction.id,
    referenceId: transaction.referenceId,
    decentroTxnId: transaction.decentroTxnId,
    transferType: transaction.transferType,
    beneficiaryName: beneficiary?.name || transaction.payeeName,
    bankName: beneficiary?.bankName || null,
    accountNumber: beneficiary?.accountNumber || null,
    ifscCode: beneficiary?.ifscCode || null,
    amount: transaction.amount,
    status: transaction.status,
    companyName: req.user.name,
  });

  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded" });

  const outputFile = `receipt-${transaction.referenceId}-${Date.now()}.pdf`;
  await page.pdf({ path: outputFile, format: "A4", preferCSSPageSize: true });
  browser.close();

  const pdfBuffer = fs.readFileSync(outputFile);
  fs.unlinkSync(outputFile);

  return res.status(200).json({
    status: true,
    message: "Receipt generated successfully",
    responseCode: "000",
    data: { pdfBuffer },
  });
});
