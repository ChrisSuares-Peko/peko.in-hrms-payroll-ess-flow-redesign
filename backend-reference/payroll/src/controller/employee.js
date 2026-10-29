const asyncHandler = require("../middleware/async");
const path = require('path');
// const fs = require('fs');
const ExcelJS = require('exceljs');
const { findOneCorporateEmployee, getCancelOffBoardingPreview, cancelOffBoarding, getOffBoardingStage: offBoardingStageOf, statusForProbation, withManagedEmploymentFields, getEmploymentStage, confirmProbation, extendProbation, DEFAULT_PROBATION_MONTHS, EMPLOYMENT_STAGE_LABELS, probationEndDate } = require("../models/use-cases/employee");
const ErrorResponse = require('../utils/error-response');
const { getEmployeesList, getAllEmployeesList, getEmployeeIds, getEmployeeCountByCorporateUser, getEmployeesBySearch } = require("../models/use-cases/employee");
const Employee = require("../models/entities/employee");
const BankDetails = require("../models/entities/bankDetails");
const CorporateUser = require("../models/entities/corporateUser");
const { createDepartment } = require("../models/use-cases/department");
const { findIncrementGiven } = require("../models/use-cases/increment");
const { formatTime } = require("../utils/dateUtils");
const { generateExcelBufferAndType } = require("../utils/documentToBuffer");
const { employeeInformationKeys, BASE_HEADERS, CTC_UPLOAD_HEADERS, BANK_UPLOAD_HEADERS, PERSONAL_INFO_HEADER_COUNT } = require("../services/employeeBulkUpload");
const { calculateTotalHours } = require("../services/calculateTotalHours");
const { calculateDays } = require("../services/calculateTotalDays")
const { calculateHourDifference } = require("../services/calculateHourDifferences")
const { sendWelcomeEmails } = require("../services/sendWelcomeEmails")
const { recalculateAndUpsertProgress } = require("../services/progressCalculator");
const { findEmployeeByIdAndCorporateUser, findEmployeesForExcel } = require("../models/use-cases/employee");
const { getEmployeeSalaryComponentListByEmail } = require("../models/use-cases/salaryComponent");
const { ESI_WAGE_CEILING, ESI_WAGE_CEILING_DIFFERENTLY_ABLED } = require("../models/use-cases/ctcCalculator");
const { uploadFileToS3 } = require("../utils/commonUploadFile");
const { findEmployeeforReportingStaff, updateEmployeeById, activeEmployeeFilter, findActiveIdentityConflict, getOffBoardingStage } = require("../models/use-cases/employee");
const { setEmployeeAsDeleted, updateEmployeeWorkSchedule, updateEmployeeSalaryInfo, getEmployeesForCorporate, updateEmployeeInformation, updateEmployeeWorkEmail, updateEmployeeBankDetails, updateEmployeeOffBoardingInfo, getAllEmployeesForCorporate } = require("../models/use-cases/employee");
const { getAllEmployees } = require("../models/use-cases/common");
const SalaryComponent = require("../models/entities/salaryComponent");
const DeductionComponent = require("../models/entities/deductionComponent");
const HrSettings = require("../models/entities/hrSettings");
const { getComplianceSettingsUsingCorporateId, ensureEpfEnabledWhenMandatory } = require("../models/use-cases/complianceSettings");
const { setEmployeeDeductionActiveByName } = require("../models/use-cases/deductionComponent");
const { solveCtcBreakdownForNewEmployee } = require("../models/use-cases/bulkEmployeeCtc");
const { reviseSalary } = require("../models/use-cases/reviseSalary");
const { escapeSearch } = require('../utils/escapeRegex');
const emailer = require("../utils/email/emailer");
const { customLog } = require("../utils/loggerHelper");
const { findOneHrSettings } = require("../models/use-cases/hrSettings");
const { fetchPartnerBranding } = require("../services/partnerDetailsResolver");
const { resolveDynamicEmail } = require("../services/emailTemplateResolver");
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require("../utils/email/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/email/sharedLayout");
const { employeeAddedToPayroll, employeeOffboarded } = require("../utils/email/emailTemplates/employeeChange");

const CORPORATE_EMPLOYEES_PATH = "/payroll/employees";
const FRONTEND_BASE_URL_FOR_EMPLOYEE_CHANGE = process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_URL
    : process.env.FRONTEND_STAGING_URL;

// Notify the corporate/HR admin about an employee joining or leaving their payroll.
// Best-effort: a mail failure must never fail the underlying operation.
async function emailCorporateEmployeeChange({ req, corporateUserId, employeeName, offboarded, logTraceId }) {
    try {
        const hrSettings = await findOneHrSettings(corporateUserId);
        const corporateUser = hrSettings?.corporateUser;
        if (!corporateUser || !corporateUser.email) return;

        const companyName = hrSettings?.companyProfile?.companyName || corporateUser?.companyName;
        const companyLogo = hrSettings?.companyProfile?.companyLogo || corporateUser?.logo;
        const companyWebsite = corporateUser?.website;

        const isPartner = !!req.user?.registeredBy;
        const partnerBranding = await fetchPartnerBranding(req);
        // A whitelabel reseller partner's CTA/logo must reflect their own portal; otherwise
        // fall back to the corporate's own custom logo/domain (e.g. "canarabank.pekoapp.com",
        // set in their own settings) before finally falling back to Peko's own URL — matching
        // how the leave-submission email (leaveApplication.js's resolveLeaveSubmissionEmail)
        // already resolves this same gap.
        const branding = isPartner && partnerBranding?.branding
            ? partnerBranding
            : { website: companyWebsite, logo: companyLogo, branding: companyName };
        const ctaBaseUrl = branding?.website || FRONTEND_BASE_URL_FOR_EMPLOYEE_CHANGE;
        const viewUrl = ctaBaseUrl ? `${ctaBaseUrl}${CORPORATE_EMPLOYEES_PATH}` : '';
        // TEMP DIAGNOSTIC — remove once the partner-branding issue is confirmed/fixed.
        customLog(logTraceId, 'info', { message: 'employee-change email: branding', isPartner, brandingName: branding?.branding, brandingWebsite: branding?.website, viewUrl });

        const templateFn = offboarded ? employeeOffboarded : employeeAddedToPayroll;
        const key = offboarded ? PAYROLL_EMAIL_TEMPLATE_KEYS.EMPLOYEE_OFFBOARDED : PAYROLL_EMAIL_TEMPLATE_KEYS.EMPLOYEE_ADDED_TO_PAYROLL;
        const employeeLabel = employeeName || (offboarded ? 'An employee' : 'A new employee');

        const resolved = await resolveDynamicEmail({
            req,
            key,
            variables: {
                adminName: companyName || 'Team',
                employeeName: employeeLabel,
                ctaUrl: viewUrl,
                ...v2LayoutVariables(branding),
            },
            fallbackSubject: offboarded ? `${employeeLabel} has been offboarded` : `${employeeLabel} has been added to payroll`,
            fallbackHtml: templateFn({ adminName: companyName, employeeName: employeeLabel, viewUrl }, branding),
            partnerId: req.user?.registeredBy || null,
        });
        const response = await emailer.email(corporateUser.email, resolved.subject, resolved.html);
        if (!response?.status) {
            customLog(logTraceId, "error", { message: "Failed to send employee-change email", error: response?.message });
        }
    } catch (error) {
        customLog(logTraceId, "error", { message: "Failed to send employee-change email", error: error?.message });
    }
}

// async function insertInBatches(documents, batchSize) {
//     for (let i = 0; i < documents.length; i += batchSize) {
//         const batch = documents.slice(i, i + batchSize);
//         await Employee.insertMany(batch);
//     }
// }

async function insertInBatches(documents, batchSize) {
    const insertedEmployees = [];

    for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);

        const result = await Employee.insertMany(batch, {
            ordered: true,
        });

        insertedEmployees.push(...result);
    }

    return insertedEmployees;
}

// A new employee's ESI coverage should default to whatever their actual gross salary
// implies, not the schema's blanket `enableESI: true` — otherwise every hire above the
// ₹21,000 ceiling (₹25,000 for a differently-abled employee) shows as covered by default
// until someone manually notices and toggles it off. Only ever used to seed the INITIAL
// default at creation time; an employee's own later explicit toggle is never touched by this.
const defaultEnableEsiForGross = (grossSalary, isDifferentlyAbled) => {
    const ceiling = isDifferentlyAbled ? ESI_WAGE_CEILING_DIFFERENTLY_ABLED : ESI_WAGE_CEILING;
    return (grossSalary || 0) <= ceiling;
};

exports.bulkCreate = asyncHandler(async (req, res) => {

    let { jsonData, employees, departments, fullyValidated } = req.body
    console.log(jsonData, "json dataaa")

    if (!fullyValidated) {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: 'Please correct all validation errors before proceeding',
            data: { jsonData },
        });
    }

    if (jsonData.length == 0) {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: 'There is no data to upload.',
            data: {},
        });
    }

    // eslint-disable-next-line no-unused-vars
    for (const [index, item] of jsonData.entries()) {

        if (item && item.reportingStaff) {
            const foundEmployee = employees.find(employee => employee.name == item.reportingStaff);
            if (foundEmployee) {
                item.reportingStaff = foundEmployee.id
            }
        }

        if (item && item.department) {
            const foundDepartment = departments.find(data => data.name == item.department);
            if (foundDepartment) {
                item.department = foundDepartment.id
            } else {
                let data = {
                    departmentName: item.department,
                    corporateUser: item.corporateUser
                }
                const result = await createDepartment(data)
                item.department = result._id
                let departmentData = {
                    id: result._id,
                    name: result.departmentName
                }
                departments.push(departmentData)
            }
        }

        // Convert gender and jobType to uppercase
        if (item && item.gender) {
            item.gender = item.gender.toUpperCase();
        }
        if (item && item.jobType) {
            item.jobType = item.jobType.toUpperCase();
        }
        if (item && item.status) {
            item.status = item.status.toUpperCase();
        }
    }

    let restructuredEmployees = [];

    for (const item of jsonData) {

        // 🔹 fetch salary components PER employee
        const params = {
            corporateUserID: item.corporateUser,
            employeeEmail: item.email,
            unassignedOnly: true
        };

        const salComponentAssigedToEmail =
            await getEmployeeSalaryComponentListByEmail(params);
        if (!salComponentAssigedToEmail) {
            return res.status(400).json({
                status: false,
                responseCode: '001',
                message: 'There is no salary component for this user.',
                data: {},
            });
        }
        const salaryComponents =
            salComponentAssigedToEmail.componentData.map(component => ({
                component: component._id,
                type: component.isGlobal ? "DEFAULT" : "CUSTOM"
            }));
        const employeeDoc = {
            corporateUser: item.corporateUser,
            personalInformation: {
                fullName: item.fullName,
                gender: item.gender,
                dateOfBirth: item.dateOfBirth,
                mobileNo: item.mobileNo,
                email: item.email,
                // Bulk upload is India-payroll-only (no Country column on the sheet).
                country: 'India',
                state: item.state || null,
                addressLine1: item.addressLine1 || null,
                addressLine2: item.addressLine2 || null,
                pinCode: item.pinCode,
                emergencyContactName: item.emergencyContactName || null,
                emergencyContactNo: item.emergencyContactNumber || null,
                emergencyContactRelation: item.emergencyContactRelation || null,
            },
            employeeInformation: {},
            salaryComponents,
            panNumber: item.pan || null,
            otherConfigurations: {
                epfUAN: item.uan || null,
                esiNumber: item.esiNumber || null,
                tdsRegime: item.taxRegime || undefined,
                // Labour Welfare Fund stays OFF by default for every newly added employee
                // (schema default — see models/entities/employee.js) — HR/Admin turns it on
                // manually per employee from Statutory Components. workState is still
                // recorded here (used by LWF's per-state schedule, see
                // utils/lwfStateSchedule.js) so it's already pre-filled once they do.
                lwf: item.workState ? { workState: item.workState } : undefined,
            },
        };

        employeeInformationKeys.forEach(key => {
            if (item[key] !== undefined && item[key] !== "") {
                employeeDoc.employeeInformation[key] = item[key];
            }
        });

        restructuredEmployees.push(employeeDoc);
    }

    const batchSize = 25;

    const createdEmployees = await insertInBatches(restructuredEmployees, batchSize);

    // This batch may take the establishment to 20 or more employees — switch EPF back on
    // (if it was off) BEFORE any row's CTC is solved below, so every row in the batch
    // includes PF.
    const bulkCorporateUser = req.user?._id || jsonData[0]?.corporateUser;
    if (bulkCorporateUser) await ensureEpfEnabledWhenMandatory(bulkCorporateUser);

    // Salary structure is derived from each row's Annual CTC using the same engine the
    // CTC Calculator uses (solveCtcBreakdownForNewEmployee) — the uploader no longer
    // types in per-component rupee amounts; Basic/HRA/Special Allowance/deductions are
    // all computed from the org's global rules the same way an Add Employee submission
    // would resolve them.
    const salaryComponentPayload = [];
    const deductionComponentPayload = [];
    const bankDetailsPayload = [];
    // Employees whose Annual CTC doesn't fit their configured fixed/percentage earnings
    // (solveCtcBreakdownForNewEmployee now rejects that, matching every other creation
    // path) — tracked by _id so the second loop below (Initial hire reviseSalary) can skip
    // them too, rather than redundantly re-running the identical failing solve. The
    // Employee document itself (already bulk-inserted above) is left as-is: creatable but
    // with no salary/deduction components, needing a manual Revise Salary — one bad row
    // shouldn't abort salary setup for the rest of the batch.
    const failures = [];
    const failedEmployeeIds = new Set();
    // Gross salary (needed to default ESI coverage) is only known AFTER solveCtcBreakdown
    // ForNewEmployee resolves it below, i.e. after employeeDoc has already been inserted
    // with the schema's blanket enableESI: true — collected here, applied in one bulkWrite
    // once every row's breakdown has resolved.
    const enableEsiUpdates = [];

    for (const [index, employeeDoc] of createdEmployees.entries()) {
        const item = jsonData[index];

        if (item.accountHolderName || item.accountNumber || item.bankName || item.ifscCode) {
            bankDetailsPayload.push({
                employeeId: employeeDoc._id,
                corporateUser: item.corporateUser,
                accountName: item.accountHolderName || null,
                accountNumber: item.accountNumber || null,
                bankName: item.bankName || null,
                ifscCode: item.ifscCode || null,
                isDefaultAccount: true,
            });
        }

        let breakdown;
        try {
            // eslint-disable-next-line no-await-in-loop
            breakdown = await solveCtcBreakdownForNewEmployee({
                corporateUserID: item.corporateUser,
                employeeId: employeeDoc._id,
                monthlyCTC: Number(item.annualCTC) / 12,
            });
        } catch (err) {
            failedEmployeeIds.add(employeeDoc._id.toString());
            failures.push({
                employeeId: item.employeeId,
                fullName: item.fullName,
                error: err.message,
            });
            // eslint-disable-next-line no-continue
            continue;
        }

        enableEsiUpdates.push({
            employeeId: employeeDoc._id,
            enableESI: defaultEnableEsiForGross(breakdown.grossSalary, item.isDiffrentlyAbled),
        });

        breakdown.earnings.forEach(earning => {
            if (!earning.globalComponentId) return;
            const isPercentage = earning.calculationType === 'PERCENTAGE';
            salaryComponentPayload.push({
                corporateUser: item.corporateUser,
                componentName: earning.componentName,
                calculationType: earning.calculationType,
                amountPercentage: isPercentage ? earning.amountPercentage : earning.calculatedAmount,
                calculationBasis: isPercentage ? earning.calculationBasis : undefined,
                globalComponentId: earning.globalComponentId,
                status: 'ACTIVE',
                isGlobal: false,
                employeeEmail: item.email,
                employee: employeeDoc._id,
            });
        });

        breakdown.deductions.forEach(deduction => {
            if (!deduction.globalComponentId) return;
            const isPercentage = deduction.calculationType === 'PERCENTAGE';
            deductionComponentPayload.push({
                corporateUser: item.corporateUser,
                deductionName: deduction.deductionName,
                calculationType: deduction.calculationType,
                amountPercentage: isPercentage ? deduction.amountPercentage : deduction.calculatedAmount,
                calculationBasis: deduction.calculationBasis,
                salaryDeductionType: deduction.salaryDeductionType,
                globalComponentId: deduction.globalComponentId,
                // Professional Tax is created INACTIVE by default (see bulkEmployeeCtc.js's
                // startsInactive) — an explicit employee-level override, not just the
                // otherConfigurations toggle, since mergeGlobalAndEmployeeComponents falls
                // back to the always-ACTIVE global row when no override exists at all.
                status: deduction.startsInactive ? 'INACTIVE' : 'ACTIVE',
                isGlobal: false,
                employee: employeeDoc._id,
            });
        });
    }

    const [, , createdBankDetails] = await Promise.all([
        salaryComponentPayload.length ? SalaryComponent.insertMany(salaryComponentPayload) : Promise.resolve(),
        deductionComponentPayload.length ? DeductionComponent.insertMany(deductionComponentPayload) : Promise.resolve(),
        bankDetailsPayload.length ? BankDetails.insertMany(bankDetailsPayload) : Promise.resolve([]),
    ]);

    if (enableEsiUpdates.length) {
        await Employee.bulkWrite(
            enableEsiUpdates.map(({ employeeId, enableESI }) => ({
                updateOne: {
                    filter: { _id: employeeId },
                    update: { $set: { 'otherConfigurations.enableESI': enableESI } },
                },
            }))
        );
    }

    // Records the entered Annual CTC as this employee's actually-COMMITTED figure (a
    // SalaryStructureVersion, effective from their join month) rather than leaving it to be
    // reconstructed from currently-resolved earnings on every later view — that
    // reconstruction is lossy for a percentage-only structure (Basic "% of Gross", HRA "%
    // of Basic") with no FIXED anchor, and compounds further each time it's viewed and
    // re-persisted. See getEmployeeCtcBreakdown's currentVersion anchor for the read side.
    for (const [index, employeeDoc] of createdEmployees.entries()) {
        // Already failed the identical solve above (same math, same inputs) — skip the
        // guaranteed-to-fail reviseSalary call rather than throwing again here.
        if (failedEmployeeIds.has(employeeDoc._id.toString())) continue;

        const item = jsonData[index];
        const joinDate = new Date(item.dateOfJoin);
        const effective = Number.isNaN(joinDate.getTime()) ? new Date() : joinDate;
        try {
            // eslint-disable-next-line no-await-in-loop
            await reviseSalary({
                corporateUserID: item.corporateUser,
                employeeId: employeeDoc._id,
                newAnnualCTC: Number(item.annualCTC),
                effectiveMonth: effective.getMonth() + 1,
                effectiveYear: effective.getFullYear(),
                reason: 'Initial hire',
                isInitialHire: true,
            });
        } catch (err) {
            // Defensive — the identical solve already succeeded above for this employee, so
            // this shouldn't normally fail, but a batch of employees is worth protecting
            // even against an unexpected failure here (e.g. a global component edited
            // concurrently mid-batch) rather than aborting everyone after this row.
            failedEmployeeIds.add(employeeDoc._id.toString());
            failures.push({ employeeId: item.employeeId, fullName: item.fullName, error: err.message });
        }
    }

    if (createdBankDetails && createdBankDetails.length) {
        await Employee.bulkWrite(
            createdBankDetails.map(bankDetail => ({
                updateOne: {
                    filter: { _id: bankDetail.employeeId },
                    update: { $set: { bankDetails: bankDetail._id } },
                },
            }))
        );
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: failures.length
            ? `${createdEmployees.length - failures.length} of ${createdEmployees.length} employees' salaries set up successfully — ${failures.length} need manual Revise Salary (CTC too low for their configured earnings).`
            : 'All documents saved successfully.',
        data: { restructuredEmployees, batchSize, failures },
        // data: {},
    });

})

// excel response
exports.sendResponse = asyncHandler(async (req, res) => {

    let { jsonData } = req.body
    if (jsonData) {
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Validation completed',
            data: { jsonData },
            CountOfDocs: jsonData.length
        });
    } else {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: 'Something went wrong.',
            data: {},
            CountOfDocs: 0
        });
    }

})

exports.offBoardEmployees = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const employeeId = req.params.employeeId;
    const body = req.body;
    let { offBoardingType } = body

    //change the status of the employee in employee profile
    let existing = await findOneCorporateEmployee({ employeeId, corporateUserID })
    if (!existing) throw new ErrorResponse('Employee not found', 404)
    const { employeeInformation } = existing
    if (employeeInformation.employeeStatus === 'RESIGNED' || employeeInformation.employeeStatus === 'SUSPENDED') {
        throw new ErrorResponse(`Employee already ${employeeInformation.employeeStatus.toLowerCase()}`, 404)
    }
    // Update off boarding information
    existing.offBoardingInformation = { ...body, previousEmployeeStatus: employeeInformation.employeeStatus };
    existing.employeeInformation.employeeStatus = offBoardingType == 'RESIGNATION' ? 'RESIGNED' : 'SUSPENDED'
    // Save the updated employee document
    let updated = await existing.save();

    await emailCorporateEmployeeChange({
        req,
        corporateUserId: corporateUserID,
        employeeName: updated.personalInformation?.fullName,
        offboarded: true,
        logTraceId: req?.LogTraceId,
    });

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Employee off-boarded successfully',
        data: updated
    });

})

// Why an offboarding can't be cancelled, for an employee findCancellableOffBoarding didn't return.
const cancelOffBoardingRefusal = async (employeeId, corporateUserID) => {
    const employee = await findOneCorporateEmployee({ employeeId, corporateUserID });
    if (!employee || employee.isEmployeeDeleted) return new ErrorResponse('Employee not found', 404);
    if (offBoardingStageOf(employee) === 'PAST') {
        return new ErrorResponse('The last working day has passed. Add the employee again as a rehire instead.', 400);
    }
    return new ErrorResponse('This employee has no offboarding to cancel.', 400);
};

exports.getCancelOffBoarding = asyncHandler(async (req, res, next) => {
    const preview = await getCancelOffBoardingPreview(req.params.employeeId, req.user._id);
    if (!preview) return next(await cancelOffBoardingRefusal(req.params.employeeId, req.user._id));

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Offboarding can be cancelled',
        data: preview
    });
})

exports.cancelOffBoarding = asyncHandler(async (req, res, next) => {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length > 200) return next(new ErrorResponse('Reason must be 200 characters or fewer', 400));

    const updated = await cancelOffBoarding({
        employeeId: req.params.employeeId,
        corporateUser: req.user._id,
        cancelledBy: req.user.subCorporateUsername || req.user.username || String(req.user._id),
        reason,
    });
    if (!updated) return next(await cancelOffBoardingRefusal(req.params.employeeId, req.user._id));

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: `Offboarding cancelled. ${updated.personalInformation?.fullName || 'The employee'} is active again.`,
        data: updated
    });
})

exports.confirmEmployeeProbation = asyncHandler(async (req, res, next) => {
    const result = await confirmProbation(req.params.id, req.user._id, req.user.subCorporateUsername || req.user.username || String(req.user._id));
    if (result.error) return next(new ErrorResponse(result.error, result.status));

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: `${result.employee.personalInformation?.fullName || 'The employee'} is confirmed.`,
        data: { ...result.employee.toJSON(), employmentStage: getEmploymentStage(result.employee) },
    });
})

exports.extendEmployeeProbation = asyncHandler(async (req, res, next) => {
    const months = Number(req.body?.months);
    if (!Number.isInteger(months) || months < 1 || months > 6) {
        return next(new ErrorResponse('Extend probation by 1 to 6 months', 400));
    }
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason) return next(new ErrorResponse('Enter a reason for extending the probation', 400));
    if (reason.length > 200) return next(new ErrorResponse('Reason must be 200 characters or fewer', 400));

    const result = await extendProbation(req.params.id, req.user._id, {
        months,
        reason,
        extendedBy: req.user.subCorporateUsername || req.user.username || String(req.user._id),
    });
    if (result.error) return next(new ErrorResponse(result.error, result.status));

    const employmentStage = getEmploymentStage(result.employee);
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: `Probation extended to ${new Date(employmentStage.probationEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
        data: { ...result.employee.toJSON(), employmentStage },
    });
})

exports.getBulkExcelTemplate = asyncHandler(async (req, res) => {

    const templatePath = path.join(__dirname, '../../public', 'BulkUploadEmployeeExcelTemplate.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    // Columns after BASE_HEADERS used to list the org's salary/deduction component names
    // for a per-row fixed-amount entry — replaced with a fixed CTC-input header set (PAN,
    // Tax Regime, UAN, ESI Number, Work State, Annual CTC), followed by the employee's
    // default bank account (Account Holder Name, Account Number, Bank Name, IFSC Code).
    // Salary structure is derived from Annual CTC using the same engine the CTC Calculator
    // uses (see bulkCreate); the bank columns create a default BankDetails row per employee.
    const dataSheet = workbook.getWorksheet(1);
    const baseHeaderCount = BASE_HEADERS.length;
    // Write the base headers from code too (not just the static file's row 1), so header
    // changes in BASE_HEADERS — e.g. 'Address Line 2*' becoming mandatory — show up in the
    // downloaded template and always match what excelToJson validates against.
    BASE_HEADERS.forEach((header, idx) => {
        dataSheet.getCell(1, idx + 1).value = header;
    });
    for (let c = baseHeaderCount + 1; c <= 100; c++) {
        dataSheet.getCell(1, c).value = null;
    }
    const fixedHeaders = [...CTC_UPLOAD_HEADERS, ...BANK_UPLOAD_HEADERS];
    fixedHeaders.forEach((header, idx) => {
        dataSheet.getCell(1, baseHeaderCount + 1 + idx).value = header;
    });

    // Header color-coding by field group, matching the prototype: blue = personal info,
    // green = job/employment info, orange = statutory (PAN/Tax Regime/UAN/ESI/Work State),
    // yellow = Annual CTC, grey = bank details.
    const HEADER_GROUP_COLORS = {
        personal: 'FFD9E8F5',
        job: 'FFDCE9D5',
        statutory: 'FFFCE4D6',
        ctc: 'FFFFF2CC',
        bank: 'FFE2E2E2',
    };
    const lastHeaderColumn = baseHeaderCount + fixedHeaders.length;
    const colorForColumn = (c) => {
        if (c <= PERSONAL_INFO_HEADER_COUNT) return HEADER_GROUP_COLORS.personal;
        if (c <= baseHeaderCount) return HEADER_GROUP_COLORS.job;
        if (c <= baseHeaderCount + CTC_UPLOAD_HEADERS.length - 1) return HEADER_GROUP_COLORS.statutory;
        if (c === baseHeaderCount + CTC_UPLOAD_HEADERS.length) return HEADER_GROUP_COLORS.ctc;
        return HEADER_GROUP_COLORS.bank;
    };

    // Setting `cell.font`/`cell.fill` directly mutates the shared style object other
    // cells (e.g. sample data rows) may point to by reference — reassigning the whole
    // `cell.style` forks a private copy for this cell instead.
    const headerRow = dataSheet.getRow(1);
    headerRow.height = 30;
    for (let c = 1; c <= lastHeaderColumn; c++) {
        const cell = headerRow.getCell(c);
        cell.style = {
            ...cell.style,
            font: { ...cell.font, bold: true, size: 11, name: 'Calibri' },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colorForColumn(c) } },
            alignment: { ...cell.alignment, vertical: 'middle' },
            border: { ...cell.border, bottom: { style: 'medium', color: { argb: 'FF8496B0' } } },
        };
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Excel buffer sent successfully.",
        data: { buffer },
    });

})

exports.getAllEmployees = asyncHandler(async (req, res) => {

    const searchText = req.query.searchText || "";
    const userId = req.user._id;
    let employees = await getAllEmployeesList(userId, searchText);
    const modifiedEmployees = employees.map(employee => ({
        fullName: employee.personalInformation.fullName,
        _id: employee._id
    }));
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employees fetched successfully",
        data: { employees: modifiedEmployees },
    });

})

exports.getEmployeeCount = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        const { count, lastEmployeeAddedDate } = await getEmployeeCountByCorporateUser(userId);
        console.log("count and last employee added date", count, lastEmployeeAddedDate)
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: "Employee count fetched successfully",
            data: { count, lastEmployeeAddedDate },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            responseCode: '001',
            message: "Error fetching employee count",
            error: error.message
        });
    }
});

exports.getBasicSalary = asyncHandler(async (req, res, next) => {

    const { employeeId } = req.params;
    const employeeDetails = await findEmployeeByIdAndCorporateUser(employeeId, req.user._id);
    const basicSalary = employeeDetails?.salaryInformation?.basicPay;

    if (!employeeDetails) {
        return next(new ErrorResponse('something went wrong while fetching employee details', 400))
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: "Basic salary fetched successfully",
        data: { basicSalary },
    })

})

exports.getEmployeesForCorporate = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchText = req.query.searchText || "";
    const status = req.query.status;
    const rawSortField = req.query.sortField || "createdAt";
    const normalizeSortField = (field) => {
        if (!field) return field;
        const parts = field.split(",").map((part) => part.trim()).filter(Boolean);
        return parts.length > 0 ? parts[parts.length - 1] : field;
    };
    const sortField = normalizeSortField(rawSortField);
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const employeesData = await getEmployeesForCorporate(corporateUserID, page, limit, searchText, status, sortField, sortOrder);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Retrieved employees matching the search criteria",
        data: employeesData
    });

})

exports.getExcel = asyncHandler(async (req, res, next) => {

    const corporateUser = req.user._id;

    const employeeStatus = req.query.employeeStatus ?? ''

    if (!employeeStatus || !['active', 'past'].includes(employeeStatus)) {
        return res.status(400).json({
            status: false,
            responseCode: '400',
            message: 'Invalid or missing employeeStatus',
            data: null,
        });
    }

    let employees = await findEmployeesForExcel(corporateUser, employeeStatus);

    const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : "N/A";
    const yesNo = (val) => val === true ? "Yes" : val === false ? "No" : "N/A";

    let excelData = [];
    employees.forEach(function (employee) {
        const pi = employee.personalInformation ?? {};
        const ei = employee.employeeInformation ?? {};
        // const oc = employee.otherConfigurations ?? {};
        const ob = employee.offBoardingInformation ?? {};
        const employmentStage = getEmploymentStage(employee);
        const probationEnd = probationEndDate(ei);

        excelData.push({
            // Employee Information
            "Employee ID": ei.employeeId ?? "N/A",
            "Designation": ei.designation ?? "N/A",
            "Department": ei.department?.departmentName ?? "N/A",
            "Date of Joining": formatDate(ei.dateOfJoin),
            "Work Email": ei.workEmailId ?? "N/A",
            "Contract Type": ei.contractType ?? "N/A",
            "Status": EMPLOYMENT_STAGE_LABELS[employmentStage.stage] ?? "N/A",
            "Probation (months)": Number(ei.probationPeriod) > 0 ? Number(ei.probationPeriod) : 0,
            "Probation Ends": probationEnd ? formatDate(probationEnd) : "N/A",
            // A hire with no probation is confirmed from their joining date.
            "Confirmed On": employmentStage.stage === 'CONFIRMED' && (employmentStage.confirmationDate || ei.dateOfJoin)
                ? formatDate(employmentStage.confirmationDate || ei.dateOfJoin)
                : "N/A",
            // "Working Days": ei.workingDays ?? "N/A",
            // "Working Hours": ei.workingHours ?? "N/A",
            // "Time Schedule": ei.timeSchedule ?? "N/A",
            "Tax Regime": ei.taxRegime ?? "N/A",

            // Personal Information
            "Full Name": pi.fullName ?? "N/A",
            "Gender": pi.gender ?? "N/A",
            "Date of Birth": formatDate(pi.dateOfBirth),
            "Personal Email": pi.email ?? "N/A",
            "Phone Number": pi.mobileNo ?? "N/A",
            "Country": pi.country ?? "N/A",
            "State": pi.state ?? "N/A",
            "Address Line 1": pi.addressLine1 ?? "N/A",
            "Address Line 2": pi.addressLine2 ?? "N/A",
            "PIN Code": pi.pinCode ?? "N/A",
            "Differently Abled": yesNo(pi.isDiffrentlyAbled),
            "Emergency Contact Name": pi.emergencyContactName ?? "N/A",
            "Emergency Contact Number": pi.emergencyContactNo ?? "N/A",
            "Emergency Contact Relation": pi.emergencyContactRelation ?? "N/A",
            "Passport Number": pi.passportNo ?? "N/A",
            "Passport Issued Country": pi.passportIssuedCountry ?? "N/A",
            "Passport Issued Date": formatDate(pi.passportIssuedDate),
            "Passport Expiry Date": formatDate(pi.passportExpiryDate),

            // Statutory
            "PAN Number": employee.panNumber ?? "N/A",
            "Aadhaar Number": employee.aadhaarNumber ?? "N/A",

            // Payroll Configurations
            // "EPF Enabled": yesNo(oc.enableEPF),
            // "ESI Enabled": yesNo(oc.enableESI),
            // "Professional Tax": yesNo(oc.professionalTax),
            // "Labor Welfare Fund": yesNo(oc.laborWelfareFund),
            // "TDS Enabled": yesNo(oc.tds),
            // "TDS Regime": oc.tdsRegime ?? "N/A",

            // Off-boarding (relevant for past employees)
            "Off-boarding Date": formatDate(ob.offBoardingDate),
            "Last Working Day": formatDate(ob.lastWorkingDay),
            "Notice Period (days)": ob.noticePeriod ?? "N/A",
            "Off-boarding Type": ob.offBoardingType ?? "N/A",
            // "Reason for Off-boarding": ob.reasonForOffBoarding ?? "N/A",
        });
    });

    generateExcelBufferAndType(excelData)
        .then(({ buffer, fileType }) => {
            // Now 'buffer' contains the Excel file in buffer form
            console.log('Excel buffer generated successfully.');
            console.log('File type:', fileType);
            return res.status(200).json({
                status: true,
                responseCode: '000',
                message: "Employees Details got successfully",
                data: { buffer, fileType },
            });
        })
        .catch(error => {
            console.error('Error generating Excel buffer and type:', error);
            next(error);
        });

})

exports.getCurrentEmployee = asyncHandler(async (req, res) => {


    const searchText = req.query.searchText || "";
    const userId = req.user._id;
    const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    let employees = await getEmployeesList(userId, searchText, month, year);
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employees fetched successfully",
        data: { employees },
    });

})

exports.getEmployee = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    let employees = await getEmployeeIds(userId);
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "EmployeeId's fetched successfully",
        data: { employees },
    });

})

exports.getEmployeeById = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id
    const employeeId = req.params.id

    const employee = await findEmployeeByIdAndCorporateUser(employeeId, corporateUserID);
    if (!employee) {
        return next(new ErrorResponse('Employee not found', 404))
    }
    employee.passportNo = employee.passportNo ?? null;
    employee.passportIssuedCountry = employee.passportIssuedCountry ?? null;
    employee.passportIssuedDate = employee.passportIssuedDate ?? null;
    employee.passportExpiryDate = employee.passportExpiryDate ?? null;
    const { _id, ...employeeWithoutId } = employee
    const employeeWithId = { id: _id, ...employeeWithoutId, offBoardingStage: getOffBoardingStage(employee), employmentStage: getEmploymentStage(employee) };
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Retrieved Employee",
        data: employeeWithId,
    });

})

exports.getReportingStaff = asyncHandler(async (req, res) => {

    const employeeId = req.params.id;
    const corporateUserId = req.user._id;

    const employee = await findEmployeeforReportingStaff(employeeId, corporateUserId);
    if (!employee) {
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: "no employees found",
            data: { fullName: 'N/A' },
        });
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Retrieved Employee",
        data: employee,
    });

})

exports.createEmployee = asyncHandler(async (req, res) => {

    let {
        profileImage,
        personalInformation,
        employeeInformation,
        // salaryComponents,
    } = req.body;
    let { email, mobileNo } = personalInformation;
    let { workEmailId } = employeeInformation;
    let corporateUser = req.user._id
    let logo = req.user.logo

    let { employeeId } = employeeInformation;
    if (employeeId) {
        // Check if another employee within the same corporateUser has the same employeeId
        const isDuplicateEmployeeId = await Employee.findOne({
            ...activeEmployeeFilter(corporateUser),
            "employeeInformation.employeeId": employeeId,
        });
        if (isDuplicateEmployeeId) {
            return res.status(400).json({
                status: false,
                data: {},
                message: "Employee ID already exists for another employee",
                responseCode: '001'
            });
        }
    }

    employeeInformation.department =
        typeof employeeInformation.department === 'string'
            ? employeeInformation.department.trim() || null
            : null;
    if (employeeInformation.reportingStaff?.trim() === "") {
        employeeInformation.reportingStaff = null;
    }
    if (workEmailId) {
        const existingWorkEmailEmployee = await Employee.findOne({
            ...activeEmployeeFilter(corporateUser),
            "employeeInformation.workEmailId": workEmailId,
        });

        if (existingWorkEmailEmployee) {
            return res.status(400).json({
                status: false,
                data: {},
                message: "Work Email ID already exists for another employee",
                responseCode: '001'
            });
        }
    }


    if (email && mobileNo) {
        // Check if another employee within the same corporateUser has the same email.
        const existingEmailEmployee = await Employee.findOne({
            ...activeEmployeeFilter(corporateUser),
            "personalInformation.email": email,
        });

        // Check if another employee within the same corporateUser has the same mobile number.
        const existingMobileEmployee = await Employee.findOne({
            ...activeEmployeeFilter(corporateUser),
            "personalInformation.mobileNo": mobileNo,
        });

        if (existingEmailEmployee) {

            return res.status(400).json({
                status: false,
                data: {},
                message: "Personal Email ID already exists for another employee",
                responseCode: '001'
            });
        }

        if (existingMobileEmployee) {
            console.log(existingMobileEmployee)
            return res.status(400).json({
                status: false,
                data: {},
                message: "Mobile number already exists for another employee",
                responseCode: '001'
            });
        }
    }

    // get salarycomponent assigned to particular email
    const params = {
        corporateUserID: corporateUser,
        employeeEmail: email,
        unassignedOnly: true
    };
    const salComponentAssigedToEmail = await getEmployeeSalaryComponentListByEmail(params)

    // Loop through componentData and push formatted objects
    const salaryComponents = salComponentAssigedToEmail.componentData.map(component => ({
        component: component._id.toString(), // convert ObjectId to string
        type: component.isGlobal ? "DEFAULT" : "CUSTOM"
    }))

    // Default 3 months; HR picks "No probation" (0) for a confirmed hire.
    const rawProbation = employeeInformation.probationPeriod;
    const probationPeriod = rawProbation === undefined || rawProbation === null || rawProbation === ''
        ? DEFAULT_PROBATION_MONTHS
        : Number(rawProbation) || 0;
    employeeInformation = {
        ...employeeInformation,
        probationPeriod,
        employeeStatus: statusForProbation(probationPeriod),
    };

    const newEmployee = new Employee({
        corporateUser,
        profileImage,
        personalInformation,
        employeeInformation,
        salaryComponents,
        otherConfigurations: {
            enableESI: defaultEnableEsiForGross(
                salComponentAssigedToEmail.grossSalary,
                personalInformation?.isDiffrentlyAbled
            ),
        },
    });
    const savedEmployee = await newEmployee.save();
    const newEmployeeId = savedEmployee._id;
    await SalaryComponent.updateMany(
        { corporateUser, employeeEmail: email, employee: null },
        { $set: { employee: newEmployeeId } } // Assuming SalaryComponent has an `employee` field
    );

    sendWelcomeEmails(req, savedEmployee, corporateUser, logo, req.user.companyName)

    await emailCorporateEmployeeChange({
        req,
        corporateUserId: corporateUser,
        employeeName: savedEmployee.personalInformation?.fullName,
        offboarded: false,
        logTraceId: req?.LogTraceId,
    });

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: "Employee created successfully",
        data: savedEmployee,
    });

})

exports.updateAllEmployeeInfo = asyncHandler(async (req, res, next) => {

    const {
        fullName,
        profileImage,
        dateOfBirth,
        gender,
        mobileNo,
        emergencyNo,
        personalEmail,
        emergencyContactName,
        emergencyContactRelation,
        nationality,
        employeeInformation,
        salaryInformation,
        employeeDocuments,
        bankDetails,
    } = req.body;
    const { id } = req.params;
    let { employeeId, dateOfJoin } = employeeInformation;
    if (employeeId) {
        //use this by default it employeeId will null on employee creation and we can't set unique
        // Check if another employee within the same corporateUser has the same employeeId
        const isDuplicateEmployeeId = await Employee.findOne({
            _id: { $ne: id }, // Excluding the current employee being updated
            ...activeEmployeeFilter(req.user._id),
            "employeeInformation.employeeId": employeeId,
        });
        if (isDuplicateEmployeeId) {
            return next(new ErrorResponse('Employee ID already exists for another employee within the same corporate', 400))
        }
        if (!employeeInformation.department) {
            return next(new ErrorResponse("Department is mandatory"))
        }
    }

    // Check if another employee within the same corporateUser has the same email or mobile no.
    if (personalEmail && mobileNo) {
        const conflict = await findActiveIdentityConflict(req.user._id, {
            'personalInformation.email': personalEmail,
            'personalInformation.mobileNo': mobileNo,
        }, id);
        if (conflict) {
            return next(new ErrorResponse('Email or Mobile no. already exists for another employee', 400))
        }
    }

    if (dateOfJoin) {
        const existing = await Employee.findOne({ _id: id, corporateUser: req.user._id });
        if (!existing) {
            return next(new ErrorResponse('Employee not found', 404))
        }
        const existingDateOfJoin = existing.employeeInformation.dateOfJoin;
        console.log(existingDateOfJoin && existingDateOfJoin.toISOString(), new Date(dateOfJoin).toISOString())
        if (existingDateOfJoin && existingDateOfJoin.toISOString() !== new Date(dateOfJoin).toISOString()) {
            return next(new ErrorResponse("The employee's date of joining cannot be changed", 400))
        }
    }

    let managedEmployeeInformation = employeeInformation;
    if (employeeInformation) {
        const current = await Employee.findOne({ _id: id, corporateUser: req.user._id }, 'employeeInformation').lean();
        managedEmployeeInformation = withManagedEmploymentFields(employeeInformation, current?.employeeInformation);
    }

    const updateFields = {
        fullName,
        profileImage,
        dateOfBirth,
        gender,
        mobileNo,
        emergencyNo,
        personalEmail,
        emergencyContactName,
        emergencyContactRelation,
        nationality,
        employeeInformation: managedEmployeeInformation,
        salaryInformation,
        employeeDocuments,
        bankDetails,
    };

    const updatedEmployee = await updateEmployeeById(id, req.user._id, updateFields);

    if (!updatedEmployee) {
        return next(new ErrorResponse('Employee not found', 404))
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employee details updated successfully",
        data: updatedEmployee,
    });

})

exports.deleteEmployeeById = asyncHandler(async (req, res, next) => {

    const employeeId = req.params.id;
    const corporateUserId = req.user._id;

    const deletedEmployee = await setEmployeeAsDeleted(employeeId, corporateUserId);
    if (!deletedEmployee) {
        return next(new ErrorResponse('Employee not found', 404))
    }

    await emailCorporateEmployeeChange({
        req,
        corporateUserId,
        employeeName: deletedEmployee.personalInformation?.fullName,
        offboarded: true,
        logTraceId: req?.LogTraceId,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employee deleted successfully",
        data: {},
    });

})

exports.updateEmployeeWorkSchedule = asyncHandler(async (req, res, next) => {

    const employeeId = req.params.id;
    const corporateUser = req.user._id;
    const isDeleted = false;
    const workScheduleData = req.body;

    const updatedEmployee = await updateEmployeeWorkSchedule(employeeId, corporateUser, isDeleted, workScheduleData);

    if (!updatedEmployee) {
        return next(new ErrorResponse('Employee not found', 404))
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employee work schedule updated successfully",
        data: updatedEmployee,
    });

})

exports.getEmployeeWorkSchedule = asyncHandler(async (req, res) => {

    const corporateUser = req.user._id;
    let employees = await getAllEmployees(corporateUser)
    console.log({ employees });
    let workSchedules = [];
    employees.forEach(function (employee) {
        workSchedules.push({
            ID: employee.employeeInformation.employeeId ?? "N/A",
            "Full name": employee.fullName ?? "N/A",
            Role: employee.employeeInformation?.designation ?? "N/A",
            "Start time": formatTime(employee.workSchedule?.startTime) ?? "N/A",
            "End endTime": formatTime(employee.workSchedule?.endTime) ?? "N/A",
            "Break Hours": employee.workSchedule?.breakTimeHrs ?? "N/A",
            "Total Hours": calculateTotalHours(employee?.workSchedule) ?? "N/A",
            Days: calculateDays(employee.workSchedule) ?? "N/A",
        });
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employee work schedule get successfully",
        data: { workSchedules },
    });

})

exports.createNewEmployee = asyncHandler(async (req, res) => {

    const { fullName, profileImage, dateOfBirth, gender, mobileNo, emergencyNo, personalEmail, emergencyContactName, emergencyContactRelation, nationality } = req.body;

    const newEmployee = new Employee({
        corporateUser: req.user._id,
        fullName,
        profileImage,
        dateOfBirth,
        gender,
        mobileNo,
        emergencyNo,
        personalEmail,
        emergencyContactName,
        emergencyContactRelation,
        nationality

    });

    const savedEmployee = await newEmployee.save();

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employee added successfully",
        data: savedEmployee,
    });

})

exports.updateEmployee = asyncHandler(async (req, res, next) => {

    // const { fullName, profileImage, dateOfBirth, gender, mobileNo, emergencyNo, personalEmail, emergencyContactName, emergencyContactRelation, country, qualification, experienceInYear, experienceInMonth, maritialStatus,email,state } = req.body;
    const {
        profileImage,
        personalInformation,
        employeeInformation,
        // dateOfJoin,
        // employeeId,
        // department,
        // designation,
        // reportingStaff,
        // workEmailId,
        // workingDays,
        // timeSchedule,
        // workingHours,
        // contractType,
        // employeeStatus,
        // probationPeriod,
    } = req.body;

    const updateFields = {};

    if (profileImage !== undefined) {
        updateFields.profileImage = profileImage;
    }

    if (personalInformation !== undefined) {
        updateFields.personalInformation = personalInformation;
    }

    const { id } = req.params;

    // If the personal email changes while an offer letter is already PENDING
    // (sent, not yet signed) for a NEW_HIRE, the old e-sign request/link was
    // sent to the stale address — flag it instead of leaving a valid-looking
    // PENDING offer letter pointed at the wrong inbox.
    if (personalInformation?.email) {
        const existing = await Employee.findOne(
            { _id: id, corporateUser: req.user._id },
            "personalInformation.email offerLetter.status employeeInformation.employeeStatus"
        );
        if (
            existing?.employeeInformation?.employeeStatus === "NEW_HIRE" &&
            existing?.personalInformation?.email &&
            existing.personalInformation.email !== personalInformation.email &&
            existing?.offerLetter?.status === "PENDING"
        ) {
            updateFields["offerLetter.status"] = "EMAIL_CHANGED";
            updateFields["offerLetter.eSignId"] = null;
        }
    }

    if (employeeInformation) {
        // department is an ObjectId ref — accept a plain id string, or unwrap a populated
        // {id/_id, departmentName} object (e.g. an edit form echoing back what it fetched)
        // instead of letting the wrong shape reach Mongoose as a CastError.
        if (employeeInformation.department && typeof employeeInformation.department === 'object') {
            employeeInformation.department =
                employeeInformation.department.id || employeeInformation.department._id || undefined;
        }
        if (!employeeInformation.department) {
            delete employeeInformation.department;
        }

        if (!employeeInformation.reportingStaff) {
            delete employeeInformation.reportingStaff;
        }

        const current = await Employee.findOne({ _id: id, corporateUser: req.user._id }, 'employeeInformation').lean();
        updateFields.employeeInformation = withManagedEmploymentFields(employeeInformation, current?.employeeInformation);
    }

    const updatedEmployee = await updateEmployeeById(id, req.user._id, updateFields);

    if (!updatedEmployee) {
        return next(new ErrorResponse('Employee not found', 404))
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employee details updated successfully",
        data: updatedEmployee,
    });

})

exports.updateExistEmployee = asyncHandler(async (req, res, next) => {

    const { offBoardingDate, lastWorkingDay, noticePeriod, offBoardingType, reasonForOffBoarding } = req.body;
    const { id } = req.params;

    const updatedEmployee = await updateEmployeeOffBoardingInfo(id, req.user._id, {
        offBoardingDate,
        lastWorkingDay,
        noticePeriod,
        offBoardingType,
        reasonForOffBoarding
    });


    if (!updatedEmployee) {
        return next(new ErrorResponse('Employee not found', 404))
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employee exit-informations updated successfully",
        data: updatedEmployee,
    });

})

exports.updateEmployeeInformation = asyncHandler(async (req, res, next) => {

    const { id } = req.params; // Assuming you receive the employee ID as a parameter
    let workingHours
    const { dateOfJoin, designation, employeeId, department, workLocation, status, reportingStaff, workingDays, schedule, jobType, probation, taxRegime } = req.body;
    // const JobType = jobType.toUpperCase();
    if (schedule) {
        workingHours = await calculateHourDifference(schedule)
    }

    //use this by default it employeeId will null on employee creation and we can't set unique
    // Check if another employee within the same corporateUser has the same employeeId
    const isDuplicateEmployeeId = await Employee.findOne({
        _id: { $ne: id }, // Excluding the current employee being updated
        ...activeEmployeeFilter(req.user._id),
        "employeeInformation.employeeId": employeeId,
    });
    if (isDuplicateEmployeeId) {
        return next(new ErrorResponse("Employee ID already exists for another employee within the same corporate", 400))
    }
    const updatedEmployee = await updateEmployeeInformation(id, req.user._id, {
        dateOfJoin,
        employeeId,
        designation,
        department,
        workLocation,
        status,
        reportingStaff,
        workingDays,
        schedule,
        jobType,
        probation,
        workingHours,
        taxRegime
    });
    if (!updatedEmployee) {
        return next(new ErrorResponse('Employee not found', 404))
    }
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employee information updated successfully",
        data: updatedEmployee,
    });

})

exports.updateEmployeeWorkEmail = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const corporateUser = req.user._id;
    const { workEmailId } = req.body;

    if (!workEmailId) {
        return next(new ErrorResponse("Work email is required", 400));
    }

    const existingWorkEmailEmployee = await Employee.findOne({
        _id: { $ne: id },
        ...activeEmployeeFilter(corporateUser),
        "employeeInformation.workEmailId": workEmailId,
    });
    if (existingWorkEmailEmployee) {
        return next(new ErrorResponse("Work Email ID already exists for another employee", 400));
    }

    const updatedEmployee = await updateEmployeeWorkEmail(id, corporateUser, workEmailId);
    if (!updatedEmployee) {
        return next(new ErrorResponse('Employee not found', 404))
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Work email updated successfully",
        data: updatedEmployee,
    });
})

exports.updateSalaryInformation = asyncHandler(async (req, res, next) => {

    const { id } = req.params;
    const corporateUserID = req.user._id;
    const employeeId = req.params.id;
    const { basicPay, travelAllowances, homeAllowances, medicalAllowances, otherAllowances, other } = req.body;

    // need to avoid updating basic pay after adding increments to that employee , because it affect salary calculation
    const existingDetails = await Employee.findOne({ _id: id, corporateUser: req.user._id })
    console.log({ existingDetails, basicPay })
    if (!existingDetails || existingDetails?.salaryInformation?.basicPay !== parseFloat(basicPay)) {
        const { status } = await findIncrementGiven({ employeeId, corporateUserID })
        if (!status) {
            return next(new ErrorResponse('Basic salary cannot update, an increment is already given', 404))
        }
    }

    const updatedEmployee = await updateEmployeeSalaryInfo(id, corporateUserID, {
        basicPay,
        travelAllowances,
        homeAllowances,
        medicalAllowances,
        otherAllowances,
        other
    });

    if (!updatedEmployee) {
        return next(new ErrorResponse('Employee not found', 404))
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Salary information updated successfully",
        data: updatedEmployee,
    });

})

exports.validateInformation = asyncHandler(async (req, res) => {

    const corporateUser = req.user._id;
    const { email, mobileNo, employeeId, workEmailId } = req.body;
    let existingField;

    if (email) {

        existingField = await Employee.findOne({ ...activeEmployeeFilter(corporateUser), "personalInformation.email": email });
        if (existingField) {
            return res.status(400).json({
                status: false,
                data: {},
                message: "Email already exists for another employee",
                responseCode: '001'
            });
        }
    }

    // Check if mobile number already exists
    if (mobileNo) {
        existingField = await Employee.findOne({ ...activeEmployeeFilter(corporateUser), "personalInformation.mobileNo": mobileNo });
        if (existingField) {
            return res.status(400).json({
                status: false,
                data: {},
                message: "Mobile number already exists for another employee",
                responseCode: '001'
            });
        }
    }

    // Check if employee ID already exists
    if (employeeId) {
        existingField = await Employee.findOne({
            ...activeEmployeeFilter(corporateUser),
            "employeeInformation.employeeId": employeeId,
        });
        if (existingField) {
            return res.status(400).json({
                status: false,
                data: {},
                message: "Employee ID already exists for another employee",
                responseCode: '001'
            });
        }
    }
    // A DOJ in a month whose payroll is already approved/paid is allowed — the employee is
    // simply back-filled as PENDING into that month once its Salary docs are next
    // regenerated (processEmpSalary already skips PAID/APPROVED employees, so this never
    // re-touches anyone already paid), and gets approved separately via the month's
    // "Run Payroll" review screen. See empApproveSalary/getSalaryInfo for the matching
    // mixed-status handling.
    // Check if personal email and work email are the same
    if (workEmailId && email === workEmailId) {
        return res.status(400).json({
            status: false,
            data: {},
            message: "Personal email ID and work email ID cannot be the same",
            responseCode: '001'
        });
    }


    // If none of the above conditions match, the data is valid
    return res.status(200).json({
        status: true,
        data: {},
        message: "Provided credentials are unique",
        responseCode: '000'
    });

})

exports.updateBankDetails = asyncHandler(async (req, res, next) => {

    const { id } = req.params; // Assuming you receive the employee ID as a parameter
    const { accountName, accountNumber, swiftCode, bankName, bankBranch, ibanNumber, accountType, beneficiaryName, routingCode } = req.body;
    const corporateUserId = req.user._id;

    const updatedEmployee = await updateEmployeeBankDetails(id, corporateUserId, {
        accountName,
        accountNumber,
        swiftCode,
        bankName,
        bankBranch,
        ibanNumber,
        accountType,
        beneficiaryName,
        routingCode
    });

    if (!updatedEmployee) {
        return next(new ErrorResponse('Employee not found', 404))
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Bank details updated successfully",
        data: updatedEmployee,
    });

})

exports.updateMultipleDocuments = asyncHandler(async (req, res, next) => {

    const { id } = req.params; // Employee ID
    const newDocuments = req.body; // Array of documents to be added or updated

    const employee = await Employee.findOne({
        _id: id,
        corporateUser: req.user._id,
        isEmployeeDeleted: false
    });

    if (!employee) {
        return next(new ErrorResponse('Employee not found', 404))
    }

    for (const newDoc of newDocuments) {
        const existingDocIndex = employee.employeeDocuments.findIndex((doc) => doc.name === newDoc.name);

        if (existingDocIndex !== -1) {
            // Update the existing document
            employee.employeeDocuments[existingDocIndex] = newDoc;
        } else {
            // Add the new document to the array
            employee.employeeDocuments.push(newDoc);
        }
    }

    const updatedEmployee = await employee.save();

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Documents added/updated in employee",
        data: updatedEmployee,
    });

})
//new payroll implementations

//++++++++++++++++++++++++++++++++++++++++++++++++++++++
exports.getAllEmployeesForCorporate = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchText = req.query.searchText || "";
    const status = req.query.status;
    const rawSortField = req.query.sortField || "createdAt";
    const normalizeSortField = (field) => {
        if (!field) return field;
        const parts = field.split(",").map((part) => part.trim()).filter(Boolean);
        return parts.length > 0 ? parts[parts.length - 1] : field;
    };
    const sortField = normalizeSortField(rawSortField);
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const type = req.query?.type || '';
    if (type !== 'setting') {
        await CorporateUser.findOneAndUpdate(
            { _id: corporateUserID, onboardStatus: { $lt: 4 } },
            { $set: { onboardStatus: 4 } },
            { new: true }
        );
        recalculateAndUpsertProgress(corporateUserID).catch(err =>
            console.error('[Progress] Failed to update progress:', err.message)
        );
    }
    const employeesData = await getAllEmployeesForCorporate(corporateUserID, page, limit, searchText, status, sortField, sortOrder, req.query.stage);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Retrieved employees matching the search criteria",
        data: employeesData
    });

})

exports.createPersonalInfo = asyncHandler(async (req, res) => {
    // Destructure personalInformation and profileImage from req.body
    const { personalInformation, profileImage } = req.body;

    // Destructure fields from personalInformation object
    const {
        fullName,
        gender,
        dateOfBirth,
        mobileNo,
        email,
        country,
        state,
        addressLine1,
        addressLine2,
        pinCode,
        emergencyContactName,
        emergencyContactNo,
        emergencyContactRelation,
        isDiffrentlyAbled,
    } = personalInformation;

    const corporateUser = req.user._id;

    try {
        // Get the employeeId from query parameters
        const employeeId = req.query.employeeId;

        let existingEmployee;
        // If employeeId is provided, check if the employee exists
        if (employeeId) {
            existingEmployee = await Employee.findOne({ _id: employeeId, corporateUser, isEmployeeDeleted: false });

            if (!existingEmployee) {
                return res.status(404).json({
                    status: false,
                    message: "Employee not found",
                    responseCode: "404",
                });
            }
        }

        // Check for duplicate email or mobile number excluding the current employee in the update case
        const duplicateConditions = {
            ...activeEmployeeFilter(corporateUser),
            $or: [{ "personalInformation.email": email }, { "personalInformation.mobileNo": mobileNo }],
        };

        // If updating, exclude the current employee's record from the duplicate check
        if (existingEmployee) {
            duplicateConditions._id = { $ne: existingEmployee._id };
        }

        const duplicateEmployee = await Employee.findOne(duplicateConditions);

        if (duplicateEmployee) {
            return res.status(400).json({
                status: false,
                message: "Email or Mobile number already exists for another employee",
                responseCode: "001",
            });
        }

        let savedEmployee;
        // If the employee exists, update their personal information and profile image
        if (existingEmployee) {
            existingEmployee.personalInformation = {
                fullName,
                gender,
                dateOfBirth,
                mobileNo,
                email,
                country,
                state,
                addressLine1,
                addressLine2,
                pinCode,
                emergencyContactName,
                emergencyContactNo,
                emergencyContactRelation,
                isDiffrentlyAbled,
            };

            // Update profile image if provided
            if (profileImage) {
                existingEmployee.profileImage = profileImage;
            }

            savedEmployee = await existingEmployee.save();

            return res.status(200).json({
                status: true,
                responseCode: "000",
                message: "Employee personal information and profile image updated successfully",
                data: savedEmployee,
            });
        }

        // If no employeeId is provided or the employee doesn't exist, create a new employee
        const newEmployee = new Employee({
            corporateUser,
            personalInformation: {
                fullName,
                gender,
                dateOfBirth,
                mobileNo,
                email,
                country,
                state,
                addressLine1,
                addressLine2,
                pinCode,
                emergencyContactName,
                emergencyContactNo,
                emergencyContactRelation,
                isDiffrentlyAbled,
            },
            profileImage: profileImage || null, // Set profileImage if provided, else null
            employeeInformation: {
                status: 'ACTIVE', // Default value for status when creating a new employee
            },
        });

        savedEmployee = await newEmployee.save();

        return res.status(201).json({
            status: true,
            responseCode: "000",
            message: "Employee created successfully",
            data: savedEmployee,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Something went wrong",
            responseCode: "500",
        });
    }
});

// Trimmed pre-boarding creation — rest of the profile is filled in later via the section-wise endpoints.
// Defaults the new hire's work timing from HR settings when none was provided.
async function resolveTimeSchedule(corporateUser, timeSchedule) {
    if (timeSchedule) return timeSchedule;
    const hr = await HrSettings.findOne({ corporateUser }).select("defaultWorkSchedule").lean();
    const checkInTime = hr?.defaultWorkSchedule?.checkInTime || "09:00";
    const checkOutTime = hr?.defaultWorkSchedule?.checkOutTime || "18:00";
    return `${checkInTime} - ${checkOutTime}`;
}

exports.createNewHireEmployee = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id;
    const { personalInformation = {}, employeeInformation = {}, profileImage, offerLetterDoc } = req.body;
    const { fullName, gender, dateOfBirth, mobileNo, email, country } = personalInformation;
    const { designation, department, dateOfJoin } = employeeInformation;

    if (!fullName || !gender || !dateOfBirth || !mobileNo || !email || !country || !designation || !dateOfJoin) {
        return res.status(400).json({
            status: false,
            message: "fullName, gender, dateOfBirth, mobileNo, email, country, designation, and dateOfJoin are required",
            responseCode: "001",
        });
    }

    try {
        const duplicateEmployee = await Employee.findOne({
            ...activeEmployeeFilter(corporateUser),
            $or: [{ "personalInformation.email": email }, { "personalInformation.mobileNo": mobileNo }],
        });

        if (duplicateEmployee) {
            return res.status(400).json({
                status: false,
                message: "Email or Mobile number already exists for another employee",
                responseCode: "001",
            });
        }

        // Same as the regular Add Employee flow: any salary components already
        // registered against this email (global + customized) are attached here.
        const salComponentAssigedToEmail = await getEmployeeSalaryComponentListByEmail({
            corporateUserID: corporateUser,
            employeeEmail: email,
            unassignedOnly: true,
        });
        const salaryComponents = (salComponentAssigedToEmail?.componentData || []).map((component) => ({
            component: component._id.toString(),
            type: component.isGlobal ? "DEFAULT" : "CUSTOM",
        }));

        let offerLetterDocumentUrl;
        if (offerLetterDoc?.base64 && offerLetterDoc?.format) {
            const filePath = `${process.env.NODE_ENV || "staging"}/${corporateUser}/offerLetterDocs`;
            offerLetterDocumentUrl = await uploadFileToS3(offerLetterDoc.base64, filePath, offerLetterDoc.format);
        }

        const timeSchedule = await resolveTimeSchedule(corporateUser, employeeInformation.timeSchedule);
        const workingHours = await calculateHourDifference(timeSchedule);

        const newEmployee = new Employee({
            corporateUser,
            personalInformation: { fullName, gender, dateOfBirth, mobileNo, email, country },
            profileImage: profileImage || null,
            employeeInformation: {
                designation,
                department: department || undefined,
                dateOfJoin,
                employeeStatus: "NEW_HIRE",
                probationPeriod: 3,
                timeSchedule,
                workingHours,
            },
            salaryComponents,
            offerLetter: { status: "PENDING", documentUrl: offerLetterDocumentUrl },
            otherConfigurations: {
                enableESI: defaultEnableEsiForGross(salComponentAssigedToEmail?.grossSalary),
            },
        });

        const savedEmployee = await newEmployee.save();
        const newEmployeeId = savedEmployee._id;
        await SalaryComponent.updateMany(
            { corporateUser, employeeEmail: email, employee: null },
            { $set: { employee: newEmployeeId } } // Assuming SalaryComponent has an `employee` field
        );

        return res.status(201).json({
            status: true,
            responseCode: "000",
            message: "New hire added successfully",
            data: savedEmployee,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Something went wrong",
            responseCode: "500",
        });
    }
});

exports.getNewHireEmployees = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchText = req.query.searchText || "";
    const skip = (page - 1) * limit;

    const queryConditions = {
        corporateUser,
        isEmployeeDeleted: false,
        "employeeInformation.employeeStatus": "NEW_HIRE",
        $or: [
            { "personalInformation.fullName": { $regex: escapeSearch(searchText), $options: "i" } },
            { "personalInformation.email": { $regex: escapeSearch(searchText), $options: "i" } },
            { "personalInformation.mobileNo": { $regex: escapeSearch(searchText), $options: "i" } },
        ],
    };

    const [rows, count] = await Promise.all([
        Employee.find(queryConditions)
            .populate("employeeInformation.department", "departmentName")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Employee.countDocuments(queryConditions),
    ]);

    return res.status(200).json({
        status: true,
        responseCode: "000",
        message: "New hire employees fetched successfully",
        data: { rows, count },
    });
});

exports.getNewHireProfile = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id;
    const { employeeId } = req.params;

    const employee = await Employee.findOne({ _id: employeeId, corporateUser, isEmployeeDeleted: false })
        .populate("employeeInformation.department", "departmentName")
        .populate({
            path: "salaryComponents.component",
            model: "SalaryComponent",
            select: "componentName calculationType amountPercentage status",
        });

    if (!employee) {
        return res.status(404).json({ status: false, responseCode: "001", message: "New hire not found", data: {} });
    }

    const sentAtDate = employee.offerLetter?.sentAt;
    const isSigned = employee.offerLetter?.status === "SIGNED";
    const signingTimeline = [
        { step: "Offer Letter Sent", completed: !!sentAtDate, date: sentAtDate || null },
        { step: "Email Delivered", completed: !!sentAtDate, date: sentAtDate || null },
        { step: "E-Signature Completed", completed: isSigned, date: employee.offerLetter?.signedAt || null },
        { step: "Joining Date", completed: isSigned, date: employee.employeeInformation?.dateOfJoin || null },
    ];

    return res.status(200).json({
        status: true,
        responseCode: "000",
        message: "New hire profile fetched successfully",
        data: { ...employee.toJSON(), signingTimeline },
    });
});

// Called by officeAndBusiness's e-sign webhook once an offer letter is signed/rejected.
exports.updateOfferLetterStatus = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { status, signedDocumentUrl, eSignId } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: "001", message: "Employee not found", data: {} });
    }

    // Ignore stale reports from a signing request that's no longer current (e.g.
    // the personal email changed after this document was sent, and a fresh one
    // was issued) — a late signature on the old link must not overwrite the
    // employee's current offer letter status.
    if (employee.offerLetter?.eSignId && eSignId && employee.offerLetter.eSignId !== eSignId) {
        return res.status(200).json({
            status: true,
            responseCode: "000",
            message: "Ignored: eSignId no longer matches the employee's current offer letter",
            data: {},
        });
    }

    employee.offerLetter.status = status;
    if (signedDocumentUrl) employee.offerLetter.documentUrl = signedDocumentUrl;
    let joinedPayroll = false;
    if (status === "SIGNED") {
        employee.offerLetter.signedAt = new Date();
        if (employee.employeeInformation.employeeStatus === "NEW_HIRE") {
            employee.employeeInformation.employeeStatus = "INPROBATION";
            joinedPayroll = true;
        }
        if (signedDocumentUrl) {
            employee.employeeDocuments.push({
                name: "Signed Offer Letter",
                url: signedDocumentUrl,
            });
        }
    }
    await employee.save();
    // A signed offer moves a NEW_HIRE onto the rolls — may make EPF mandatory (20+).
    if (joinedPayroll) await ensureEpfEnabledWhenMandatory(employee.corporateUser);

    return res.status(200).json({
        status: true,
        responseCode: "000",
        message: "Offer letter status updated successfully",
        data: {},
    });
});

exports.saveOfferLetterESignId = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id;
    const { id } = req.params;
    const { eSignId } = req.body;

    const employee = await Employee.findOne({ _id: id, corporateUser });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: "001", message: "Employee not found", data: {} });
    }

    employee.offerLetter.eSignId = eSignId;
    employee.offerLetter.sentAt = new Date();
    // A fresh e-sign request supersedes any earlier EMAIL_CHANGED flag.
    employee.offerLetter.status = "PENDING";
    await employee.save();

    return res.status(200).json({
        status: true,
        responseCode: "000",
        message: "Offer letter e-sign id saved successfully",
        data: {},
    });
});


exports.updateEmployeeInfo = asyncHandler(async (req, res, next) => {
    try {
        const employee = req.params.id;
        let corporateUser = req.user._id
        const existEmployee = await Employee.findOne({ _id: employee, corporateUser, isEmployeeDeleted: false });

        if (!existEmployee) {
            return res.status(404).json({
                status: false,
                message: "Employee not found",
                responseCode: '404',
            });
        }
        const {
            profileImage,
            employeeInformation,
        } = req.body;
        let { employeeId } = employeeInformation;
        if (employeeId) {
            const isDuplicateEmployeeId = await Employee.findOne({
                ...activeEmployeeFilter(corporateUser),
                "employeeInformation.employeeId": employeeId,
            });
            if (isDuplicateEmployeeId && !existEmployee) {
                return res.status(400).json({
                    status: false,
                    data: {},
                    message: "Employee ID already exists for another employee",
                    responseCode: '001'
                });
            }
        }
        if (profileImage) {
            existEmployee.profileImage = profileImage;
        }

        if (employeeInformation) {
            existEmployee.employeeInformation = withManagedEmploymentFields(
                employeeInformation,
                existEmployee.employeeInformation?.toObject?.() || existEmployee.employeeInformation
            );
        }
        const updatedEmployee = await existEmployee.save();
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: "Employee information updated successfully",
            data: updatedEmployee,
        });
    } catch (err) {
        console.error(err);
        return next(new ErrorResponse("Something went wrong while updating employee info", 500));
    }
});

exports.updateSalaryInfo = asyncHandler(async (req, res, next) => {
    try {
        // Extract the employee ID from the request parameters
        const employeeId = req.params.id;

        // Find the employee by ID within the logged-in corporate
        const employee = await Employee.findOne({ _id: employeeId, corporateUser: req.user._id, isEmployeeDeleted: false });

        // If the employee does not exist, return an error
        if (!employee) {
            return res.status(404).json({
                status: false,
                message: "Employee not found",
                responseCode: '404',
            });
        }

        // Extract the salary components and configurations from the request body
        const { salaryComponents, otherConfigurations, profileImage } = req.body;

        // Update salary components if provided
        if (salaryComponents) {
            employee.salaryComponents = salaryComponents;
        }

        // Update other salary configurations if provided
        if (otherConfigurations) {
            employee.otherConfigurations = otherConfigurations;
        }
        if (profileImage) {
            employee.profileImage = profileImage;
        }
        // Save the updated employee salary information
        const updatedEmployee = await employee.save();

        // Respond with the updated salary information
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: "Salary information updated successfully",
            data: updatedEmployee,
        });
    } catch (err) {
        console.error(err);
        return next(new ErrorResponse("Something went wrong while updating salary info", 500));
    }
});
exports.updateDocumentInfo = asyncHandler(async (req, res, next) => {
    try {
        // Extract the employee ID from the request parameters
        const employeeId = req.params.id;

        // Find the employee by ID within the logged-in corporate
        const employee = await Employee.findOne({ _id: employeeId, corporateUser: req.user._id, isEmployeeDeleted: false });

        // If the employee does not exist, return an error
        if (!employee) {
            return res.status(404).json({
                status: false,
                message: "Employee not found",
                responseCode: '404',
            });
        }

        // Extract the profile image and employee documents from the request body
        const { profileImage, employeeDocuments } = req.body;

        // Update profile image if provided
        if (profileImage) {
            employee.profileImage = profileImage;
        }

        // Update employee documents if provided
        if (employeeDocuments) {
            employee.employeeDocuments = employeeDocuments;
        }

        // Save the updated employee information
        const updatedEmployee = await employee.save();

        // Respond with the updated employee document data
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: "Employee documents and profile image updated successfully",
            data: updatedEmployee,
        });
    } catch (err) {
        console.error(err);
        return next(new ErrorResponse("Something went wrong while updating employee documents and profile image", 500));
    }
});
exports.updateBankInfo = asyncHandler(async (req, res, next) => {
    try {
        const employeeId = req.params.id;
        const employee = await Employee.findOne({ _id: employeeId, corporateUser: req.user._id, isEmployeeDeleted: false });

        if (!employee) {
            return res.status(404).json({
                status: false,
                message: "Employee not found",
                responseCode: '404',
            });
        }

        const { profileImage, bankDetails } = req.body;

        if (profileImage) {
            employee.profileImage = profileImage;
        }

        let updatedBankDetails;
        if (bankDetails) {


            updatedBankDetails = await BankDetails.create({
                ...bankDetails,
                isDefaultAccount: true,
                employeeId: employeeId,
                corporateUser: employee.corporateUser,
            });
            employee.bankDetails = updatedBankDetails._id;

        }
        employee.isCompleted = true;

        const updatedEmployee = await employee.save();
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: "Bank information, profile image, and isCompleted status updated successfully",
            data: {
                employee: updatedEmployee,
                bankDetails: updatedBankDetails,
            },
        });
    } catch (err) {
        console.error(err);
        return next(new ErrorResponse("Something went wrong while updating bank info", 500));
    }
});

exports.getEmployeeBySearch = asyncHandler(async (req, res) => {
    const searchText = req.query.searchText || "";
    const userId = req.user._id;
    const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    let employees = await getEmployeesBySearch(userId, searchText, month, year);
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employees fetched successfully",
        data: { employees },
    });

})
exports.createEmpstatutory = asyncHandler(async (req, res) => {
    // Destructure personalInformation and profileImage from req.body
    const { otherConfigurationsSchema } = req.body;

    const corporateUser = req.user._id;

    try {
        // Get the employeeId from query parameters
        const employeeId = req.params.employeeId;

        let existingEmployee;
        // If employeeId is provided, check if the employee exists
        if (employeeId) {
            existingEmployee = await Employee.findOne({ _id: employeeId, corporateUser, isEmployeeDeleted: false });

            if (!existingEmployee) {
                return res.status(404).json({
                    status: false,
                    message: "Employee not found",
                    responseCode: "404",
                });
            }
        }

        let savedEmployee;
        // If the employee exists, update their personal information and profile image
        if (existingEmployee) {
            const epfUAN = otherConfigurationsSchema?.epfUAN;
            if (epfUAN && await findActiveIdentityConflict(corporateUser, { 'otherConfigurations.epfUAN': String(epfUAN).trim() }, existingEmployee._id)) {
                return res.status(400).json({
                    status: false,
                    data: {},
                    message: "UAN already exists for another employee",
                    responseCode: '001'
                });
            }

            // Merge only the keys actually sent — otherConfigurationsSchema is typically a
            // single toggle (e.g. { enableEPF: true }), and this used to be replaced
            // wholesale, silently resetting every other toggle to its schema default.
            existingEmployee.otherConfigurations = Object.assign(
                {},
                existingEmployee.otherConfigurations,
                otherConfigurationsSchema
            );

            savedEmployee = await existingEmployee.save();

            // Keep the employee's actual Deduction Component row in sync with the
            // EPF/ESI/Professional Tax toggle, so Deduction Components always shows what
            // Statutory Components says (no-op if the org has no such component
            // configured). Labour Welfare Fund needs no entry here — it's never modeled as
            // a DeductionComponent row; lwfCalc.js reads otherConfigurations.laborWelfareFund directly.
            const deductionNameByToggle = {
                enableEPF: 'Provident Fund (PF)',
                enableESI: 'ESI',
                professionalTax: 'Professional Tax',
            };
            await Promise.all(
                Object.entries(deductionNameByToggle)
                    .filter(([toggleKey]) => toggleKey in otherConfigurationsSchema)
                    .map(([toggleKey, deductionName]) =>
                        setEmployeeDeductionActiveByName({
                            corporateUserID: corporateUser,
                            employeeId: existingEmployee._id,
                            deductionName,
                            active: !!otherConfigurationsSchema[toggleKey],
                        })
                    )
            );

            return res.status(200).json({
                status: true,
                responseCode: "000",
                message: "Employee personal information and profile image updated successfully",
                data: savedEmployee,
            });
        }

        // If no employeeId is provided or the employee doesn't exist, create a new employee
        const newEmployee = new Employee({
            corporateUser,
            otherConfigurations: otherConfigurationsSchema,
        });

        savedEmployee = await newEmployee.save();

        return res.status(201).json({
            status: true,
            responseCode: "000",
            message: "Employee created successfully",
            data: savedEmployee,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: error?.message || "Something went wrong",
            responseCode: "500",
        });
    }
});

exports.getStatutoryEmployeeById = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id
    const employeeId = req.params.employeeId

    const complianceSettingInfo = await getComplianceSettingsUsingCorporateId(corporateUserID);
    if (!complianceSettingInfo) {
        return next(new ErrorResponse('User Id not found', 404))
    }
    const employeeInfo = await findEmployeeByIdAndCorporateUser(employeeId, corporateUserID);
    if (!employeeInfo) {
        return next(new ErrorResponse('Employee not found', 404))
    }

    const otherConfigs = employeeInfo.otherConfigurations || {};
    const compliance = Array.isArray(complianceSettingInfo) ? complianceSettingInfo[0] : complianceSettingInfo;
    const taxRegime = otherConfigs.tdsRegime || compliance?.tds?.taxRegime || 'New Tax Regime';
    const standardDeduction = taxRegime === 'Old Tax Regime' ? 50000 : 75000;

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Retrieved Employee Statutory Info",
        data: {
            // EPF/ESI are opt-OUT, not opt-IN: an employee whose document predates this
            // field (so it reads back as undefined, regardless of the schema's own default)
            // still shows as Active by default — only an explicit `false` turns a component
            // off. `?? false` here would silently re-introduce the "shows Inactive until
            // someone remembers to touch the toggle" bug this default was meant to fix.
            //
            // Professional Tax / Labour Welfare Fund are the OPPOSITE convention — opt-IN,
            // matching their own schema default of `false` (see otherConfigurationsSchema
            // in employee.js) and the documented "starts inactive for every newly added
            // employee, HR/Admin turns it on manually" requirement (bulkEmployeeCtc.js).
            // `?? true` here was coercing every untouched employee's undefined into a
            // literal `true` before it ever reached the frontend.
            enableEPF: otherConfigs.enableEPF ?? true,
            enableESI: otherConfigs.enableESI ?? true,
            professionalTax: otherConfigs.professionalTax ?? false,
            laborWelfareFund: otherConfigs.laborWelfareFund ?? false,
            lwf: otherConfigs.lwf ?? {},
            tds: otherConfigs.tds ?? false,
            epfUAN: otherConfigs.epfUAN ?? null,
            esiNumber: otherConfigs.esiNumber ?? null,
            panNumber: employeeInfo.panNumber ?? null,
            taxRegime,
            standardDeduction,
            complianceSettingInfo
        }
    });

})
exports.sendResponseLimitSubscription = asyncHandler(async (req, res) => {
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Validation completed',
    });
})

exports.getExistingEmployee = asyncHandler(async (req, res) => {

    const searchText = req.query.searchText || "";
    const userId = req.user._id;
    const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    let employees = await getEmployeesList(userId, searchText, month, year);
    const filterByEmail = req.query.filterByEmail === 'true';
    if (filterByEmail) {
        employees = employees.filter(emp => emp.personalEmail);
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employees fetched successfully",
        data: { employees },
    });

})

// Promotes a NEW_HIRE employee to CONFIRMED once their ESS-signed offer letter is on file.
exports.confirmJoining = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const corporateUserId = req.user._id;

    const employee = await findEmployeeByIdAndCorporateUser(id, corporateUserId);
    if (!employee) {
        return res.status(404).json({
            status: false,
            responseCode: '001',
            message: 'Employee not found',
            data: {},
        });
    }

    // Not a NEW_HIRE (already confirmed, or never went through this workflow) or the
    // offer letter isn't signed yet — nothing to do here. This is a best-effort side
    // effect of the ESS invite flow, so it must not block sending the invite.
    if (employee.employeeInformation?.employeeStatus !== 'NEW_HIRE' || employee.offerLetter?.status !== 'SIGNED') {
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'No joining confirmation needed for this employee',
            data: employee,
        });
    }

    const updated = await updateEmployeeById(id, corporateUserId, {
        'employeeInformation.employeeStatus': 'CONFIRMED',
    });
    // Joining moves a NEW_HIRE onto the rolls — may make EPF mandatory (20+).
    await ensureEpfEnabledWhenMandatory(corporateUserId);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Employee joining confirmed successfully',
        data: updated,
    });
})