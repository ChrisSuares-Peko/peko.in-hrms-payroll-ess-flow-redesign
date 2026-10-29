const Joi = require('joi');
const ExcelJS = require('exceljs');
const InvoiceCustomerV2 = require('../models/entities/invoiceCustomerV2');

// Bank details are intentionally excluded from bulk upload — adding a bank account
// requires a live verification step (HMAC verifyToken from /verify-bank) that can't be
// done per-row for an uploaded file. Bank accounts are added afterward via the normal
// edit screen, same as every other optional field not on this sheet.

// Field → header label, plus which group it belongs to for the template's color-coding.
const FIELD_DEFS = {
  name: { header: 'Customer Name*', group: 'basic' },
  personOfContact: { header: 'Person of Contact', group: 'basic' },
  gstin: { header: 'GSTIN', group: 'basic' },
  phoneNumber: { header: 'Phone Number*', group: 'basic' },
  email: { header: 'Email', group: 'basic' },
  upiId: { header: 'UPI ID', group: 'basic' },
  notes: { header: 'Notes', group: 'basic' },
  primaryAddress: { header: 'Primary Address*', group: 'primary' },
  primaryCity: { header: 'Primary City*', group: 'primary' },
  primaryState: { header: 'Primary State*', group: 'primary' },
  primaryPincode: { header: 'Primary Pincode*', group: 'primary' },
  primaryCountry: { header: 'Primary Country*', group: 'primary' },
  currency: { header: 'Currency*', group: 'primary' },
  shippingAddress: { header: 'Shipping Address', group: 'shipping' },
  shippingCity: { header: 'Shipping City', group: 'shipping' },
  shippingState: { header: 'Shipping State', group: 'shipping' },
  shippingPincode: { header: 'Shipping Pincode', group: 'shipping' },
};

// SalesX's "Add Customer" form has Person of Contact and Notes fields; invoicing's does
// not — so each module's bulk sheet only carries the fields its own single-add form
// actually supports. Currency is the reverse case: only invoicing's Add Customer form has
// it, so it's injected into invoicing's key list rather than carried on the shared base.
const SALES_FIELD_KEYS = [
  'name', 'personOfContact', 'gstin', 'phoneNumber', 'email', 'upiId', 'notes',
  'primaryAddress', 'primaryCity', 'primaryState', 'primaryPincode', 'primaryCountry',
  'shippingAddress', 'shippingCity', 'shippingState', 'shippingPincode',
];
const INVOICING_FIELD_KEYS = SALES_FIELD_KEYS.filter(
  (key) => key !== 'personOfContact' && key !== 'notes'
).flatMap((key) => (key === 'primaryCountry' ? [key, 'currency'] : [key]));

const getFieldKeys = (module) => (module === 'invoicing' ? INVOICING_FIELD_KEYS : SALES_FIELD_KEYS);
const getHeaders = (module) => getFieldKeys(module).map((key) => FIELD_DEFS[key].header);

// Where each color group ends, in column count, for the given module's field set — used
// only for the template's header color-coding.
const getGroupBoundaries = (module) => {
  const keys = getFieldKeys(module);
  const basicCount = keys.filter((key) => FIELD_DEFS[key].group === 'basic').length;
  const primaryCount = basicCount + keys.filter((key) => FIELD_DEFS[key].group === 'primary').length;
  return { basicCount, primaryCount, total: keys.length };
};

const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// One Joi schema for both modules — invoicing rows simply never populate
// personOfContact/notes (defaulted to '' in excelToJson below), and both fields are
// already optional here, so nothing extra is needed per module.
const customerRowSchema = Joi.object({
  name: Joi.string().trim().min(3).max(50).required()
    .messages({
      'string.empty': 'Customer Name is required',
      'string.min': 'Customer Name must be at least 3 characters',
      'any.required': 'Customer Name is required',
    }),

  personOfContact: Joi.string().trim().allow('', null).max(50)
    .label('Person of Contact'),

  gstin: Joi.string().trim().allow('', null).pattern(gstinPattern)
    .messages({ 'string.pattern.base': 'Please enter a valid GST number' })
    .label('GSTIN'),

  phoneNumber: Joi.string().trim().pattern(/^[6-9][0-9]{9}$/).required()
    .messages({
      'string.pattern.base': 'Please enter a valid Indian mobile number',
      'any.required': 'Phone Number is required',
      'string.empty': 'Phone Number is required',
    }),

  email: Joi.string().trim().allow('', null).email({ tlds: { allow: false } })
    .messages({ 'string.email': 'Please enter a valid email address' }),

  upiId: Joi.string().trim().allow('', null),

  notes: Joi.string().trim().allow('', null).max(500)
    .messages({ 'string.max': 'Notes cannot exceed 500 characters' }),

  primaryAddress: Joi.string().trim().min(3).max(100).required()
    .messages({
      'string.empty': 'Primary Address is required',
      'any.required': 'Primary Address is required',
    }),

  primaryCity: Joi.string().trim().min(3).max(50).required()
    .messages({
      'string.empty': 'Primary City is required',
      'any.required': 'Primary City is required',
    }),

  primaryState: Joi.string().trim().required()
    .messages({
      'string.empty': 'Primary State is required',
      'any.required': 'Primary State is required',
    }),

  primaryPincode: Joi.string().trim().pattern(/^[0-9]{6}$/).required()
    .messages({
      'string.pattern.base': 'Primary Pincode must be exactly 6 digits',
      'any.required': 'Primary Pincode is required',
    }),

  primaryCountry: Joi.string().trim().required()
    .messages({
      'string.empty': 'Primary Country is required',
      'any.required': 'Primary Country is required',
    }),

  currency: Joi.string().trim().uppercase().length(3).required()
    .messages({
      'string.empty': 'Currency is required',
      'string.length': 'Currency must be a 3-letter currency code',
      'any.required': 'Currency is required',
    }),

  shippingAddress: Joi.string().trim().allow('', null).max(100),
  shippingCity: Joi.string().trim().allow('', null).max(50),
  shippingState: Joi.string().trim().allow('', null),
  shippingPincode: Joi.string().trim().allow('', null).pattern(/^[0-9]{6}$/)
    .messages({ 'string.pattern.base': 'Shipping Pincode must be exactly 6 digits' }),

  // Never populated from the Excel sheet — only ever set afterward, per-row, in the "View
  // and Edit" drawer (same AddBankAccountModal + live verify-bank flow as the single Add
  // Customer form). The HMAC verifyToken on each entry is checked at bulk-create time (see
  // bulkCreateCustomers), same as the single-customer create/update flow.
  bankDetails: Joi.array().items(
    Joi.object({
      accountHolderName: Joi.string().required(),
      accountNumber: Joi.string().required(),
      ifscCode: Joi.string().required(),
      swiftCode: Joi.string().allow('', null).optional(),
      iban: Joi.string().allow('', null).optional(),
      verified: Joi.boolean().optional(),
      verifyToken: Joi.string().allow('', null).optional(),
    })
  ).optional(),

  validated: Joi.boolean().optional(),
  errors: Joi.array().optional(),
});

const cellText = (row, col) => {
  const value = row.getCell(col).value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && value.text) return String(value.text).trim();
  if (typeof value === 'object' && value.richText) {
    return value.richText.map((t) => t.text).join('').trim();
  }
  return String(value).trim();
};

// excelController.js
const excelToJson = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        responseCode: '001',
        message: 'No file provided',
        data: {},
      });
    }

    const module = req.query.module === 'invoicing' ? 'invoicing' : 'sales';
    const fieldKeys = getFieldKeys(module);
    const headers = getHeaders(module);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    const headerRow = worksheet.getRow(1);
    const actualHeaders = headerRow.values.slice(1).map((h) => (h || '').toString().trim());

    if (actualHeaders.length !== headers.length) {
      return res.status(400).json({
        status: false,
        responseCode: '001',
        message: 'Invalid Excel format: Please upload the correct template.',
        data: {},
      });
    }

    for (let i = 0; i < headers.length; i++) {
      if (actualHeaders[i] !== headers[i]) {
        return res.status(400).json({
          status: false,
          responseCode: '001',
          message: 'Invalid Excel format. Please upload the correct template.',
          data: {},
        });
      }
    }

    const jsonData = [];
    worksheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return;

      const rowData = {};
      fieldKeys.forEach((key, idx) => {
        let value = cellText(row, idx + 1);
        if (key === 'gstin') value = value.toUpperCase();
        if (key === 'email') value = value.toLowerCase();
        rowData[key] = value;
      });

      // Invoicing's sheet never has these columns — default so every row has the same
      // shape as a SalesX-uploaded one (and so Joi/BulkCustomerRow see a consistent object).
      if (module === 'invoicing') {
        rowData.personOfContact = '';
        rowData.notes = '';
      } else {
        // SalesX's sheet has no Currency column (currency isn't supported on a Sales
        // customer yet) — default it so the shared Joi schema sees a consistent object.
        rowData.currency = 'INR';
      }

      // Skip fully blank trailing rows some spreadsheet apps leave behind.
      if (Object.values(rowData).some((v) => v !== '')) {
        jsonData.push(rowData);
      }
    });

    req.body.jsonData = jsonData;
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const validateExcelData = async (req, res, next) => {
  try {
    const { jsonData } = req.body;
    const corporateUserId = req.user.corporateId;

    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      return res.status(400).json({
        status: false,
        responseCode: '001',
        message: 'There is no data to validate.',
        data: {},
      });
    }

    const existingCustomers = await InvoiceCustomerV2.findAll({
      where: { corporateUserId },
      attributes: ['email', 'gstin', 'phoneNumber'],
      raw: true,
    });

    const existingEmails = new Set(
      existingCustomers.filter((c) => c.email).map((c) => c.email.toLowerCase())
    );
    const existingGstins = new Set(
      existingCustomers.filter((c) => c.gstin).map((c) => c.gstin.toUpperCase())
    );
    const existingPhones = new Set(
      existingCustomers.filter((c) => c.phoneNumber).map((c) => c.phoneNumber)
    );

    const seenEmails = new Set();
    const seenGstins = new Set();
    const seenPhones = new Set();

    let fullyValidated = true;

    jsonData.forEach((item) => {
      item.errors = [];
      item.validated = true;

      const { error } = customerRowSchema.validate(item, {
        abortEarly: false,
        errors: { wrap: { label: '' } },
      });

      if (error) {
        item.validated = false;
        error.details.forEach((err) => item.errors.push(err.message));
      }

      if (item.email) {
        const email = item.email.toLowerCase();
        if (existingEmails.has(email) || seenEmails.has(email)) {
          item.validated = false;
          item.errors.push('Email is already associated with a customer');
        } else {
          seenEmails.add(email);
        }
      }

      if (item.gstin) {
        const gstin = item.gstin.toUpperCase();
        if (existingGstins.has(gstin) || seenGstins.has(gstin)) {
          item.validated = false;
          item.errors.push('A customer with this GSTIN already exists');
        } else {
          seenGstins.add(gstin);
        }
      }

      if (item.phoneNumber) {
        if (existingPhones.has(item.phoneNumber) || seenPhones.has(item.phoneNumber)) {
          item.validated = false;
          item.errors.push('This phone number is already associated with a customer');
        } else {
          seenPhones.add(item.phoneNumber);
        }
      }

      if (item.errors.length > 0) fullyValidated = false;
    });

    // Errors first, so the reviewer sees what needs fixing without paging through
    // every already-valid row.
    const errors = jsonData.filter((item) => item.errors.length > 0);
    const validData = jsonData.filter((item) => item.errors.length === 0);

    req.body.jsonData = [...errors, ...validData];
    req.body.fullyValidated = fullyValidated;

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports = {
  excelToJson,
  validateExcelData,
  getHeaders,
  getGroupBoundaries,
};
