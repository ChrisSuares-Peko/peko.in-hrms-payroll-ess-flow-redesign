const moment = require("moment");
const ComplianceSettings = require("../entities/complianceSettings");
const DeductionComponent = require("../entities/deductionComponent");
const Employee = require("../entities/employee");
const Salary = require("../entities/salary");
const ErrorResponse = require("../../utils/error-response");
const { markSalaryStale } = require("../../services/salaryStaleMarker");

// getEmployeeDeductionComponentsList (the real payroll calculation path) resolves PF by
// finding a global DeductionComponent named exactly "Provident Fund (PF)" — it's an
// internal calculation artifact now, deliberately hidden from the Deductions tab UI (see
// getAllDeductionComponents), but it must still exist for PF to actually be deducted.
// Ensure it exists as soon as EPF is configured — also called lazily by every reader of
// this doc (getEmployeeDeductionComponentsList, ctcCalculator.js, bulkEmployeeCtc.js) for
// an org that has never explicitly visited Compliance Settings > EPF, so a brand-new
// corporate account isn't silently missing PF everywhere (payroll, CTC preview, New Hire)
// just because nobody has opened that settings page yet — EPF is on by default (see
// Employee entity's otherConfigurations.enableEPF default: true), so its deduction
// component should exist by default too.
const PF_QUERY = (corporateUserID) => ({
  corporateUser: corporateUserID,
  isGlobal: true,
  deductionName: 'Provident Fund (PF)',
});

const ensureProvidentFundDeductionExists = async (corporateUserID) => {
  // This is now called from several places on effectively every Add Employee/onboarding
  // page load (getAllSalaryComponents, getCurrentComponent,
  // getEmployeeSalaryComponentListByEmail, getAllDeductionComponents,
  // getEmployeeDeductionComponentsList), so concurrent requests for the same
  // newly-onboarded corporate user racing to seed this row for the first time is an
  // expected case, not an edge case — a separate findOne-then-create had a window where
  // two concurrent calls could both see "doesn't exist yet" and both insert, leaving two
  // duplicate global PF rows (which then doubles the employee's actual PF deduction, see
  // getEmployeeDeductionComponentsList's dedupe). findOneAndUpdate's upsert is a single
  // atomic operation, closing almost all of that window.
  try {
    return await DeductionComponent.findOneAndUpdate(
      PF_QUERY(corporateUserID),
      {
        $setOnInsert: {
          corporateUser: corporateUserID,
          deductionName: 'Provident Fund (PF)',
          calculationType: 'PERCENTAGE',
          amountPercentage: 12,
          calculationBasis: 'MONTHLY',
          status: 'ACTIVE',
        },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    // The DeductionComponent schema also carries a unique index on
    // {corporateUser, deductionName} for isGlobal:true rows, which is what actually
    // makes a duplicate impossible — but that means two truly simultaneous upserts can
    // still race past the check above and have the DB reject the loser with E11000. The
    // loser doesn't need to error out here: the winner's document is now guaranteed to
    // exist, so just read it back.
    if (error?.code === 11000) {
      const existing = await DeductionComponent.findOne(PF_QUERY(corporateUserID));
      if (existing) return existing;
    }
    throw error;
  }
};
exports.ensureProvidentFundDeductionExists = ensureProvidentFundDeductionExists;

exports.updateOrCreateEpfSettings = async (corporateUserID, params) => {
  const {
    epfNumber,
    pfWagesPolicy,
    enableProRatedPfWage,
    considerSalaryComponents,
  } = params;

  const existingSettings = await ComplianceSettings.findOne({ corporateUser: corporateUserID });

  let epf;
  if (existingSettings) {

    // Assigned field by field rather than replacing `epf` wholesale — the applicability
    // switch and its history (setEpfApplicability) live on this same sub-document and are
    // not part of this form's payload.
    existingSettings.epf.epfNumber = epfNumber;
    existingSettings.epf.pfWagesPolicy = pfWagesPolicy;
    existingSettings.epf.enableProRatedPfWage = enableProRatedPfWage;
    existingSettings.epf.considerSalaryComponents = considerSalaryComponents;


    await existingSettings.save();

    epf = existingSettings.epf;
  } else {

    const newSettings = new ComplianceSettings({
      corporateUser: corporateUserID,
      epf: {
        epfNumber,
        pfWagesPolicy,
        enableProRatedPfWage,
        considerSalaryComponents,
      },
    });


    await newSettings.save();

    console.log("New EPF settings created for user:", corporateUserID);
    epf = newSettings.epf;
  }

  await ensureProvidentFundDeductionExists(corporateUserID);
  return epf;
};

// EPF is mandatory for an establishment with 20 or more employees (EPF Act, Section 1(3));
// below that it is optional, so only then may the switch be turned off.
const EPF_MANDATORY_EMPLOYEE_THRESHOLD = 20;
const PAYROLL_RECORDED_STATUSES = ['PAID', 'APPROVED', 'COMPLETED'];

// Headcount for the 20-employee EPF rule — everyone on the rolls (same working statuses the
// Employees list and payroll treat as active, plus anyone resigned whose last working day
// hasn't passed yet) AND every pending new hire, since they're joining; only a new hire
// whose offer letter was rejected is left out.
const countActiveEmployees = (corporateUserID) =>
  Employee.countDocuments({
    corporateUser: corporateUserID,
    isEmployeeDeleted: false,
    $or: [
      { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'INPROBATION', 'CONFIRMED'] } },
      { 'employeeInformation.employeeStatus': 'RESIGNED', 'offBoardingInformation.lastWorkingDay': { $gte: new Date() } },
      { 'employeeInformation.employeeStatus': 'NEW_HIRE', 'offerLetter.status': { $ne: 'REJECTED' } },
    ],
  });

// A flip takes effect from the first month with no payroll run recorded — the month
// after the latest paid one — so issued payslips never change. With no payroll ever run,
// it takes effect from the current month.
const resolveNextUnpaidPeriod = async (corporateUserID) => {
  const latestPaid = await Salary.findOne({
    corporateUser: corporateUserID,
    paymentStatus: { $in: PAYROLL_RECORDED_STATUSES },
  })
    .sort({ year: -1, month: -1 })
    .select({ year: 1, month: 1 })
    .lean();

  if (!latestPaid) {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear(), hasProcessedPayroll: false };
  }
  const next = moment({ year: latestPaid.year, month: latestPaid.month - 1, day: 1 }).add(1, 'month');
  return { month: next.month() + 1, year: next.year(), hasProcessedPayroll: true };
};

exports.getEpfApplicabilityContext = async (corporateUserID) => {
  const [settings, activeEmployeeCount, nextPeriod] = await Promise.all([
    ComplianceSettings.findOne({ corporateUser: corporateUserID }).lean(),
    countActiveEmployees(corporateUserID),
    resolveNextUnpaidPeriod(corporateUserID),
  ]);

  return {
    isApplicable: settings?.epf?.isApplicable !== false,
    activeEmployeeCount,
    mandatoryThreshold: EPF_MANDATORY_EMPLOYEE_THRESHOLD,
    canDisable: activeEmployeeCount < EPF_MANDATORY_EMPLOYEE_THRESHOLD,
    hasProcessedPayroll: nextPeriod.hasProcessedPayroll,
    // The month a flip made right now would take effect from.
    nextEffectiveMonth: nextPeriod.month,
    nextEffectiveYear: nextPeriod.year,
    history: settings?.epf?.applicabilityHistory || [],
    showEmployeePfInEarnings: settings?.epf?.showEmployeePfInEarnings === true,
    earningsLineHistory: settings?.epf?.earningsLineHistory || [],
  };
};

// "Show PF Employee's Contribution in Earnings" — display only; same timing as the EPF
// switch (effective from the first unpaid month, so issued payslips never change).
exports.setEpfEarningsLine = async (corporateUserID, { showInEarnings, changedBy = null }) => {
  const settings =
    (await ComplianceSettings.findOne({ corporateUser: corporateUserID })) ||
    new ComplianceSettings({ corporateUser: corporateUserID });

  if (settings.epf?.isApplicable === false) {
    throw new ErrorResponse('Turn on "EPF applies to this establishment" first — there is no PF to show while EPF is off.', 400);
  }
  if ((settings.epf?.showEmployeePfInEarnings === true) === showInEarnings) {
    return exports.getEpfApplicabilityContext(corporateUserID);
  }

  const { month, year } = await resolveNextUnpaidPeriod(corporateUserID);
  settings.epf = settings.epf || {};
  settings.epf.showEmployeePfInEarnings = showInEarnings;
  settings.epf.earningsLineHistory = [
    ...(settings.epf.earningsLineHistory || []),
    { showInEarnings, effectiveMonth: month, effectiveYear: year, changedAt: new Date(), changedBy },
  ];
  await settings.save();

  return exports.getEpfApplicabilityContext(corporateUserID);
};

exports.setEpfApplicability = async (corporateUserID, { isApplicable, changedBy = null, reason = null }) => {
  const settings =
    (await ComplianceSettings.findOne({ corporateUser: corporateUserID })) ||
    new ComplianceSettings({ corporateUser: corporateUserID });

  const current = settings.epf?.isApplicable !== false;
  if (current === isApplicable) {
    return exports.getEpfApplicabilityContext(corporateUserID);
  }

  if (!isApplicable) {
    const activeEmployeeCount = await countActiveEmployees(corporateUserID);
    if (activeEmployeeCount >= EPF_MANDATORY_EMPLOYEE_THRESHOLD) {
      throw new ErrorResponse(
        `EPF is mandatory for establishments with ${EPF_MANDATORY_EMPLOYEE_THRESHOLD} or more employees (Section 1(3), EPF Act). You have ${activeEmployeeCount} active employees.`,
        400
      );
    }
  }

  const { month, year } = await resolveNextUnpaidPeriod(corporateUserID);
  settings.epf = settings.epf || {};
  settings.epf.isApplicable = isApplicable;
  settings.epf.applicabilityHistory = [
    ...(settings.epf.applicabilityHistory || []),
    { isApplicable, effectiveMonth: month, effectiveYear: year, changedAt: new Date(), changedBy, reason },
  ];
  await settings.save();

  // Turning EPF back on for an org whose PF deduction row was never seeded (or whose
  // settings doc was created by this flip) must still leave PF computable everywhere.
  if (isApplicable) await ensureProvidentFundDeductionExists(corporateUserID);

  // Single writer of the EPF switch — reached from the compliance settings route and from
  // the headcount auto-enable on hire/bulk upload/revise/payroll runs alike, so every
  // unpaid salary is recalculated under the new setting.
  await markSalaryStale({
    corporateUserID,
    reason: `EPF applicability set to ${isApplicable}`,
  });

  return exports.getEpfApplicabilityContext(corporateUserID);
};

// EPF becomes mandatory the moment an establishment reaches 20 employees, so an org that
// had switched it off gets it switched back ON automatically — from the first unpaid
// payroll month, exactly like a manual flip, so paid months keep what they had. Called
// wherever someone joins the payroll (first salary setup, bulk upload, a new hire joining)
// and once at the start of every payroll run as a safety net for any other path (e.g. a
// status edit). Never throws: a failure here must not block hiring or a payroll run.
exports.ensureEpfEnabledWhenMandatory = async (corporateUserID) => {
  try {
    const settings = await ComplianceSettings.findOne({ corporateUser: corporateUserID }).select('epf.isApplicable').lean();
    if (settings?.epf?.isApplicable !== false) return false;

    const activeEmployeeCount = await countActiveEmployees(corporateUserID);
    if (activeEmployeeCount < EPF_MANDATORY_EMPLOYEE_THRESHOLD) return false;

    await exports.setEpfApplicability(corporateUserID, {
      isApplicable: true,
      changedBy: 'SYSTEM',
      reason: `Headcount reached ${activeEmployeeCount} — EPF is mandatory at ${EPF_MANDATORY_EMPLOYEE_THRESHOLD} or more employees`,
    });
    return true;
  } catch (error) {
    console.error('ensureEpfEnabledWhenMandatory failed for', corporateUserID, error);
    return false;
  }
};



exports.updateEsiSettings = async (corporateUserID, params) => {
  const {
    esiNumber,
    deductionCycle,
    employeeContribution,
    employerContribution,
  } = params;


  let existingSettings = await ComplianceSettings.findOne({ corporateUser: corporateUserID });

  if (existingSettings) {

    existingSettings.esi = {
      esiNumber,
      deductionCycle,
      employeeContribution,
      employerContribution,
    };

    // Save the updated document (only ESI data is updated)
    await existingSettings.save();

    return existingSettings.esi;
  } else {

    const newSettings = new ComplianceSettings({
      corporateUser: corporateUserID,
      esi: {
        esiNumber,
        deductionCycle,
        employeeContribution,
        employerContribution,
      },

    });


    await newSettings.save();

    return newSettings.esi;
  }
};



exports.updateProfessionalTaxSettings = async (corporateUserID, params) => {
 
  const {
    ptNumber,
    deductionCycle,
    incomeSlabs
  } = params;

  // Try to find the existing compliance settings for the corporate user
  const existingSettings = await ComplianceSettings.findOne({ corporateUser: corporateUserID });

  if (existingSettings) {
    // Update the existing document with the new Professional Tax data
    existingSettings.professionalTax = {
      ptNumber,
      deductionCycle,
      incomeSlabs
    };

    // Save the updated document
    await existingSettings.save();

    return existingSettings.professionalTax;
  } else {
    // If no settings exist, create a new document for this corporate user
    const newSettings = new ComplianceSettings({
      corporateUser: corporateUserID,
      professionalTax: {
        ptNumber,
        deductionCycle,
        incomeSlabs
      }
    });

    // Save the new document
    await newSettings.save();

    return newSettings.professionalTax;
  }
};



exports.updateLaborWelfareFundSettings = async (corporateUserID, params) => {
  const { workState, registrationNumber } = params;

  // Try to find the existing compliance settings for the corporate user
  const existingSettings = await ComplianceSettings.findOne({ corporateUser: corporateUserID });

  if (existingSettings) {
    // If the settings exist, update the existing document with the new Labor Welfare Fund data
    existingSettings.laborWelfareFund = {
      workState,
      registrationNumber,
    };

    // Save the updated document
    await existingSettings.save();

    return existingSettings.laborWelfareFund;
  } else {
    // If no settings exist, create a new document for this corporate user
    const newSettings = new ComplianceSettings({
      corporateUser: corporateUserID,
      laborWelfareFund: {
        workState,
        registrationNumber,
      },
    });

    // Save the new document
    await newSettings.save();

    return newSettings.laborWelfareFund;
  }
};
exports.getComplianceSettingsUsingCorporateId = async (corporateUser) => {
  try {
    return await ComplianceSettings.find({ corporateUser })

  } catch (error) {
    return error;

  }
}


exports.saveTdsSettings = async (corporateUserID, tdsData) => {
  try {
    const { tan, assignedCommissioner, address, bsr = {}, authorizedSignatoryDetails = {}, taxRegime } = tdsData;

    // Find the compliance settings for the corporate user using the corporateUserID
    let complianceSettings = await ComplianceSettings.findOne({ corporateUser: corporateUserID });

    if (!complianceSettings) {
      // If no compliance settings exist for the corporate user, create new settings with the corporateUserID
      complianceSettings = new ComplianceSettings({ corporateUser: corporateUserID });
    }

    // Commissioner/Address/Father's Name/Signature are no longer sent by the redesigned
    // TDS form — merge onto whatever's already saved instead of replacing wholesale, so an
    // org that filled these in under the older form doesn't silently lose them the next
    // time they save TAN/BSR/Authorized Signatory here.
    const existingTds = complianceSettings.tds || {};
    const existingBsr = existingTds.bsr || {};
    const existingSignatory = existingTds.authorizedSignatoryDetails || {};

    complianceSettings.tds = {
      tan: tan !== undefined ? tan : existingTds.tan,
      assignedCommissioner: assignedCommissioner !== undefined ? assignedCommissioner : existingTds.assignedCommissioner,
      address: address !== undefined ? address : existingTds.address,
      bsr: {
        bankName: bsr.bankName !== undefined ? bsr.bankName : existingBsr.bankName,
        bsrCode: bsr.bsrCode !== undefined ? bsr.bsrCode : existingBsr.bsrCode,
      },
      authorizedSignatoryDetails: {
        name: authorizedSignatoryDetails.name !== undefined ? authorizedSignatoryDetails.name : existingSignatory.name,
        fathersName: authorizedSignatoryDetails.fathersName !== undefined ? authorizedSignatoryDetails.fathersName : existingSignatory.fathersName,
        signature: authorizedSignatoryDetails.signature !== undefined ? authorizedSignatoryDetails.signature : existingSignatory.signature,
        placeOfSigning: authorizedSignatoryDetails.placeOfSigning !== undefined ? authorizedSignatoryDetails.placeOfSigning : existingSignatory.placeOfSigning,
      },
      taxRegime: taxRegime !== undefined ? taxRegime : existingTds.taxRegime,
    };

    // Save the updated document
    const savedComplianceSettings = await complianceSettings.save();

    return savedComplianceSettings;
  } catch (error) {
    throw new Error('Error saving TDS settings: ' + error.message);
  }
};

