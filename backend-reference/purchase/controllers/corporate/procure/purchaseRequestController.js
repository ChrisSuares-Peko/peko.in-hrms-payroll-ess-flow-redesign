'use strict';

const axios        = require('axios');
const asyncHandler = require('../../../middlewares/async');
const ErrorResponse = require('../../../utils/error-response');
const { generate: generateRefNumber } = require('../../../services/procure/refNumberService');
const { uploadFile }                  = require('../../../utils/commonUploadFile');
const prUseCase = require('../../../models/use-cases/procure/purchaseRequest');
const { customLog } = require('../../../utils/loggerHelper');

const PAYROLL_SERVICE_URL = (process.env.PAYROLL_SERVICE_URL || (process.env.NODE_ENV === 'production' ? process.env.PRODUCTION_URL : process.env.STAGING_URL) || 'https://uatinapi.pekoapp.com').replace(/\/+$/, '');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCorporateId(req) {
  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
    return req.user.subCorporateId;
  }
  return req.user.corporateId;
}

function normalizeEmployeeStatus(value) {
  if (!value) return 'Active';
  const input = String(value).trim().toLowerCase();
  if (input === 'active')   return 'Active';
  if (input === 'inactive') return 'Inactive';
  return 'Active';
}

function extractEmployeePayload(body = {}) {
  const personalInformation = body.personalInformation || {};
  const employeeInformation = body.employeeInformation || {};

  const fullName =
    body.employeeName || body.fullName || body.name || personalInformation.fullName || null;

  const employeeCode =
    body.employeeCode || body.employeeId || employeeInformation.employeeId || null;

  const email =
    body.email || personalInformation.email || employeeInformation.workEmailId || null;

  const phone =
    body.phone || personalInformation.mobileNo || body.mobileNo || null;

  const department  = body.department  || employeeInformation.department  || null;
  const designation = body.designation || employeeInformation.designation || null;
  const status      = normalizeEmployeeStatus(body.status || employeeInformation.status);

  return {
    employeeCode, fullName, email, phone, department, designation, status,
    meta: body.meta && typeof body.meta === 'object' ? body.meta : {},
  };
}

function getForwardHeaders(req) {
  const headers = { 'Content-Type': 'application/json' };
  if (req.headers.authorization)     headers.authorization     = req.headers.authorization;
  if (req.headers['x-user-key'])     headers['x-user-key']     = req.headers['x-user-key'];
  if (req.headers['x-access-token']) headers['x-access-token'] = req.headers['x-access-token'];
  if (req.headers.sessionid)         headers.sessionid         = req.headers.sessionid;
  return headers;
}

function extractPayrollRows(payrollData) {
  if (!payrollData)                         return [];
  if (Array.isArray(payrollData))           return payrollData;
  if (Array.isArray(payrollData.rows))      return payrollData.rows;
  if (Array.isArray(payrollData.employees)) return payrollData.employees;
  if (Array.isArray(payrollData.docs))      return payrollData.docs;
  return [];
}

function normalizeCombinedEmployee(item) {
  const personalInformation = item.personalInformation || {};
  const employeeInformation = item.employeeInformation || {};

  return {
    id:           item.id || item._id || null,
    employeeCode: item.employeeCode || item.employeeId || employeeInformation.employeeId || null,
    fullName:     item.fullName || item.name || personalInformation.fullName || null,
    email:        item.email || personalInformation.email || employeeInformation.workEmailId || null,
    phone:        item.phone || item.mobileNo || personalInformation.mobileNo || null,
    department:   item.department || employeeInformation.department || null,
    designation:  item.designation || employeeInformation.designation || null,
    status:       normalizeEmployeeStatus(item.status || employeeInformation.status),
  };
}

async function uploadAttachmentsToS3(attachments = [], user) {
  if (!attachments.length) return [];
  const role     = user?.role?.toLowerCase() || 'corporate';
  const username = user?.username || 'unknown-user';
  const filePath = `${role}/${username}/procure/purchase-requests`;
  return Promise.all(
    attachments.map(async (f) => {
      const url = await uploadFile(f.fileBase64, filePath, f.fileFormat);
      return { fileName: f.fileName, url, uploadedAt: new Date().toISOString() };
    })
  );
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

exports.create = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const { requestedBy, department, category, currency, neededBy, description, lineItems, notes, status } = req.body;

  const refNumber   = await generateRefNumber('PR', corporateUserId);
  const attachments = await uploadAttachmentsToS3(req.body.attachments || [], req.user);

  const computedBudget = Array.isArray(lineItems) && lineItems.length
    ? lineItems.reduce((sum, i) => sum + (Number(i.qty) * (Number(i.estUnitCost) || 0)), 0)
    : (req.body.estimatedBudget != null ? req.body.estimatedBudget : null);

  const pr = await prUseCase.createPR({
    corporateUserId,
    refNumber,
    requestedBy,
    requestedByUserId: req.user.corporateId || req.user.subCorporateId || null,
    department:        department      || null,
    category:          category        || null,
    estimatedBudget:   computedBudget,
    currency:          currency        || 'INR',
    neededBy:          neededBy || null,
    description:       description     || null,
    lineItems:         lineItems       || null,
    attachments,
    notes:             notes           || null,
    status:            status          || 'Open',
  });

  return res.status(201).json({
    status: true,
    message: 'Purchase Request created successfully',
    data: pr,
    responseCode: '000',
  });
});

// ─── LIST ALL (dropdown) ─────────────────────────────────────────────────────

exports.listAll = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const { status } = req.query;

  const rows = await prUseCase.listAllPRs({ corporateUserId, status });

  return res.status(200).json({
    status: true,
    message: 'Purchase requests fetched successfully',
    data: rows,
    responseCode: '000',
  });
});

// ─── LIST ────────────────────────────────────────────────────────────────────

exports.list = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const { status, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  const { rows, count } = await prUseCase.listPRs({
    corporateUserId, status, search, startDate, endDate, sortBy, sortOrder, page, limit,
  });

  return res.status(200).json({
    status: true,
    message: 'Purchase Requests fetched successfully',
    data: { rows, count, page, totalPages: Math.ceil(count / limit), limit },
    responseCode: '000',
  });
});

// ─── GET BY ID ───────────────────────────────────────────────────────────────

exports.getById = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id }          = req.params;

  const pr = await prUseCase.findPRById({ id, corporateUserId });
  if (!pr) return next(new ErrorResponse('Purchase Request not found', 404));

  return res.status(200).json({
    status: true,
    message: 'Purchase Request fetched successfully',
    data: pr,
    responseCode: '000',
  });
});

// ─── UPDATE ──────────────────────────────────────────────────────────────────

exports.update = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id }          = req.params;

  const pr = await prUseCase.findPRById({ id, corporateUserId });
  if (!pr) return next(new ErrorResponse('Purchase Request not found', 404));
  if (!['Draft', 'Open'].includes(pr.status)) return next(new ErrorResponse('Only Draft or Open Purchase Requests can be edited', 400));

  const { requestedBy, department, category, estimatedBudget, currency, neededBy, description, lineItems, notes, status } = req.body;

  const fields = {};
  if (requestedBy     !== undefined) fields.requestedBy     = requestedBy     || null;
  if (department      !== undefined) fields.department      = department      || null;
  if (category        !== undefined) fields.category        = category        || null;
  if (currency        !== undefined) fields.currency        = currency;
  if (neededBy        !== undefined) fields.neededBy        = neededBy        || null;
  if (description     !== undefined) fields.description     = description     || null;
  if (lineItems       !== undefined) {
    fields.lineItems       = lineItems || null;
    fields.estimatedBudget = Array.isArray(lineItems) && lineItems.length
      ? lineItems.reduce((sum, i) => sum + (Number(i.qty) * (Number(i.estUnitCost) || 0)), 0)
      : (estimatedBudget != null ? estimatedBudget : null);
  } else if (estimatedBudget !== undefined) {
    fields.estimatedBudget = estimatedBudget != null ? estimatedBudget : null;
  }
  if (notes           !== undefined) fields.notes           = notes           || null;
  if (status          !== undefined && ['Open', 'Draft'].includes(status)) fields.status = status;

  let currentAttachments = pr.attachments || [];
  if (req.body.deletedAttachments && req.body.deletedAttachments.length > 0) {
    currentAttachments = currentAttachments.filter((a) => !req.body.deletedAttachments.includes(a.fileName));
    fields.attachments = currentAttachments;
  }
  if (req.body.attachments && req.body.attachments.length > 0) {
    const newAttachments = await uploadAttachmentsToS3(req.body.attachments, corporateUserId);
    fields.attachments = [...currentAttachments, ...newAttachments];
  }

  await prUseCase.updatePR({ pr, fields });

  return res.status(200).json({
    status: true,
    message: 'Purchase Request updated successfully',
    data: pr,
    responseCode: '000',
  });
});

// ─── DELETE ATTACHMENT ────────────────────────────────────────────────────────

exports.deleteAttachment = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id }          = req.params;
  const { fileName }    = req.body;

  if (!fileName) return next(new ErrorResponse('fileName is required', 400));

  const pr = await prUseCase.findPRById({ id, corporateUserId });
  if (!pr) return next(new ErrorResponse('Purchase Request not found', 404));
  if (pr.status !== 'Open') return next(new ErrorResponse('Attachments can only be removed from Open Purchase Requests', 400));

  const filtered = (pr.attachments || []).filter((a) => a.fileName !== fileName);
  await prUseCase.updatePR({ pr, fields: { attachments: filtered } });

  return res.status(200).json({
    status: true,
    message: 'Attachment removed',
    data: { attachments: filtered },
    responseCode: '000',
  });
});

// ─── CLOSE ───────────────────────────────────────────────────────────────────

exports.close = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id }          = req.params;

  const pr = await prUseCase.findPRById({ id, corporateUserId });
  console.log("[close] PR found:", !!pr, "Status:", pr?.status);
  if (!pr) return next(new ErrorResponse('Purchase Request not found', 404));
  if (pr.status === 'Cancelled') return next(new ErrorResponse('Purchase Request is already cancelled', 400));

  await prUseCase.updatePR({ pr, fields: { status: 'Cancelled' } });

  return res.status(200).json({
    status: true,
    message: 'Purchase Request Cancelled',
    data: pr,
    responseCode: '000',
  });
});

// ─── REOPEN ──────────────────────────────────────────────────────────────────

exports.reopen = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id }          = req.params;

  const pr = await prUseCase.findPRById({ id, corporateUserId });
  if (!pr) return next(new ErrorResponse('Purchase Request not found', 404));
  if (pr.status !== 'Cancelled') return next(new ErrorResponse('Only Cancelled Purchase Requests can be re-opened', 400));

  await prUseCase.updatePR({ pr, fields: { status: 'Open' } });

  return res.status(200).json({
    status: true,
    message: 'Purchase Request re-opened',
    data: pr,
    responseCode: '000',
  });
});

// ─── SOFT DELETE ─────────────────────────────────────────────────────────────

exports.softDelete = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id }          = req.params;

  const pr = await prUseCase.findPRById({ id, corporateUserId });
  if (!pr) return next(new ErrorResponse('Purchase Request not found', 404));
  if (!['Draft', 'Open'].includes(pr.status)) return next(new ErrorResponse('Only Draft or Open Purchase Requests can be deleted', 400));

  await prUseCase.deletePR({ pr });

  return res.status(200).json({
    status: true,
    message: 'Purchase Request deleted',
    data: {},
    responseCode: '000',
  });
});

// ─── LIST EMPLOYEES ───────────────────────────────────────────────────────────

exports.listEmployees = asyncHandler(async (req, res, next) => {
  const corporateUserId = req.user.corporateId;
  if (!corporateUserId) return next(new ErrorResponse('corporateUserId is required', 400));
 
  const search = (req.query.search || req.query.searchText || '').trim();
  const status = req.query.status ? normalizeEmployeeStatus(req.query.status) : null;
 
  const localRowsRaw = await prUseCase.listLocalEmployees({ corporateUserId, status });
 
  let payrollRowsRaw = [];
  const payrollUrl = `${PAYROLL_SERVICE_URL}/api/v1/corporate/${corporateUserId}/payroll/employee`;
  console.log(`[listEmployees] Calling payroll: ${payrollUrl}`);
  customLog(req?.LogTraceId, "info", { message: `Calling payroll service for employees`, url: payrollUrl, search });  
 
   
  try {
    const payrollResponse = await axios.get(
      payrollUrl,
      { params: { searchText: search, limit: 1000, page: 1, status: 'active' }, headers: getForwardHeaders(req) }
    );
   customLog(req?.LogTraceId, "info", { message: `Payroll response received`, status: payrollResponse.status, dataLength: payrollResponse.data?.data?.length || 0 });
    payrollRowsRaw = extractPayrollRows(payrollResponse.data?.data);
    console.log(`[listEmployees] Payroll employees extracted: ${payrollRowsRaw.length}`);
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: `Payroll fetch failed`, error: error.message, status: error.response?.status, data: error.response?.data } );
    payrollRowsRaw = [];
  }
 
  const localRows   = localRowsRaw.map((r) => normalizeCombinedEmployee(r.toJSON()));
  const payrollRows = payrollRowsRaw.map((r) => normalizeCombinedEmployee(r));
  console.log(`[listEmployees] Local: ${localRows.length}, Payroll: ${payrollRows.length}`);
 
  const seen = new Set();
  let employees = [];
  [...localRows, ...payrollRows].forEach((emp) => {
    const key = (emp.email || emp.employeeCode || `${emp.fullName || ''}|${emp.phone || ''}`).toLowerCase();
    if (!seen.has(key)) { seen.add(key); employees.push(emp); }
  });
  console.log(`[listEmployees] After dedup: ${employees.length}`);
 
  if (status) employees = employees.filter((e) => e.status === status);
  if (search) {
    const s = search.toLowerCase();
    employees = employees.filter((e) =>
      [e.fullName, e.employeeCode, e.email, e.department, e.designation, e.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }
  console.log(`[listEmployees] Final count after filters: ${employees.length}`);
 
  return res.status(200).json({
    status: true,
    message: 'Employees fetched successfully',
    data: { employees },
    responseCode: '000',
  });
});

// ─── ADD EMPLOYEE ─────────────────────────────────────────────────────────────

exports.addEmployee = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  if (!corporateUserId) return next(new ErrorResponse('corporateUserId is required', 400));

  const payload = extractEmployeePayload(req.body);
  if (!payload.fullName)   return next(new ErrorResponse('employeeName is required', 400));
  if (!payload.department) return next(new ErrorResponse('department is required', 400));

  const duplicateWhere = [];
  if (payload.fullName)     duplicateWhere.push({ fullName:     payload.fullName });
  if (payload.employeeCode) duplicateWhere.push({ employeeCode: payload.employeeCode });
  if (payload.email)        duplicateWhere.push({ email:        payload.email });

  if (duplicateWhere.length) {
    const existing = await prUseCase.findDuplicateEmployee({ corporateUserId, duplicateWhere });
    if (existing) return next(new ErrorResponse('Employee already exists', 409));
  }

  const employee = await prUseCase.createEmployee({ corporateUserId, payload });

  return res.status(201).json({
    status: true,
    message: 'Employee added successfully',
    data: employee,
    responseCode: '000',
  });
});
