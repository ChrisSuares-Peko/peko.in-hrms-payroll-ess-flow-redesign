const Joi = require("joi");
const ExcelJS = require('exceljs');
const moment = require('moment')
const Employee = require("../models/entities/employee");
const { activeEmployeeFilter, statusForProbation, DEFAULT_PROBATION_MONTHS } = require("../models/use-cases/employee");
const Department = require("../models/entities/department");

// India-payroll-only template — no Country column (see bulkCreate, which hardcodes
// personalInformation.country to 'India' now that this field no longer exists on the sheet).
const BASE_HEADERS = [
  'Full Name*',
  'Date of Birth*',
  'Gender*',
  'Mobile No*',
  'Personal Email*',
  'Address Line 1*',
  'Address Line 2*',
  'State*',
  'PIN Code*',
  'Emergency Contact Name',
  'Emergency Contact Number',
  'Emergency Contact Relation',
  'Employee ID*',
  'Date of Join*',
  'Designation*',
  'Department',
  'Work Email*',
  'Job Type*',
  'Reporting Staff',
  'Schedule*',
  'Probation Period (months)',
  'Working Days*',
];

// Fixed columns (23-28) that replaced the old per-org dynamic salary/deduction component
// columns — bulk upload now takes only a target Annual CTC per employee and derives the
// full salary structure from it using the same engine the CTC Calculator uses (see
// models/use-cases/bulkEmployeeCtc.js), rather than requiring the uploader to type in
// every component's rupee amount by hand.
const CTC_UPLOAD_HEADERS = ['PAN*', 'Tax Regime', 'UAN', 'ESI Number', 'Work State', 'Annual CTC (₹)*'];

// Fixed columns (29-32), right after CTC_UPLOAD_HEADERS — an employee's default bank
// account, created alongside them during bulkCreate (see BankDetails.insertMany there).
const BANK_UPLOAD_HEADERS = ['Account Holder Name', 'Account Number', 'Bank Name', 'IFSC Code'];

// How many of the leading BASE_HEADERS are "personal information" (Full Name through
// Emergency Contact Relation) vs. "job/employment information" (Employee ID onward) — used
// by getBulkExcelTemplate to color-code the header row. Kept alongside BASE_HEADERS so the
// two stay in sync if columns are ever added/removed.
const PERSONAL_INFO_HEADER_COUNT = 12;


function calculateWorkingHours(schedule) {
  if (!schedule) return 0;
  const times = schedule.split(' - ');
  if (times.length !== 2) return 0;
  const start = moment(times[0], 'h:mm A');
  const end = moment(times[1], 'h:mm A');
  if (!start.isValid() || !end.isValid()) return 0;
  return moment.duration(end.diff(start)).asHours();
}


// excelController.js
const validateExcelData = async (req, res, next) => {
  try {
    const { jsonData } = req.body;

    const corporateUser = req.user._id;

    // Schedule: 9:00 AM - 6:00 PM
    const scheduleRegex =
      /^\d{1,2}(:[0-5][0-9])?\s*(AM|PM)\s*-\s*\d{1,2}(:[0-5][0-9])?\s*(AM|PM)$/;


    const employeeSchema = Joi.object({
      corporateUser: Joi.string()
        .required()
        .label("Corporate User"),

      employeeId: Joi.string()
        .min(4)
        .required()
        .messages({
          'string.min': 'Employee ID must be at least 4 characters long',
          'string.empty': 'Employee ID is required',
        })
        .label("Employee ID"),

      fullName: Joi.string()
        .trim()
        .min(3)
        .required()
        .label("Full Name")
        .messages({
          "string.empty": "Full Name is not allowed to be empty",
          "string.min": "Full Name must be at least 3 characters",
          "any.required": "Full Name is required",
        }),

      dateOfBirth: Joi.date()
        .required()
        .label("Date of Birth")
        .messages({
          "any.required": "Date of Birth is required",
          "date.base": "Date of Birth must be a valid date",
        }),

      gender: Joi.string()
        .valid("MALE", "FEMALE")
        .required()
        .label("Gender")
        .messages({
          "any.only": "Gender must be Male or Female ",
        }),

      /* ✅ Exactly 10 Digits */
      mobileNo: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required()
        .label("Mobile Number")
        .messages({
          "string.pattern.base":
            "Mobile Number must contain exactly 10 digits",
          "any.required": "Mobile Number is required",
        }),

      email: Joi.string()
        .email()
        .required()
        .label("Personal Email")
        .messages({
          "string.email": "Please enter a valid email address",
        }),

      state: Joi.string()
        .required()
        .label("State")
        .messages({
          "any.required": "State is required",
          "string.empty": "State is required",
        }),

      addressLine1: Joi.string()
        .trim()
        .required()
        .label("Address Line 1")
        .messages({
          "string.empty": "Address Line 1 is required",
          "any.required": "Address Line 1 is required",
        }),

      addressLine2: Joi.string()
        .trim()
        .required()
        .label("Address Line 2")
        .messages({
          "string.empty": "Address Line 2 is required",
          "any.required": "Address Line 2 is required",
        }),

      pinCode: Joi.string()
        .pattern(/^[0-9]{6}$/)
        .required()
        .label("Pin Code")
        .messages({
          "string.pattern.base": "Pin Code must contain exactly 6 digits",
        }),

      emergencyContactNumber: Joi.string()
        .allow("", null)
        .label("Emergency Contact Number"),

      emergencyContactName: Joi.string()
        .allow("", null)
        .label("Emergency Contact Name"),

      emergencyContactRelation: Joi.string()
        .allow("", null)
        .label("Emergency Contact Relation"),

      department: Joi.string()
        .allow("", null)
        .label("Department"),

      dateOfJoin: Joi.date()
        .required()
        .label("Date of Join")
        .messages({
          "any.required": "Date of Join is required",
          "date.base": "Date of Join must be valid",
        }),

      designation: Joi.string()
        .required()
        .label("Designation"),

      workEmailId: Joi.string()
        .email()
        .optional()
        .allow("", null)
        .label("Work Email"),

      workingDays: Joi.string()
        .required()
        .label("Working Days"),

      workingHours: Joi.string()
        .label("Working Hours"),

      contractType: Joi.string()
        .valid("FULL_TIME", "PART_TIME")
        .required()
        .label("Job Type")
        .messages({
          "any.only": "Job Type must be either Full Time or Part Time",
          "any.required": "Job Type must be either Full Time or Part Time", // same message for empty

        }),
      reportingStaff: Joi.string()
        .allow("", null)
        .label("Reporting Staff"),

      timeSchedule: Joi.string()
        .pattern(scheduleRegex)
        .required()
        .label("Time Schedule")
        .messages({
          "string.pattern.base":
            'Schedule must be "h:mm AM/PM - h:mm AM/PM"',
        }),

      // Not a sheet column: worked out from the probation period (see the normalization below).
      employeeStatus: Joi.string()
        .valid("ACTIVE", "INPROBATION"),

      probationPeriod: Joi.number()
        .integer()
        .min(0)
        .max(12)
        .allow(null, "")
        .label("Probation Period")
        .messages({
          "number.base": "Probation Period must be a number of months (0-12)",
          "number.integer": "Probation Period must be a whole number of months (0-12)",
          "number.min": "Probation Period must be between 0 and 12 months",
          "number.max": "Probation Period must be between 0 and 12 months",
        }),

      pan: Joi.string()
        .required()
        .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
        .label("PAN")
        .messages({
          "string.pattern.base": "PAN must be in the format ABCDE1234F",
          "any.required": "PAN is required — without it, TDS is deducted at the higher Section 206AA rate",
          "string.empty": "PAN is required — without it, TDS is deducted at the higher Section 206AA rate",
        }),

      // Normalized to the canonical 'New Tax Regime'/'Old Tax Regime' by the pre-Joi
      // normalization pass below (accepts the sheet's shorter 'New'/'Old', case-insensitive,
      // blank defaults to New) — every other consumer of otherConfigurations.tdsRegime
      // (e.g. reportsAndForms.js) still expects the long form, so storage format is
      // unchanged; only the sheet's own enum got simpler.
      taxRegime: Joi.string()
        .allow("", null)
        .valid("New Tax Regime", "Old Tax Regime")
        .label("Tax Regime")
        .messages({
          "any.only": "Tax Regime must be either 'New' or 'Old'",
        }),

      uan: Joi.string()
        .allow("", null)
        .pattern(/^[0-9]{12}$/)
        .label("UAN")
        .messages({
          "string.pattern.base": "UAN must contain exactly 12 digits",
        }),

      // Only relevant when the employee's gross salary falls within the ESI ceiling
      // (₹21,000/month) — optional here since not every employee is ESI-eligible.
      esiNumber: Joi.string()
        .allow("", null)
        .pattern(/^[0-9]{10}$/)
        .label("ESI Number")
        .messages({
          "string.pattern.base": "ESI Number must contain exactly 10 digits",
        }),

      workState: Joi.string()
        .allow("", null)
        .label("Work State"),

      annualCTC: Joi.number()
        .positive()
        .required()
        .label("Annual CTC")
        .messages({
          "any.required": "Annual CTC is required",
          "number.base": "Annual CTC must be a number",
          "number.positive": "Annual CTC must be greater than 0",
        }),

      accountHolderName: Joi.string()
        .allow("", null)
        .label("Account Holder Name"),

      accountNumber: Joi.string()
        .pattern(/^[0-9]{9,18}$/)
        .allow("", null)
        .label("Account Number")
        .messages({
          "string.pattern.base": "Account Number must contain 9-18 digits",
        }),

      bankName: Joi.string()
        .allow("", null)
        .label("Bank Name"),

      ifscCode: Joi.string()
        .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/i)
        .allow("", null)
        .label("IFSC Code")
        .messages({
          "string.pattern.base": "Please enter a valid IFSC code",
        }),

      validated: Joi.boolean().optional(),
      errors: Joi.array().optional(),
    });

    /* ===============================
       Normalize Data
    =============================== */

    jsonData.forEach((item) => {
      item.errors = [];

      if (item.mobileNo) {
        item.mobileNo = String(item.mobileNo).trim();
      }

      // Empty Excel cells come through as null and numeric-only addresses (e.g. "12") as
      // numbers — coerce to a trimmed string so Joi reports "is required" instead
      // of the unhelpful "must be a string".
      ['addressLine1', 'addressLine2'].forEach((key) => {
        item[key] = item[key] == null ? '' : String(item[key]).trim();
      });

      if(item.workEmailId){
        item.workEmailId = (item.workEmailId?.text || item.workEmailId+"")?.toLowerCase().trim();
      }

      if (item.timeSchedule) {
        item.timeSchedule = item.timeSchedule
          .toString()
          .trim()
          .replace(/[–—]/g, "-")
          .replace(/\s+/g, " ");
        item.workingHours = calculateWorkingHours(item.timeSchedule).toString();
      }
      else {
        item.workingHours = "0";
      }

      if (item.contractType) {
        item.contractType = item.contractType
          .toUpperCase()
          .replace(" ", "_");
      }

      if (item.ifscCode) {
        item.ifscCode = String(item.ifscCode).trim().toUpperCase();
      }

      // Tax Regime: the sheet's enum is the short 'New'/'Old' (blank = New), but every
      // other consumer of otherConfigurations.tdsRegime expects the long-form 'New Tax
      // Regime'/'Old Tax Regime' — normalize here so storage format is unchanged.
      // Case-insensitive, and tolerant of an already-long-form value for backward
      // compatibility with templates downloaded before this change.
      {
        const rawRegime = (item.taxRegime ?? '').toString().trim().toLowerCase();
        if (rawRegime === '' || rawRegime === 'new' || rawRegime === 'new tax regime') {
          item.taxRegime = 'New Tax Regime';
        } else if (rawRegime === 'old' || rawRegime === 'old tax regime') {
          item.taxRegime = 'Old Tax Regime';
        }
      }

      // Every uploaded employee joins as active; whether they're on probation follows the
      // Probation Period (months) column alone.
      // A blank Probation Period means the default 3 months; 0 means no probation.
      if (item.probationPeriod === null || item.probationPeriod === undefined || item.probationPeriod === '') {
        item.probationPeriod = DEFAULT_PROBATION_MONTHS;
      }
      item.employeeStatus = statusForProbation(item.probationPeriod);

    });

    /* ===============================
       Fetch Existing Data
    =============================== */

    // Past employees (offboarded, last working day gone) are excluded so they can be rehired
    // with the same PAN, UAN, email, mobile, Employee ID and work email.
    const allEmployees = await Employee.find(activeEmployeeFilter(corporateUser));

    const employeeIds = [];
    const emails = [];
    const mobiles = [];
    const workEmails = [];
    const pans = [];
    const uans = [];
    const employees = [];

    allEmployees.forEach((emp) => {
      if (emp?.panNumber) pans.push(String(emp.panNumber).toUpperCase());

      if (emp?.otherConfigurations?.epfUAN) uans.push(String(emp.otherConfigurations.epfUAN));

      if (emp?.employeeInformation?.employeeId)
        employeeIds.push(emp.employeeInformation.employeeId);

      if (emp?.personalInformation?.email)
        emails.push(emp.personalInformation.email);

      if (emp?.personalInformation?.mobileNo)
        mobiles.push(String(emp.personalInformation.mobileNo));

      if (emp?.employeeInformation?.workEmailId)
        workEmails.push(emp.employeeInformation.workEmailId.toLowerCase());

      if (emp?.personalInformation?.fullName) {
        employees.push({
          id: emp._id,
          name: emp.personalInformation.fullName,
        });
      }
    });

    const departmentDetails = await Department.find({ corporateUser });

    const departments = departmentDetails.map((d) => ({
      id: d._id,
      name: d.departmentName,
    }));

    /* ===============================
       Validation Loop
    =============================== */

    let fullyValidated = true;

    for (const item of jsonData) {
      item.corporateUser = corporateUser;
      item.validated = true;
      item.errors = [];
      const { error } = employeeSchema.validate(item, {
        abortEarly: false,
        errors: {
          wrap: {
            label: ''
          }
        }
      });

      /* Joi Errors */
      if (error) {
        item.validated = false;
        fullyValidated = false;

        error.details.forEach((err) => {
          item.errors.push(err.message);
        });
      }

      /* Duplicate Employee ID */
      if (employeeIds.includes(item.employeeId)) {
        item.validated = false;
        fullyValidated = false;
        item.errors.push("Employee ID must be unique");
      } else {
        employeeIds.push(item.employeeId);
      }

      /* Duplicate Email */
      if (emails.includes(item.email)) {
        item.validated = false;
        fullyValidated = false;
        item.errors.push("Email ID must be unique");
      } else {
        emails.push(item.email);
      }

      /* Duplicate Mobile */
      if (mobiles.includes(item.mobileNo)) {
        item.validated = false;
        fullyValidated = false;
        item.errors.push("Mobile Number must be unique");
      } else {
        mobiles.push(item.mobileNo);
      }

      /* Duplicate Work Email */
      const workEmail = (item?.workEmailId?.text || item?.workEmailId)?.toLowerCase()

      if (workEmail && workEmails.includes(workEmail)) {
        item.validated = false;
        fullyValidated = false;
        item.errors.push("Work Email must be unique");
      } else {
        workEmails.push(workEmail);
      }

      /* Duplicate PAN */
      const pan = item.pan ? String(item.pan).toUpperCase() : '';

      if (pan && pans.includes(pan)) {
        item.validated = false;
        fullyValidated = false;
        item.errors.push("PAN must be unique");
      } else if (pan) {
        pans.push(pan);
      }

      /* Duplicate UAN */
      const uan = item.uan ? String(item.uan) : '';

      if (uan && uans.includes(uan)) {
        item.validated = false;
        fullyValidated = false;
        item.errors.push("UAN must be unique");
      } else if (uan) {
        uans.push(uan);
      }

      /* Reporting Staff */
      if (item.reportingStaff) {
        const exists = employees.some(
          (e) => e.name === item.reportingStaff
        );

        if (!exists) {
          item.validated = false;
          fullyValidated = false;
          item.errors.push("Reporting staff does not exist");
        }
      }

      /* Age >= 18 */
      if (item.dateOfBirth) {
        const dob = new Date(item.dateOfBirth);
        const today = new Date();

        let age = today.getFullYear() - dob.getFullYear();

        if (age < 18) {
          item.validated = false;
          fullyValidated = false;
          item.errors.push("Employee must be at least 18 years old");
        }
      }
    }

    /* ===============================
       Sort Errors First
    =============================== */

    const errors = [];
    const validData = [];

    jsonData.forEach((item) => {
      if (item.errors.length > 0) errors.push(item);
      else validData.push(item);
    });

    req.body.jsonData = [...errors, ...validData];
    req.body.employees = employees;
    req.body.departments = departments;
    req.body.fullyValidated = fullyValidated;

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};



// excelController.js
const MAX_BULK_UPLOAD_ROWS = 5000;

const excelToJson = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        responseCode: '001',
        message: "No file provided",
        data: {},
      });
    }

    const dynamicHeaders = [...BASE_HEADERS, ...CTC_UPLOAD_HEADERS, ...BANK_UPLOAD_HEADERS];

    // Process the Excel file using the ExcelJS library
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    // Get the first worksheet
    const worksheet = workbook.getWorksheet(1);

    // Extract data from the first worksheet
    const jsonData = [];
    const headerRow = worksheet.getRow(1);
    const actualHeaders = headerRow.values.slice(1).map(h => (h || '').toString().trim());

    if (actualHeaders.length !== dynamicHeaders.length) {
      return res.status(400).json({
        status: false,
        responseCode: '001',
        message: 'Invalid Excel format: Please upload the correct template.',
        data: {}
      });
    }

    // Templates downloaded before Address Line 2 became mandatory still carry the old
    // un-starred header — accept it so those files aren't rejected (the value itself is
    // still enforced as required by validateExcelData).
    const LEGACY_HEADER_ALIASES = { 'Address Line 2*': ['Address Line 2'] };

    for (let i = 0; i < dynamicHeaders.length; i++) {
      const isLegacyAlias = (LEGACY_HEADER_ALIASES[dynamicHeaders[i]] || []).includes(actualHeaders[i]);
      if (actualHeaders[i] !== dynamicHeaders[i] && !isLegacyAlias) {
        return res.status(400).json({
          status: false,
          responseCode: '001',
          message: `Invalid Excel format. Please upload the correct template.`,
          data: {}
        });
      }
    }


    // Cap the number of employee rows per upload (excluding the header row)
    if ((worksheet.actualRowCount || 0) - 1 > MAX_BULK_UPLOAD_ROWS) {
      return res.status(400).json({
        status: false,
        responseCode: '001',
        message: `Maximum ${MAX_BULK_UPLOAD_ROWS} employees per upload`,
        data: {}
      });
    }

    // Iterate through the rows
    worksheet.eachRow((row, rowNum) => {
      // Skip the header row
      if (rowNum === 1) return;

      // No Country column (India-payroll-only template); column order matches BASE_HEADERS
      // above (Full Name, DOB, Gender, Mobile No, Personal Email, Address Line 1/2, State,
      // PIN Code, Emergency Contact Name/Number/Relation, then job/employment fields).
      const rowData = {
        fullName: row.getCell(1).value,
        dateOfBirth: row.getCell(2).value,
        gender: row.getCell(3).value,
        mobileNo: row.getCell(4).value != null ? String(row.getCell(4).value) : '',
        email: typeof row.getCell(5).value === 'object' && row.getCell(5)?.value?.text
          ? row.getCell(5)?.value?.text
          : row.getCell(5)?.value,

        addressLine1: row.getCell(6).value,
        addressLine2: row.getCell(7).value,
        state: row.getCell(8).value,
        pinCode: row.getCell(9).value != null
          ? String(row.getCell(9).value)
          : '',
        emergencyContactName: row.getCell(10).value,
        emergencyContactNumber: row.getCell(11).value != null ? String(row.getCell(11).value) : '',
        emergencyContactRelation: row.getCell(12).value,
        employeeId: row.getCell(13).value,
        dateOfJoin: row.getCell(14).value,
        designation: row.getCell(15).value,
        department: row.getCell(16).value,
        workEmailId: row.getCell(17).value,
        contractType: row.getCell(18).value !== null ? String(row.getCell(18).value).toUpperCase().replace(" ", "_") : '',
        reportingStaff: row.getCell(19).value,
        timeSchedule: row.getCell(20).value,
        // Unlike the other '' fallbacks on this page, an empty Probation Period cell is
        // parsed as null (not '') — probationPeriod is a Joi.number(), and an empty
        // string fails number coercion ("must be a number"), wrongly flagging a genuinely
        // optional field as invalid. null passes the schema's .allow(null) and matches the
        // entity's own default of 0 (models/entities/employee.js).
        probationPeriod: row.getCell(21).value != null
          ? String(row.getCell(21).value)
          : null,
        workingDays: row.getCell(22).value != null
          ? String(row.getCell(22).value)
          : '',
        pan: row.getCell(23).value != null ? String(row.getCell(23).value).trim().toUpperCase() : '',
        taxRegime: row.getCell(24).value != null ? String(row.getCell(24).value).trim() : '',
        uan: row.getCell(25).value != null ? String(row.getCell(25).value).trim() : '',
        esiNumber: row.getCell(26).value != null ? String(row.getCell(26).value).trim() : '',
        workState: row.getCell(27).value != null ? String(row.getCell(27).value).trim() : '',
        annualCTC: row.getCell(28).value != null && row.getCell(28).value !== ''
          ? Number(row.getCell(28).value)
          : null,
        accountHolderName: row.getCell(29).value != null ? String(row.getCell(29).value).trim() : '',
        accountNumber: row.getCell(30).value != null ? String(row.getCell(30).value).trim() : '',
        bankName: row.getCell(31).value != null ? String(row.getCell(31).value).trim() : '',
        ifscCode: row.getCell(32).value != null ? String(row.getCell(32).value).trim().toUpperCase() : '',
      };
      jsonData.push(rowData);
    });
    req.body.jsonData = jsonData;
    next();
  } catch (err) {
    console.log("errrr", err)
    next(err);
  }
}





let employeeKeys = ['corporateUser', 'fullName', 'dateOfBirth', 'gender', 'mobileNo', 'emergencyNo', 'email', 'emergencyContactName', 'emergencyContactRelation', 'nationality']

let employeeInformationKeys = ['dateOfJoin', 'employeeId', 'designation', 'department', 'contractType', 'reportingStaff', 'timeSchedule', 'workingDays', 'workingHours', 'employeeStatus', 'taxRegime', 'probationPeriod', 'workEmailId']

let salaryInformationKeys = ['basicPay', 'travelAllowances', 'homeAllowances', 'medicalAllowances', 'otherAllowances', 'other']

let bankInformationKeys = ['accountNumber', 'swiftCode', 'bankName', 'ibanNumber', 'beneficiaryName', 'routingCode']



module.exports = {
  validateExcelData,
  excelToJson,
  employeeKeys,
  employeeInformationKeys,
  salaryInformationKeys,
  bankInformationKeys,
  BASE_HEADERS,
  CTC_UPLOAD_HEADERS,
  BANK_UPLOAD_HEADERS,
  PERSONAL_INFO_HEADER_COUNT,
};