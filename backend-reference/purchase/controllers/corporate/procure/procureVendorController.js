'use strict';

const axios         = require('axios');
const {
  listVendors,
  listAllVendors,
  createVendor,
  findVendorById,
  countPurchaseOrders,
  updateVendor,
  bulkCreateVendors,
  destroyVendor,
  findDuplicateVendor,
  findVendorByGstin,
} = require('../../../models/use-cases/procure/procureVendor');
const ProcureInvoice = require('../../../models/entities/ProcureInvoice');
const asyncHandler  = require('../../../middlewares/async');
const ErrorResponse = require('../../../utils/error-response');
const { customLog } = require('../../../utils/loggerHelper');

const PAYMENT_SERVICE_URL = process.env.STAGING_URL || 'https://uatinapi.pekoapp.com';
// const PAYMENT_SERVICE_URL = 'http://localhost:4447';


async function registerPayoutBeneficiary({ corporateUserId, name, accountNumber, ifscCode, bankName, email, mobile, virtualAccountNumber, authorization, sessionid, sessionKey }) {
  try {
    customLog(null, 'info', { message: 'Registering payout beneficiary', corporateUserId, name, accountNumber, ifscCode, bankName, email, mobile, virtualAccountNumber });

    const { data } = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/v1/corporate/${corporateUserId}/payment/payout/beneficiary`,
      { name, accountNumber, ifscCode, bankName, email, mobile: mobile || undefined, type: 'BUSINESS', virtualAccountNumber: virtualAccountNumber || undefined },
      { headers: { Authorization: authorization, sessionid, 'x-user-key': sessionKey } }
    );
    customLog(null, 'info', { message: 'Payout beneficiary registration response', corporateUserId, name, beneficiaryId: data?.data?.id, responseData: data });
    return { beneficiaryId: data?.data?.id || null, error: null };
  } catch (err) {
    const errData = err?.response?.data || {};
    customLog(null, 'error', { message: 'Payout beneficiary registration error', corporateUserId, name, error: errData || err.message, errors: errData?.errors || [] });
    return { beneficiaryId: null, error: errData?.message || err.message || 'Failed to register payout beneficiary' };
  }
}

function getCorporateId(req) {
  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
    return req.user.subCorporateId;
  }
  return req.user.corporateId;
}

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'businessName', 'paymentTerms', 'status'];

// ─── CREATE ──────────────────────────────────────────────────────────────────

exports.
create = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const {
    businessName, gstin, contactPerson, email, phone,
    tags, paymentTerms, status, bankName, accountNumber, ifscCode,tradeLicenseNo,virtualAccountNumber
  } = req.body;
  if (gstin) {
    const existingGstin = await findVendorByGstin({ gstin, corporateUserId });
    if (existingGstin) {
      return res.status(409).json({ status: false, message: 'A supplier with this GSTIN already exists', responseCode: '409' });
    }
  }

  if (accountNumber && ifscCode) {
    const existing = await findDuplicateVendor({ corporateUserId, accountNumber, ifscCode });
    if (existing) {
      return res.status(409).json({ status: false, message: 'A vendor with the same bank account already exists.', responseCode: '409' });
    }
  }

  let beneficiaryId = null;
  let beneficiaryError = null;
  if (accountNumber && ifscCode) {
    const { beneficiaryId: bid, error } = await registerPayoutBeneficiary({
      corporateUserId: req.user.id,
      name: businessName,
      accountNumber,
      ifscCode,
      bankName,
      email,
      mobile: phone,
      virtualAccountNumber: virtualAccountNumber || null,
      authorization: req.headers.authorization,
      sessionKey: req.headers['x-user-key'],
      sessionid: req.headers.sessionid,
    });
    beneficiaryId = bid;
    if (error) beneficiaryError = error;
  }

  const vendor = await createVendor({
    corporateUserId,
    businessName,
    gstin: gstin || null,
    contactPerson,
    email,
    phone: phone || null,
    tags: tags || [],
    paymentTerms: paymentTerms || 'NET 30',
    status: status || 'Active',
    bankName: bankName || null,
    accountNumber: accountNumber || null,
    ifscCode: ifscCode || null,
    tradeLicenseNo: tradeLicenseNo || null,
    payoutBeneficiaryId: beneficiaryId,
  });

  customLog(req?.LogTraceId, 'info', { message: 'Vendor creation - payout beneficiary registration', corporateUserId, vendorId: vendor.id, beneficiaryId });

  return res.status(201).json({
    status: true,
    message: 'Vendor created successfully',
    data: vendor,
    responseCode: '000',
    ...(beneficiaryError && { beneficiaryError }),
  });
});

// ─── LIST ALL (no pagination) ────────────────────────────────────────────────

exports.listAll = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const { status, search, hasPayoutBeneficiary } = req.query;

  const vendors = await listAllVendors({ corporateUserId, status, search, hasPayoutBeneficiary: hasPayoutBeneficiary === 'true' });

  return res.status(200).json({
    status: true,
    message: 'Vendors fetched successfully',
    data: vendors,
    responseCode: '000',
  });
});

// ─── LIST ────────────────────────────────────────────────────────────────────

exports.list = asyncHandler(async (req, res) => {
  const corporateUserId = req.user.corporateId;

  const { status, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy)
    ? sortBy
    : 'createdAt';

  const safeSortOrder = sortOrder.toUpperCase() === 'ASC'
    ? 'ASC'
    : 'DESC';

  const { rows, count } = await listVendors({
    corporateUserId,
    status,
    search,
    sortBy: safeSortBy,
    sortOrder: safeSortOrder,
    page,
    limit,
  });

  return res.status(200).json({
    status: true,
    message: 'Vendors fetched successfully',
    data: {
      rows,
      count,
      
    },
    responseCode: '000',
  });
});

// ─── GET BY ID ───────────────────────────────────────────────────────────────

exports.getById = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const vendor = await findVendorById({ id, corporateUserId });
  if (!vendor) return next(new ErrorResponse('Vendor not found', 404));

  const poCount = await countPurchaseOrders(id);

  const vendorData = vendor.toJSON();

  // If vendor has no bank details, fall back to the most recent invoice submission
  if (!vendorData.bankName && !vendorData.accountNumber && !vendorData.ifscCode) {
    const latestInvoice = await ProcureInvoice.findOne({
      where: { vendorId: id, corporateUserId },
      attributes: ['bankName', 'accountNumber', 'ifscCode', 'bankAccountHolder'],
      order: [['createdAt', 'DESC']],
    });
    if (latestInvoice) {
      if (latestInvoice.bankName)      vendorData.bankName      = latestInvoice.bankName;
      if (latestInvoice.accountNumber) vendorData.accountNumber = latestInvoice.accountNumber;
      if (latestInvoice.ifscCode)      vendorData.ifscCode      = latestInvoice.ifscCode;
      // Also persist back to vendor so future lookups don't need this fallback
      await vendor.update({
        bankName:      latestInvoice.bankName      || null,
        accountNumber: latestInvoice.accountNumber || null,
        ifscCode:      latestInvoice.ifscCode      || null,
      });
    }
  }

  return res.status(200).json({
    status: true,
    message: 'Vendor fetched successfully',
    data: { ...vendorData, poCount },
    responseCode: '000',
  });
});

// ─── UPDATE ──────────────────────────────────────────────────────────────────

exports.update = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const vendor = await findVendorById({ id, corporateUserId });
  if (!vendor) return next(new ErrorResponse('Vendor not found', 404));

  const {
    businessName, gstin, contactPerson, email, phone,
    tags, paymentTerms, status, bankName, accountNumber, ifscCode,
  } = req.body;

  if (gstin && gstin !== vendor.gstin) {
    const existingGstin = await findVendorByGstin({ gstin, corporateUserId, excludeId: id });
    if (existingGstin) {
      return res.status(409).json({ status: false, message: 'A supplier with this GSTIN already exists', responseCode: '409' });
    }
  }

  const updatedFields = {};
  if (businessName  !== undefined) updatedFields.businessName  = businessName;
  if (gstin         !== undefined) updatedFields.gstin         = gstin || null;
  if (contactPerson !== undefined) updatedFields.contactPerson = contactPerson;
  if (email         !== undefined) updatedFields.email         = email;
  if (phone         !== undefined) updatedFields.phone         = phone || null;
  if (tags          !== undefined) updatedFields.tags          = tags;
  if (paymentTerms  !== undefined) updatedFields.paymentTerms  = paymentTerms;
  if (status        !== undefined) updatedFields.status        = status;
  if (bankName      !== undefined) updatedFields.bankName      = bankName || null;
  if (accountNumber !== undefined) updatedFields.accountNumber = accountNumber || null;
  if (ifscCode      !== undefined) updatedFields.ifscCode      = ifscCode || null;

  await updateVendor(vendor, updatedFields);

  const finalAccountNumber = updatedFields.accountNumber ?? vendor.accountNumber;
  const finalIfscCode      = updatedFields.ifscCode      ?? vendor.ifscCode;
  let beneficiaryError = null;
  if (finalAccountNumber && finalIfscCode && !vendor.payoutBeneficiaryId) {
    const { beneficiaryId, error } = await registerPayoutBeneficiary({
      corporateUserId,
      name: updatedFields.businessName || vendor.businessName,
      accountNumber: finalAccountNumber,
      ifscCode: finalIfscCode,
      bankName: updatedFields.bankName || vendor.bankName,
      email: updatedFields.email || vendor.email,
      mobile: updatedFields.phone || vendor.phone,
      authorization: req.headers.authorization,
      sessionKey: req.headers['x-user-key'],
      sessionid: req.headers.sessionid,
    });
    if (beneficiaryId) await updateVendor(vendor, { payoutBeneficiaryId: beneficiaryId });
    if (error) beneficiaryError = error;
  }

  return res.status(200).json({
    status: true,
    message: 'Vendor updated successfully',
    data: vendor,
    responseCode: '000',
    ...(beneficiaryError && { beneficiaryError }),
  });
});

// ─── IMPORT FROM CSV ─────────────────────────────────────────────────────────

function parseCsv(buffer) {
  const lines = buffer.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = [];
    let cur = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { values.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    return headers.reduce((obj, h, i) => { obj[h] = values[i] ?? ''; return obj; }, {});
  });
}

exports.importFromCsv = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ErrorResponse('No file uploaded', 400));

  const corporateUserId = req.user.corporateId;
  const rows = parseCsv(req.file.buffer);
  if (!rows.length) return next(new ErrorResponse('CSV file is empty or has no data rows', 400));

  const REQUIRED = ['businessName', 'contactPerson', 'email'];
  const errors = [];
  const vendors = [];

  rows.forEach((row, i) => {
    const rowNum = i + 2;
    const missing = REQUIRED.filter(f => !row[f] || !row[f].trim());
    if (missing.length) {
      errors.push(`Row ${rowNum}: missing required fields — ${missing.join(', ')}`);
      return;
    }
    vendors.push({
      corporateUserId,
      tradeLicenseNo:    row.tradeLicenseNo    || null,
      businessName:  row.businessName.trim(),
      gstin:         row.gstin         || null,
      contactPerson: row.contactPerson.trim(),
      email:         row.email.trim(),
      phone:         row.phone         || null,
      tags:          row.tags ? row.tags.split('|').map(t => t.trim()).filter(Boolean) : [],
      paymentTerms:  row.paymentTerms  || null,
      status:        row.status        || 'Active',
      bankName:      row.bankName      || null,
      accountNumber: row.accountNumber || null,
      ifscCode:      row.ifscCode      || null,
    });
  });

  if (!vendors.length) {
    return res.status(400).json({ status: false, message: 'No valid rows to import', data: { errors }, responseCode: '001' });
  }

  const created = await bulkCreateVendors(vendors);

  return res.status(201).json({
    status: true,
    message: `${created.length} vendor(s) imported successfully${errors.length ? `, ${errors.length} row(s) skipped` : ''}`,
    data: { imported: created.length, skipped: errors.length, errors },
    responseCode: '000',
  });
});

// ─── SOFT DELETE ─────────────────────────────────────────────────────────────

exports.softDelete = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const vendor = await findVendorById({ id, corporateUserId });
  if (!vendor) return next(new ErrorResponse('Vendor not found', 404));

  await destroyVendor(vendor);

  return res.status(200).json({
    status: true,
    message: 'Vendor deleted successfully',
    data: {},
    responseCode: '000',
  });
});
