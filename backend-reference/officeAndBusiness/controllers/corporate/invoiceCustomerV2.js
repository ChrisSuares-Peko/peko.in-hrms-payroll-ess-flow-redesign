const asyncHandler = require("../../middlewares/async");
const { createInvoiceCustomerV2, checkEmailExistV2, checkGstinExist, checkPhoneNumberExistV2, updateInvoiceCustomerV2, deleteInvoiceCustomerV2, getAllInvoiceCustomersV2, getCustomerDashboard } = require("../../models/use-cases/invoiceCustomerV2");
const InvoiceCustomerV2 = require("../../models/entities/invoiceCustomerV2");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const axios = require("axios");
const crypto = require("crypto");
const ExcelJS = require("exceljs");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const operatorsData = require("../../utils/operatorsData.json");
const { getHeaders: getBulkCustomerHeaders, getGroupBoundaries: getBulkCustomerGroupBoundaries } = require("../../services/customerBulkUpload");

const generateBankVerifyToken = (bank_account, ifsc, corporateUserId) => {
  return crypto
    .createHmac('sha256', process.env.BANK_VERIFY_SECRET)
    .update(`${bank_account}|${ifsc}|${corporateUserId}`)
    .digest('hex');
};

const validateBankDetails = (bankDetails, corporateUserId) => {
  if (!Array.isArray(bankDetails)) return { error: null, data: [] };
  for (const bank of bankDetails) {
    const masked = bank.accountNumber ? `ending in ${String(bank.accountNumber).slice(-4)}` : '';
    if (!bank.verifyToken) {
      return { error: `Bank account ${masked} is not verified. Please verify before saving.` };
    }
    const expected = generateBankVerifyToken(bank.accountNumber, bank.ifscCode, corporateUserId);
    if (expected !== bank.verifyToken) {
      return { error: `Bank account ${masked} verification tampered. Please re-verify before saving.` };
    }
  }
  return { error: null, data: bankDetails };
};

exports.getAllCustomersV2 = asyncHandler(async (req, res, next) => {
  try {
    const corporateUserId = req.user.corporateId;
    let { searchText, page, itemsPerPage, sort, sortField, status, startDate, endDate } = req.query;

    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return next(new ErrorResponse("startDate cannot be greater than endDate.", 400));
    }

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
    const limit = itemsPerPage;
    const offset = (page - 1) * itemsPerPage;

    const result = await getAllInvoiceCustomersV2({
      searchText: searchText || '',
      sort,
      sortField: sortField || 'id',
      limit,
      offset,
      corporateUserId,
      status: status || null,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    return res.status(200).json({
      status: true,
      message: "Customers fetched successfully",
      data: {
        customers: result.rows,
        recordsTotal: result.count,
      },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.updateCustomerV2 = asyncHandler(async (req, res, next) => {
  try {
    const corporateUserId = req.user.corporateId;
    const { id } = req.params;
    const data = req.body;

    if (data.email) {
      const emailExists = await checkEmailExistV2(data.email, corporateUserId, id);
      if (emailExists) {
        return next(new ErrorResponse("This email is already associated with a customer.", 403));
      }
    }

    if (data.gstin) {
      const gstinExists = await checkGstinExist(data.gstin, corporateUserId, id);
      if (gstinExists) {
        return next(new ErrorResponse("A customer with this GSTIN already exists", 403));
      }
    }

    if (data.phoneNumber) {
      const phoneExists = await checkPhoneNumberExistV2(data.phoneNumber, corporateUserId, id);
      if (phoneExists) {
        return next(new ErrorResponse("This phone number is already associated with a customer", 403));
      }
    }

    if (data.bankDetails) {
      const existing = await updateInvoiceCustomerV2(id, corporateUserId, null, true);
      const existingBanks = existing?.bankDetails || [];
      for (const bank of data.bankDetails) {
        const match = existingBanks.find(b => b.accountNumber === bank.accountNumber && b.ifscCode === bank.ifscCode);
        const masked = `ending in ${String(bank.accountNumber).slice(-4)}`;
        if (match) {
          if (bank.verifyToken && bank.verifyToken !== match.verifyToken) {
            return next(new ErrorResponse(`Bank account ${masked} verification token mismatch. Please re-verify.`, 400));
          }
          bank.verifyToken = match.verifyToken;
        }
      }
      const { error, data: validatedBanks } = validateBankDetails(data.bankDetails, corporateUserId);
      if (error) return next(new ErrorResponse(error, 400));
      data.bankDetails = validatedBanks;
    }

    const result = await updateInvoiceCustomerV2(id, corporateUserId, data);
    if (!result) {
      return next(new ErrorResponse("Customer not found", 404));
    }

    return res.status(200).json({
      status: true,
      message: "Customer updated successfully",
      data: {},
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.deleteCustomerV2 = asyncHandler(async (req, res, next) => {
  try {
    const corporateUserId = req.user.corporateId;
    const { id } = req.params;

    const result = await deleteInvoiceCustomerV2(id, corporateUserId);
    if (!result) {
      return next(new ErrorResponse("Customer not found", 404));
    }

    return res.status(200).json({
      status: true,
      message: "Customer deleted successfully",
      data: {},
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.createCustomerV2 = asyncHandler(async (req, res, next) => {
  try {
    let data = req.body;
    data = { corporateUserId: req.user.corporateId, ...data };

    if (data.email) {
      const emailExists = await checkEmailExistV2(data.email, data.corporateUserId);
      if (emailExists) {
        return next(new ErrorResponse("This email is already associated with a customer.", 403));
      }
    }

    if (data.gstin) {
      const gstinExists = await checkGstinExist(data.gstin, data.corporateUserId);
      if (gstinExists) {
        return next(new ErrorResponse("A customer with this GSTIN already exists", 403));
      }
    }

    if (data.phoneNumber) {
      const phoneExists = await checkPhoneNumberExistV2(data.phoneNumber, data.corporateUserId);
      if (phoneExists) {
        return next(new ErrorResponse("This phone number is already associated with a customer", 403));
      }
    }

    if (data.bankDetails) {
      const { error, data: validatedBanks } = validateBankDetails(data.bankDetails, data.corporateUserId);
      if (error) return next(new ErrorResponse(error, 400));
      data.bankDetails = validatedBanks;
    }

    const customer = await createInvoiceCustomerV2(data);
    if (!customer) {
      return next(new ErrorResponse("Something went wrong while adding customer", 500));
    }

    return res.status(201).json({
      status: true,
      message: "Customer created successfully",
      data: customer,
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.verifyBankAccountDirect = asyncHandler(async (req, res, next) => {
  try {
    const { bank_account, ifsc, name } = req.body;

    if (!bank_account || !ifsc || !name) {
      return next(new ErrorResponse("bank_account, ifsc and name are required", 400));
    }

    const accessKey = operatorsData['bankAccount']['accessKey'];
    const serviceDetails = await fetchServiceDetails({
      credentialId: req.user.id,
      accessKey,
      packageId: req.user.packageId,
      corporateUserId: req.user.corporateId,
    });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse(serviceDetails.error, 400));
    }

    let result;
    try {
      result = await axios({
        method: 'post',
        url: `${serviceDetails.vendor.apiUrl}/verification/bank-account/sync`,
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': serviceDetails.vendor.optional1,
          'x-client-secret': serviceDetails.vendor.optional2,
        },
        data: { bank_account, ifsc, name },
      });
    } catch (error) {
      result = { status: error?.response?.status || 500, data: error?.response?.data || {} };
    }

    if (result?.status >= 200 && result?.status < 300) {
      const verifyToken = generateBankVerifyToken(bank_account, ifsc, req.user.corporateId);
      return res.status(200).json({
        status: true,
        message: "Bank account verified successfully",
        data: { ...result.data, verifyToken },
        responseCode: "000",
      });
    }

    const errorCode = result?.data?.code || '';
    const bavMessages = {
      invalid_account_number: "Invalid account number. Please check and try again.",
      invalid_ifsc:           "Invalid IFSC code. Please check and try again.",
      failed_at_bank:         "Verification failed at the bank's end. Please try again later.",
      account_blocked:        "This account is blocked. Please use a different account.",
      fraud_account:          "This account has been flagged and cannot be verified.",
    };
    const message = bavMessages[errorCode] || "Bank account verification failed. Please check the details and try again.";

    return res.status(400).json({
      status: false,
      message,
      data: result?.data || {},
      responseCode: "001",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message });
    next(new ErrorResponse(error.message, 500));
  }
});

// GET /invoicing/customers/dashboard
exports.getCustomerDashboard = asyncHandler(async (req, res, next) => {
  try {
    const corporateUserId = req.user.corporateId;
    const data = await getCustomerDashboard(corporateUserId);

    return res.status(200).json({
      status: true,
      message: "Customer dashboard fetched successfully",
      data,
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message });
    return next(new ErrorResponse(error.message, 500));
  }
});

// GET /invoice-customer/v2/bulk-excel-template?module=invoicing|sales
// SalesX's Add Customer form has Person of Contact + Notes; invoicing's doesn't — so each
// module gets a template with only the columns its own single-add form actually supports.
exports.getCustomerBulkExcelTemplate = asyncHandler(async (req, res, next) => {
  try {
    const module = req.query.module === 'invoicing' ? 'invoicing' : 'sales';
    const headers = getBulkCustomerHeaders(module);
    const { basicCount, primaryCount } = getBulkCustomerGroupBoundaries(module);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customers');

    worksheet.columns = headers.map((header) => ({ header, key: header, width: 22 }));

    // Header color-coding by field group: blue = basic info, green = primary address,
    // grey = shipping address (optional).
    const HEADER_GROUP_COLORS = {
      basic: 'FFD9E8F5',
      primary: 'FFDCE9D5',
      shipping: 'FFE2E2E2',
    };
    const colorForColumn = (c) => {
      if (c <= basicCount) return HEADER_GROUP_COLORS.basic;
      if (c <= primaryCount) return HEADER_GROUP_COLORS.primary;
      return HEADER_GROUP_COLORS.shipping;
    };

    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    for (let c = 1; c <= headers.length; c++) {
      const cell = headerRow.getCell(c);
      cell.style = {
        font: { bold: true, size: 11, name: 'Calibri' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colorForColumn(c) } },
        alignment: { vertical: 'middle' },
        border: { bottom: { style: 'medium', color: { argb: 'FF8496B0' } } },
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return res.status(200).json({
      status: true,
      responseCode: '000',
      message: 'Excel buffer sent successfully.',
      data: { buffer },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message });
    return next(new ErrorResponse(error.message, 500));
  }
});

// POST /invoice-customer/v2/bulk-excel-upload and /bulk-validate — both end here after
// excelToJson/validateExcelData have populated req.body.jsonData + fullyValidated.
exports.sendCustomerBulkValidationResponse = asyncHandler(async (req, res) => {
  const { jsonData, fullyValidated } = req.body;

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Validation completed',
    data: { jsonData, fullyValidated },
  });
});

// POST /invoice-customer/v2/bulk-create
exports.bulkCreateCustomers = asyncHandler(async (req, res, next) => {
  try {
    const { jsonData, fullyValidated } = req.body;
    const corporateUserId = req.user.corporateId;

    if (!fullyValidated) {
      return res.status(400).json({
        status: false,
        responseCode: '001',
        message: 'Please correct all validation errors before proceeding',
        data: { jsonData },
      });
    }

    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      return res.status(400).json({
        status: false,
        responseCode: '001',
        message: 'There is no data to upload.',
        data: {},
      });
    }

    const records = [];
    for (const item of jsonData) {
      let bankDetails = [];
      if (Array.isArray(item.bankDetails) && item.bankDetails.length) {
        const { error, data: validatedBanks } = validateBankDetails(item.bankDetails, corporateUserId);
        if (error) {
          return res.status(400).json({
            status: false,
            responseCode: '001',
            message: `${item.name || 'A customer'}: ${error}`,
            data: {},
          });
        }
        bankDetails = validatedBanks;
      }

      records.push({
        corporateUserId,
        name: item.name,
        personOfContact: item.personOfContact || null,
        gstin: item.gstin || null,
        phoneNumber: item.phoneNumber,
        email: item.email || null,
        upiId: item.upiId || null,
        notes: item.notes || null,
        primaryAddress: item.primaryAddress,
        primaryCity: item.primaryCity,
        primaryState: item.primaryState,
        primaryPincode: item.primaryPincode,
        primaryCountry: item.primaryCountry,
        currency: item.currency || 'INR',
        shippingAddress: item.shippingAddress || null,
        shippingCity: item.shippingCity || null,
        shippingState: item.shippingState || null,
        shippingPincode: item.shippingPincode || null,
        bankDetails,
      });
    }

    const created = await InvoiceCustomerV2.bulkCreate(records);

    return res.status(200).json({
      status: true,
      responseCode: '000',
      message: 'All customers saved successfully.',
      data: { count: created.length },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return next(new ErrorResponse("Something went wrong while saving customers", 500));
  }
});
