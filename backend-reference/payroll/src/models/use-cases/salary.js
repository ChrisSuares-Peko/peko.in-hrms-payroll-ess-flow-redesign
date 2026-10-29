// const { getEmployeeById } = require("../../controller/employee");
const mongoose = require('mongoose');
const { getDaysDifference, resolvePerDayDivisor, resolveNonWorkingPayDays } = require("../../utils/dateUtils");
const { fetchArrearsForPayout, markArrearsAsPaid } = require("./reviseSalary");
const HrSettings = require("../entities/hrSettings");
const Salary = require("../entities/salary");
const SalaryPayoutTransaction = require("../entities/salaryPayoutTransaction");
const OrganizationSettings = require("../entities/organizationSettings");
const { getEmployeeSalaryComponentForProcessSalary } = require("../../models/use-cases/salaryComponent");
const Employee = require("../entities/employee");
const Incentives = require("../entities/incentives");
const Bonus = require("../entities/bonus");
const Reimbursement = require("../entities/reimbursement");
const Overtime = require("../entities/overTime");
const { fetchIncentivesByEmployeeAndCorporateUserProfileSalary } = require('../../models/use-cases/incentives');
const { fetchBonusByEmployeeAndCorporateUserProfileSalary } = require('../../models/use-cases/bonus');
const { fetchOvertimeByEmployeeAndCorporateUserProfileSalary } = require('../../models/use-cases/overTime');
const BankDetails = require('../entities/bankDetails');
const OneTimePayment = require('../entities/oneTimePayment');
const { getEmployeeCtcBreakdown, ESI_EMPLOYER_RATE } = require('./ctcCalculator');
const SalaryStructureVersion = require('../entities/salaryStructureVersion');
const { escapeSearch } = require('../../utils/escapeRegex');
const Arrears = require('../entities/arrears');
const { isOldTaxRegimeEmployee, resolveManualTds } = require('./tdsOverride');



const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose

// getEmployeeCtcBreakdown always resolves against "now" — correct for the live CTC
// Structure tab, but wrong for a not-yet-locked-in month that a LATER revision has since
// superseded (e.g. viewing December's payslip after a January CTC revision): "now" then
// answers with the NEW CTC, silently overwriting December's correctly-persisted earnings/
// deductions with numbers that only became true in January. Same "latest version
// effective on/before the target month" + "is a later one on record" check
// getEmployeeSalaryComponentForProcessSalary (salaryComponent.js) already uses to decide
// this exact thing for actual payroll processing — reused here so the Salary Profile page
// and its PDF agree with what processing itself would compute for that month.
const findSupersededHistoricalCtc = async (employeeId, month, year) => {
  const endOfTargetMonth = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
  const structureVersion = await SalaryStructureVersion.findOne({
    employee: employeeId,
    effectiveFrom: { $lte: endOfTargetMonth },
  }).sort({ effectiveFrom: -1, createdAt: -1 }).lean();
  if (!structureVersion) return null;
  const isSuperseded = await SalaryStructureVersion.exists({
    employee: employeeId,
    effectiveFrom: { $gt: structureVersion.effectiveFrom },
  });
  return isSuperseded ? structureVersion : null;
};

// The annual CTC a month was actually PAID at, when a backdated Revise Salary has since
// covered it with arrears — e.g. August paid at ₹6L, then a ₹12L revision effective August
// pays the difference as arrears in September. The version in effect for August is then
// the ₹12L one, but August itself was paid at that revision's previousAnnualCTC. The
// earliest such revision wins (a later one revises an already-revised CTC). null when no
// arrears cover this month.
const findCtcPaidForMonthBeforeArrears = async (employeeId, month, year) => {
  const arrear = await Arrears.findOne({
    employee: employeeId,
    coveredMonths: { $elemMatch: { month: Number(month), year: Number(year) } },
  }).sort({ createdAt: 1 }).select('salaryStructureVersion').lean();
  if (!arrear?.salaryStructureVersion) return null;
  const revision = await SalaryStructureVersion.findById(arrear.salaryStructureVersion).select('previousAnnualCTC').lean();
  return revision?.previousAnnualCTC > 0 ? revision.previousAnnualCTC : null;
};

// One-time recoveries (Add Deduction) as the payroll run applied them to this salary
// record, named by their type. Only what was actually taken this month is listed;
// isCarriedIn marks a balance from an earlier month's deduction (edited in that month).
const oneTimeDeductionLines = (salaryRecord) => (salaryRecord.oneTimeDeductions || [])
  .filter(d => (d.appliedAmount || 0) > 0)
  .map((d) => {
    const isCarriedIn = d.month && d.year
      && (Number(d.year) * 12 + Number(d.month)) < (Number(salaryRecord.year) * 12 + Number(salaryRecord.month));
    return {
      deductionId: d.deductionId ? String(d.deductionId) : null,
      deductionFor: d.deductionFor,
      label: d.deductionFor,
      note: d.note || '',
      amount: d.appliedAmount,
      fullAmount: d.amount,
      carriedForward: d.carriedForward || 0,
      isCarriedIn: !!isCarriedIn,
    };
  });

exports.findOneSalary = async (params) => {
    const { corporateUserID, employeeId, month, year } = params;

    const [employee, organizationSettings, salaryRecord, hrSettings, bankDetailsRecord, breakdown] = await Promise.all([
      Employee.findOne({ _id: employeeId, corporateUser: corporateUserID, isEmployeeDeleted: false }).lean(),
      OrganizationSettings.findOne({ corporateUser: corporateUserID }),
      Salary.findOne({
        corporateUser: corporateUserID,
        employee: new ObjectId(employeeId),
        year: Number(year),
        month: Number(month)
      }).lean(),
      HrSettings.findOne({ corporateUser: corporateUserID })
        .select('payrollSettings.payrollStartsFrom')
        .lean(),
      BankDetails.findOne({ employeeId, isDefaultAccount: true }).lean(),
      // Drives the same per-component split as the Salary Profile page (salaryProfileEmpV2)
      // below, so the downloaded/emailed PDF always agrees with what that page shows for the
      // same month rather than falling back to a single lump "Other Allowance"/"Other
      // Deductions" row. Best-effort: a resolution failure just falls back to the lump sum.
      // month/year passed through so a historical payslip keeps its own period's PF wage
      // ceiling instead of whatever's in force "right now".
      getEmployeeCtcBreakdown({ corporateUserID, employeeId, month, year, includePfEarningsLine: true }).catch(() => null),
    ]);

    if (!employee) throw new Error("Employee not found");
    let bankDetails = bankDetailsRecord;
    if (!bankDetails) {
      bankDetails = await BankDetails.findOne({ employeeId }).lean();
    }
    if (bankDetails) employee.bankDetails = bankDetails;
    console.log('[findOneSalary] employeeId:', employeeId, '| bankDetails found:', !!bankDetails, '| accountNumber:', bankDetails?.accountNumber);

    // If no salary record exists the salary hasn't been processed yet
    if (!salaryRecord) throw new Error("Salary is not processed for this month");

    const si = salaryRecord.salaryInformation || {};

    // Same staleness fix as salaryProfileEmpV2 (see its own comment for the full
    // rationale): a not-yet-locked-in month's persisted totalArrears figure can silently
    // drift from a Revise Salary done since this record was last processed, so it's
    // refreshed here instead of trusted as-is. Once PAID/APPROVED/COMPLETED, the record is
    // historical and left untouched.
    const PAID_STATUSES = ['PAID', 'APPROVED', 'COMPLETED'];
    const isLockedIn = PAID_STATUSES.includes(salaryRecord.paymentStatus);

    // One-time recoveries exactly as the payroll run applied them (after PF/ESI/TDS, within
    // the 50% limit) — Add/Edit/Delete Deduction recalculate the month immediately, so the
    // record is current and a carried balance never shows here at its full amount.
    const oneTimeDeductionRows = oneTimeDeductionLines(salaryRecord);
    if (!isLockedIn) {
      const { totalArrearsPay } = await fetchArrearsForPayout({
        employeeId,
        corporateUserID,
        month: Number(month),
        year: Number(year),
      });
      salaryRecord.totalArrears = totalArrearsPay;
    }

    // A later CTC revision governs "now" (what breakdown reflects) but not necessarily
    // this target month — see findSupersededHistoricalCtc's own comment above.
    const supersededHistoricalCtc = isLockedIn
      ? null
      : await findSupersededHistoricalCtc(employeeId, month, year);

    // With Loss of Pay the recorded earnings/deductions are the reduced, paid figures, and
    // the live breakdown is always the full month — so the record is used as-is (it is
    // regenerated on every salary-list load and on every LOP save, so it is not stale).
    const hasLossOfPay = (salaryRecord.lossOfPay?.days || 0) > 0;
    // Same for a joiner/leaver part month — the recorded figures are the prorated ones.
    const isEarningsProrated = salaryRecord.payDays?.isEarningsProrated === true;

    if (!isLockedIn && breakdown && !supersededHistoricalCtc && !hasLossOfPay && !isEarningsProrated) {
      const liveOtherEarnings = breakdown.earnings.filter(
        e => !['Basic Salary', 'House Rent Allowance', 'Dearness Allowance'].includes(e.componentName)
      );
      si.basicPay = breakdown.basicSalary;
      si.hraAmount = breakdown.earnings.find(e => e.componentName === 'House Rent Allowance')?.calculatedAmount || 0;
      si.daAmount = breakdown.earnings.find(e => e.componentName === 'Dearness Allowance')?.calculatedAmount || 0;
      si.other = liveOtherEarnings.reduce((sum, e) => sum + (e.calculatedAmount || 0), 0);

      si.epfAmount = breakdown.deductions.find(d => d.deductionName === 'Provident Fund (PF)')?.calculatedAmount || 0;
      // ESI is never modeled as an actual DeductionComponent row (a pure statutory formula
      // — see resolveEsi in ctcCalculator.js), so it never appears in breakdown.deductions;
      // it's returned separately as breakdown.esi.employeeContribution instead — the
      // `.find(...)` here always returned undefined, silently dropping this deduction.
      si.esiAmount = breakdown.esi?.employeeContribution || 0;
      si.deductionAmount = breakdown.deductions.reduce((sum, d) => sum + (d.calculatedAmount || 0), 0) + (si.lwfAmount || 0) + si.esiAmount;
    }

    // ---- Non-working days deduction (DOJ / last working day) ----
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const cycleStart = new Date(salaryRecord.salaryCycleStart);
    const cycleEnd = new Date(salaryRecord.salaryCycleEnd);
    const cycleDays = salaryRecord.salaryCycleDays || Math.floor((cycleEnd - cycleStart) / MS_PER_DAY);

    const doj = employee.employeeInformation?.dateOfJoin ? new Date(employee.employeeInformation.dateOfJoin) : null;
    const lastWorkingDay = employee.offBoardingInformation?.lastWorkingDay ? new Date(employee.offBoardingInformation.lastWorkingDay) : null;
    const payrollStartsFrom = hrSettings?.payrollSettings?.payrollStartsFrom ? new Date(hrSettings.payrollSettings.payrollStartsFrom) : null;

    let nonWorkingDeductionDays = 0;
    if (payrollStartsFrom && payrollStartsFrom > cycleStart) {
      nonWorkingDeductionDays += Math.floor((payrollStartsFrom - cycleStart) / MS_PER_DAY);
    }
    if (doj && doj > cycleStart) {
      nonWorkingDeductionDays += Math.floor((doj - cycleStart) / MS_PER_DAY);
    }
    if (doj && doj > cycleEnd) {
      nonWorkingDeductionDays = cycleDays;
    }
    if (lastWorkingDay && lastWorkingDay < cycleEnd) {
      nonWorkingDeductionDays += Math.floor((cycleEnd - lastWorkingDay) / MS_PER_DAY);
    }

    // Payroll Settings > Payroll Cycle lets the org divide gross by "Company working days"
    // (selectWorkingDays, e.g. Mon-Fri) instead of calendar days in the cycle.
    const perDayDivisor = resolvePerDayDivisor(cycleStart, cycleEnd, cycleDays, organizationSettings?.payrollSettings);
    // Same unit as the divisor (working days for a "Company working days" payroll) — see resolveNonWorkingPayDays.
    nonWorkingDeductionDays = resolveNonWorkingPayDays({ calendarDeductionDays: nonWorkingDeductionDays, cycleStart, cycleEnd, perDayDivisor, payrollSettings: organizationSettings?.payrollSettings, doj, lastWorkingDay, payrollStartsFrom });
    // Joiner/leaver days are charged at the full month's rate — the recorded earnings are
    // already reduced when Loss of Pay applies, so its grossBeforeLop is used instead.
    const grossEarnings = (salaryRecord.lossOfPay?.days || 0) > 0
      ? salaryRecord.lossOfPay.grossBeforeLop
      : (si.basicPay || 0) + (si.hraAmount || 0) + (si.daAmount || 0) + (si.other || 0);
    const netGross = grossEarnings - (si.deductionAmount || 0);
    const perDayRate = perDayDivisor > 0 ? netGross / perDayDivisor : 0;
    // Records with prorated earnings already exclude these days — no separate deduction.
    const nonWorkingDaysDeduction = isEarningsProrated ? 0 : Math.round(perDayRate * nonWorkingDeductionDays * 100) / 100;

    // ---- Build salary component rows (earnings) ----
    const salaryComponents = [];
    if (si.basicPay > 0) salaryComponents.push({ componentName: 'Basic Pay', calculatedAmount: si.basicPay });
    if (si.increamentAmount > 0) salaryComponents.push({ componentName: 'Increment', calculatedAmount: si.increamentAmount });
    if (si.hraAmount > 0) salaryComponents.push({ componentName: 'House Rent Allowance', calculatedAmount: si.hraAmount });
    if (si.daAmount > 0) salaryComponents.push({ componentName: 'Dearness Allowance', calculatedAmount: si.daAmount });
    // Same live-structure split the Salary Profile page uses (splitLumpSumAcrossLiveComponents,
    // defined below) — keeps the PDF's per-component breakdown in exact agreement with what
    // that page shows for this month, rather than a single combined "Other Allowance" row.
    if (breakdown && si.other > 0) {
      const otherLiveEarnings = breakdown.earnings.filter(
        e => !['Basic Salary', 'House Rent Allowance', 'Dearness Allowance'].includes(e.componentName)
      );
      splitLumpSumAcrossLiveComponents(otherLiveEarnings, si.other, salaryProfileEarningBadge).forEach(row => {
        salaryComponents.push({ componentName: row.componentName, calculatedAmount: row.amount });
      });
    } else if (si.other > 0) {
      salaryComponents.push({ componentName: 'Other Allowance', calculatedAmount: si.other });
    }
    if (salaryRecord.totalBonus > 0) salaryComponents.push({ componentName: 'Bonus', calculatedAmount: salaryRecord.totalBonus });
    if (salaryRecord.totalIncentive > 0) salaryComponents.push({ componentName: 'Incentives', calculatedAmount: salaryRecord.totalIncentive });
    if (salaryRecord.totalOvertime > 0) salaryComponents.push({ componentName: 'Overtime Allowance', calculatedAmount: salaryRecord.totalOvertime });
    if (salaryRecord.totalReimbursement > 0) salaryComponents.push({ componentName: 'Reimbursement', calculatedAmount: salaryRecord.totalReimbursement });
    if (salaryRecord.totalArrears > 0) {
      salaryComponents.push({ componentName: 'Arrears', calculatedAmount: salaryRecord.totalArrears });
    }

    // ---- Build deduction component rows ----
    const deductionComponents = [];
    if (si.epfAmount > 0) deductionComponents.push({ deductionName: 'Provident Fund (PF)', calculatedAmount: si.epfAmount });
    if (si.esiAmount > 0) deductionComponents.push({ deductionName: 'ESI', calculatedAmount: si.esiAmount });
    if (si.lwfAmount > 0) deductionComponents.push({ deductionName: 'LWF', calculatedAmount: si.lwfAmount });

    const otherDeductionAmount = (si.deductionAmount || 0) - (si.epfAmount || 0) - (si.esiAmount || 0) - (si.lwfAmount || 0);
    if (breakdown && otherDeductionAmount > 0) {
      const otherLiveDeductions = breakdown.deductions.filter(
        d => d.deductionName !== 'Provident Fund (PF)' && d.deductionName !== 'ESI'
      );
      splitLumpSumAcrossLiveComponents(
        otherLiveDeductions,
        otherDeductionAmount,
        d => salaryProfileDeductionBadge(d, breakdown.employerPf.pfWage, breakdown.basicSalary)
      ).forEach(row => {
        deductionComponents.push({ deductionName: row.componentName, calculatedAmount: row.amount });
      });
    } else if (otherDeductionAmount > 0) {
      deductionComponents.push({ deductionName: 'Other Deductions', calculatedAmount: otherDeductionAmount });
    }

    if (salaryRecord.leaveDeduction > 0) deductionComponents.push({ deductionName: 'Loss of Pay / Unpaid Leave', calculatedAmount: salaryRecord.leaveDeduction });
    if (nonWorkingDaysDeduction > 0) deductionComponents.push({ deductionName: 'Non-Working Days Deduction', calculatedAmount: nonWorkingDaysDeduction });
    oneTimeDeductionRows.forEach(d => {
      deductionComponents.push({ deductionName: d.label, note: d.note, calculatedAmount: d.amount });
    });
    if (si.tdsAmount > 0) deductionComponents.push({ deductionName: 'Income Tax (TDS)', calculatedAmount: si.tdsAmount });

    // ---- Totals ----
    const grossSalary = salaryComponents.reduce((sum, c) => sum + (c.calculatedAmount || 0), 0);
    const totalDeductions = deductionComponents.reduce((sum, d) => sum + (d.calculatedAmount || 0), 0);
    // salaryRecord.totalPayable is itself stale for a not-yet-locked-in month, same reason
    // si.* is refreshed above — re-derive it from the already-refreshed totals instead.
    // Net pay is rounded once, to the nearest rupee — same as the payroll run.
    const netSalary = isLockedIn ? (Number(salaryRecord.totalPayable) || 0) : Math.round(grossSalary - totalDeductions);

    return {
      employee,
      month,
      year,
      salaryComponents,
      deductionComponents,
      grossSalary,
      totalDeductions,
      netSalary,
      leaveDetails: { leaveCount: salaryRecord.leaveCount || 0, leaveDeduction: salaryRecord.leaveDeduction || 0 },
      payDays: salaryRecord.payDays || null,
      lossOfPay: salaryRecord.lossOfPay || null,
      organizationSettings
    };
};


exports.findOneSalaryForReprocessing = async (params) => {
    const { corporateUserID, employeeId, year, month, cycleStart, cycleEnd } = params
    try {
        const employeeSalary = await Salary.findOne({
            corporateUser: corporateUserID,
            employee: new ObjectId(employeeId),
            year: year,
            month: month,
            salaryCycleStart: cycleStart,
            salaryCycleEnd: cycleEnd
        });
        return employeeSalary
    } catch (error) {
        return error
    }
}
exports.updateEmailSent = async (params) => {
    try {
        const { corporateUserID, employeeId,month, year } = params
        const salary = await Salary.updateOne(
            {
              corporateUser: corporateUserID,
              employee: new mongoose.Types.ObjectId(employeeId),
              year: year,
              month: month
            },
            { $set: { paySlipEmailSent: true } })

        return salary
    } catch (error) {
        return error
    }
}

exports.approveSalary = async (params) => {
    try {
        const { payingDate, paymentStatus, corporateUserID, month, year } = params;

        const existingSalaries = await Salary.find({
            corporateUser: corporateUserID,
            month,
            year,
            paymentStatus: { $in: ['PAID', 'APPROVED'] }
        });

        if (existingSalaries.length > 0) {
            return { success: false, message: 'Salaries for this month and year are already approved.' };
        }
        const isUpcoming = await Salary.find({
            corporateUser: corporateUserID,
            month,
            year,
            paymentStatus: 'UPCOMING'
        });

        if (isUpcoming.length > 0) {
            return { success: false, message: 'You cannot approve upcoming months salaries.' };
        }

        const salary = await Salary.updateMany(
            {
                corporateUser: corporateUserID,
                month,
                year
            },
            { payingDate, paymentStatus })

        // Only genuinely settled now — safe to consume any arrears riding on these
        // salaries. Deliberately NOT done inside processEmpSalary itself (services/
        // salary.js), which only ever produces UPCOMING/PENDING and can re-run many times
        // before a month is actually approved — marking arrears paid there fires on every
        // routine preview recompute, well before any real disbursement.
        const settledSalaries = await Salary.find({ corporateUser: corporateUserID, month, year });
        await markArrearsAsPaid(settledSalaries.flatMap(s => s.arrears || []));

        return salary
    } catch (error) {
        return error
    }
}

// exports.getSalaryDetails = async (params) => {
//     try {
//         const { page, limit, searchText, cycleStart, cycleEnd, corporateUserID } = params;
       
//         // const cycleDays = getDaysDifference(cycleStart, cycleEnd)
//         // Calculate the skip value based on the page and limit
//         const skip = (page - 1) * limit;

     
//         // Aggregation pipeline for searching across collections
//         const aggregationPipeline = [
//             {
//                 $match: {
//                     corporateUser: corporateUserID,
//                     $and: [
//                         { salaryCycleStart: { $gte: new Date(cycleStart) } },
//                         { salaryCycleEnd: { $lte: new Date(cycleEnd) } }
//                     ]
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'employees1', // Replace 'employees' with your actual Employee collection name
//                     localField: 'employee',
//                     foreignField: '_id',
//                     as: 'employee'
//                 }
//             },
//             {
//                 $unwind: '$employee'
//             },
//             {
//                 $lookup: {
//                     from: 'departments', // Replace 'departments' with your actual department collection name
//                     let: { departmentId: '$employee.employeeInformation.department' },
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: { $eq: ['$_id', '$$departmentId'] }
//                             }
//                         },
//                         {
//                             $project: {
//                                 _id: 1,
//                                 departmentName: 1
//                             }
//                         }
//                     ],
//                     as: 'department'
//                 }
//             },
//             // Unwind the 'department' array if needed
//             {
//                 $unwind: '$department'
//             },
//             {
//                 $addFields: {
//                     'others': {
//                         $sum: [
//                             '$totalIncentive',
//                             '$totalBonus',
//                             '$totalOvertime'
//                         ]
//                     },
//                     'monthlySalary': {
//                         $sum: [
//                             '$salaryInformation.basicPay',
//                             '$salaryInformation.travelAllowances',
//                             '$salaryInformation.homeAllowances',
//                             '$salaryInformation.medicalAllowances',
//                             '$salaryInformation.otherAllowances',
//                             '$salaryInformation.other'
//                         ]
//                     }
//                 }
//             }
//         ];
//         // Projecting and transforming fields
//         aggregationPipeline.push(
//             {
//                 $addFields: {
//                     'employee.id': '$employee._id',
//                     'employee._id': '$$REMOVE',
//                     'employee.updatedAt': '$$REMOVE',
//                     'employee.createdAt': '$$REMOVE',
//                     'employee.salaryInformation': '$$REMOVE',
//                     'employee.bankDetails': '$$REMOVE',
//                     'employee.employeeDocuments': '$$REMOVE',
//                     'employee.workSchedule': '$$REMOVE',
//                     'employee.__v': '$$REMOVE',
//                     'id': '$_id',
//                     '_id': '$$REMOVE',
//                     '__v': '$$REMOVE',
//                     'overtime': '$$REMOVE',
//                     'bonus': '$$REMOVE',
//                     'incentives': '$$REMOVE',
//                     'otherDeductions': '$$REMOVE',
//                     'updatedAt': '$$REMOVE',
//                     'createdAt': '$$REMOVE',

//                 }
//             }
//         );

//         // Add $match condition for searchText if provided
//         // Add $match condition for searchText if provided
//         if (searchText) {
//             aggregationPipeline.push({
//                 $match: {
//                     $or: [
//                         { 'employee.fullName': { $regex: `^${searchText}`, $options: 'i' } },
//                         { 'employee.employeeInformation.employeeId': { $regex: `^${searchText}`, $options: 'i' } },
//                         { 'employee.employeeInformation.designation': { $regex: `^${searchText}`, $options: 'i' } }
//                     ]
//                 }
//             });
//         }


//         // Group stage to compute total count without pagination
//         const countPipeline = [...aggregationPipeline];
//         countPipeline.push(
//             {
//                 $group: {
//                     _id: null,
//                     count: { $sum: 1 }
//                 }
//             }
//         );
//         console.log(JSON.stringify(aggregationPipeline,4,undefined))
//         let totalSalaryData = await Salary.aggregate(aggregationPipeline);
//         const totalPayableSum = totalSalaryData.reduce((total, item) => total + item.totalPayable, 0);

//         const [totalCountResult] = await Salary.aggregate(countPipeline);

//         const totalCount = totalCountResult ? totalCountResult.count : 0;

//         aggregationPipeline.push(
//             {
//                 $skip: skip
//             },
//             {
//                 $limit: limit
//             }
//         );

//         const salaryDetails = await Salary.aggregate(aggregationPipeline);
//         const cycleDays = getDaysDifference(cycleStart, cycleEnd)
//         return {
//             count: totalCount,
//             salaryCycle: { salaryCycleStart: cycleStart, salaryCycleEnd: cycleEnd, salaryCycleDays: cycleDays },
//             totalPayableSum: totalPayableSum || 'N/A',
//             rows: salaryDetails,
//         };
//     } catch (error) {
//         console.log("errorrrrr",error)
//         return error;
//     }
// };

//salary-details for excel data
  exports.getSalaryDetails = async (params) => {
    try {
      const { page, limit, searchText, cycleStart, cycleEnd, corporateUserID, noOfWorkingDays, paymentStatuses, requireBeneficiaryAdded } = params;

      const skip = (page - 1) * limit;

      const employeeCollection = Employee.collection.collectionName;
      const bankDetailsCollection = BankDetails.collection.collectionName;

      const initialMatch = {
        corporateUser: corporateUserID,
        salaryCycleStart: { $gte: new Date(cycleStart) },
        salaryCycleEnd: { $lte: new Date(cycleEnd) },
        ...(Array.isArray(paymentStatuses) && paymentStatuses.length
          ? { paymentStatus: { $in: paymentStatuses } }
          : {}),
      };

      // ---- MAIN AGGREGATION PIPELINE ----
      const aggregationPipeline = [
        { $match: initialMatch },

        // ✅ FIX 1: Handle employee as string OR ObjectId
        {
          $addFields: {
            employeeObjId: {
              $cond: [
                { $eq: [{ $type: "$employee" }, "string"] },
                { $toObjectId: "$employee" },
                "$employee"
              ]
            }
          }
        },

        {
          $lookup: {
            from: employeeCollection,
            localField: "employeeObjId",
            foreignField: "_id",
            as: "employee"
          }
        },
        {
          $lookup: {
            from: bankDetailsCollection,
            localField: "employeeObjId",
            foreignField: "employeeId",
            as: "bankDetails"
          }
        },

        // Only keep salaries whose employee has at least one bank account with beneficiaryStatus === 'Added'
        ...(requireBeneficiaryAdded
          ? [{ $match: { bankDetails: { $elemMatch: { beneficiaryStatus: 'Added' } } } }]
          : []),

        // ✅ FIX 2: Do NOT drop salary if employee is missing
        {
          $unwind: {
            path: "$employee",
            preserveNullAndEmptyArrays: true
          }
        },

        {
          $lookup: {
            from: "departments",
            let: { departmentId: "$employee.employeeInformation.department" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $ne: ["$$departmentId", null] },   // ✅ FIX 3
                      { $eq: ["$_id", "$$departmentId"] }
                    ]
                  }
                }
              },
              {
                $project: {
                  _id: 1,
                  departmentName: 1
                }
              }
            ],
            as: "department"
          }
        },

        // ✅ FIX 4: Do NOT drop salary if department is missing
        {
          $unwind: {
            path: "$department",
            preserveNullAndEmptyArrays: true
          }
        },

        {
          $addFields: {
            others: {
              $sum: [
                "$totalIncentive",
                "$totalBonus",
                "$totalOvertime"
              ]
            },
            monthlySalary: {
              $sum: [
                "$salaryInformation.basicPay",
                "$salaryInformation.increamentAmount",
                "$salaryInformation.hraAmount",
                "$salaryInformation.daAmount",
                "$salaryInformation.other"
              ]
            }
          }
        },

        // ---- CLEANUP FIELDS ----
        {
          $addFields: {
            "employee.id": "$employee._id",
            "employee._id": "$$REMOVE",
            "employee.updatedAt": "$$REMOVE",
            "employee.createdAt": "$$REMOVE",
            "employee.salaryInformation": "$$REMOVE",
            "employee.employeeDocuments": "$$REMOVE",
            "employee.workSchedule": "$$REMOVE",
            "employee.__v": "$$REMOVE",

            id: "$_id",
            "_id": "$$REMOVE",
            "__v": "$$REMOVE",
            overtime: "$$REMOVE",
            bonus: "$$REMOVE",
            incentives: "$$REMOVE",
            otherDeductions: "$$REMOVE",
            updatedAt: "$$REMOVE",
            createdAt: "$$REMOVE"
          }
        }
      ];

      // ---- SEARCH FILTER (optional) ----
      if (searchText) {
        aggregationPipeline.push({
          $match: {
            $or: [
              { "employee.personalInformation.fullName": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } },
              { "employee.employeeInformation.employeeId": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } },
              { "employee.employeeInformation.designation": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } }
            ]
          }
        });
      }

      // ---- ALL MATCHING ROWS (one pass: total payable, count and page all come from it) ----
      const totalSalaryData = await Salary.aggregate(aggregationPipeline);
        const totalPayableSum = totalSalaryData.reduce(
            (total, item) => total + (Number(item.totalPayable) || 0),
            0
        );


      // ---- TOTAL COUNT ----
      const totalCount = totalSalaryData.length;

      // ---- PAGED DATA ----
      const salaryDetails = totalSalaryData.slice(skip, skip + limit);

      // ---- SALARY CYCLE DAYS ----
      const cycleDays = getDaysDifference(cycleStart, cycleEnd);

      return {
        count: totalCount,
        salaryCycle: {
          salaryCycleStart: cycleStart,
          salaryCycleEnd: cycleEnd,
          salaryCycleDays: cycleDays,
          workingDays:noOfWorkingDays
        },
        totalPayableSum: totalPayableSum || "N/A",
        rows: salaryDetails
      };

    } catch (error) {
      console.error("Error in getSalaryDetails:", error);
      return error;
    }
  };


// exports.getExcelSalaryDetails = async (params) => {
//     try {
//         const { cycleStart, cycleEnd, corporateUserID } = params;

//         // Construct the query conditions for search
//         const queryConditions = {
//             corporateUser: corporateUserID,
//             $and: [
//                 { salaryCycleStart: { $gte: new Date(cycleStart) } },
//                 { salaryCycleEnd: { $lte: new Date(cycleEnd) } }
//             ]
//         };

//         const salaryDetails = await Salary.find(queryConditions)
//             .populate({
//                 path: 'employee',
//                 match: {
//                     isEmployeeDeleted: false,
//                     'employeeInformation.status': { $in: ['ACTIVE', 'LEAVE'] }
//                 },
//                 select: 'fullName salaryInformation employeeInformation personalEmail bankDetails', // Specify the fields you want to populate
//                 populate: {
//                     path: 'employeeInformation.department',
//                     model: 'Department',
//                     select: 'departmentName'
//                 }
//             })
//             .exec();

//         return salaryDetails;
//     } catch (error) {
//         return error;
//     }
// };


exports.isSalaryProcessedForMonthYearCorporateUser = async (month, year, corporateUserId) => {
    try {
        const salary = await Salary.findOne({
            corporateUser: corporateUserId,
            month: month,
            year: year,
        });

        return salary; // Returns true if a salary record is found, indicating it has been processed
    } catch (error) {
        console.error('Error checking salary:', error);
        return false; // Return false in case of an error or if no record is found
    }
}

exports.getAllSalariesByEmployeeIdAndCorporateUserId = async (params) => {
    try {
        const { corporateUserID, employeeId, page, limit, column, order, year } = params;
        const skip = (page - 1) * limit;

        const queryConditions = {
            employee: employeeId,
            corporateUser: corporateUserID,
        };

        if (year) {
            queryConditions.year = parseInt(year);
        }

        const sortableColumns = ["salaryCycleEnd"];
        const sortField = sortableColumns[column] || "salaryCycleEnd";
        const salaries = await Salary.find(queryConditions)
            .sort({ [sortField]: order })
            .skip(skip)
            .limit(limit)
            .exec();

        const totalCount = await Salary.countDocuments(queryConditions);
        const totalEmailed = await Salary.countDocuments({ ...queryConditions, paySlipEmailSent: true });

        return {
            count: totalCount,
            rows: salaries,
            totalEmailed: totalEmailed
        };
    } catch (error) {
        console.error('Error fetching salaries:', error);
        return error;
    }
}


exports.findApprovedSalaries = async (month, year, corporateUser) => {
    try {
        console.log("month and year",month,year)
        // Find any record with the given month and year and either APPROVED or PAID status
        const salaryRecord = await Salary.findOne({
            corporateUser,
            month,
            year,
            paymentStatus: { $in: ['APPROVED', 'PAID'] }
        });

        if (!salaryRecord || salaryRecord === null) {
            return { status: true, message: 'Success' };
        }

        console.log("salary record !!!!! ",salaryRecord)

        if (salaryRecord?.paymentStatus === 'APPROVED') {
            return { status: false, message: 'The salary for this month is already approved' };
        } else if (salaryRecord.paymentStatus === 'PAID') {
            return { status: false, message: 'The salary for this month is already paid' };
        }

        return { status: true, message: 'Success' };
    } catch (error) {
        console.error('Error checking salary:', error);
        return { status: false, message: 'Something went wrong..' };
    }
}

exports.getSalaryInfo = async (corporateUserID, month, year,cycleStart, cycleEnd) => {
    try {
        const payrollDetails = await HrSettings.findOne({ corporateUser: corporateUserID })
            .select('payrollSettings.organizationWorkingDays payrollSettings.payrollStartsFrom payrollSettings.salaryCycleDay');

        const organizationWorkingDays = payrollDetails?.payrollSettings?.organizationWorkingDays || 0;
        const payrollStartsFrom = payrollDetails?.payrollSettings?.payrollStartsFrom || '';


        // A month can be "mixed" once a late-added employee (DOJ backfilled into an
        // already-approved/paid month) picks up their own PENDING doc alongside everyone
        // else's PAID ones — reading a single arbitrary doc's status (the old behavior)
        // could report PAID/APPROVED and block the Approve action even though this
        // employee still needs approving. Report PENDING whenever ANY doc for this month
        // still needs it; otherwise fall back to the (uniform, in every other case) status
        // of the month's docs, unchanged from before.
        const salaryDocsForMonth = await Salary.find({
            corporateUser: corporateUserID,
            month: Number(month),
            year: Number(year)
        }).select('paymentStatus payingDate').lean();

        const pendingDocs = salaryDocsForMonth.filter(doc => doc.paymentStatus === 'PENDING');
        const approvedDocs = salaryDocsForMonth.filter(doc => doc.paymentStatus === 'APPROVED');
        const hasPending = pendingDocs.length > 0;
        const hasApproved = approvedDocs.length > 0;
        const hasPaid = salaryDocsForMonth.some(doc => doc.paymentStatus === 'PAID');
        // Three different kinds of "mixed" month need distinct responses:
        //  - Some employees already PAID (real money has moved) alongside a still-PENDING
        //    one — e.g. a late-added employee back-filled into an already-paid month —
        //    needs explicit review: PARTIALLY_PAID, settled only via "Mark as Paid".
        //  - Some employees already APPROVED but nothing PAID yet, alongside a still-
        //    PENDING one — nothing risky has happened yet, so this is safe to treat as
        //    plain PENDING: "Run Payroll" just approves the straggler(s) directly, the
        //    same one-click behavior as a brand-new all-PENDING month.
        //  - Nothing PENDING anymore, but some employees are APPROVED (not yet paid)
        //    alongside others already PAID — e.g. the late-added employee above just got
        //    approved by "Run Payroll" — still needs the same PARTIALLY_PAID review/"Mark
        //    as Paid" treatment, now scoped to the APPROVED (not PENDING) docs. Without
        //    this branch the status fell back to an arbitrary doc's status, which could
        //    resolve to 'PAID' and incorrectly widen the employee list back to everyone.
        const outstandingStatus = hasPending ? 'PENDING' : (hasApproved && hasPaid ? 'APPROVED' : null);
        const outstandingDocs = outstandingStatus === 'PENDING' ? pendingDocs : (outstandingStatus === 'APPROVED' ? approvedDocs : []);
        const paymentStatus = outstandingStatus
            ? (hasPaid ? 'PARTIALLY_PAID' : outstandingStatus)
            : (salaryDocsForMonth[0]?.paymentStatus || 'N/A');
        const payingDate = salaryDocsForMonth.find(doc => doc.paymentStatus === 'PAID')?.payingDate
            || salaryDocsForMonth[0]?.payingDate
            || '';

        // While there's still outstanding (pending/approved-not-paid) work this month, the
        // summary (employee count, deductions, payable total) reflects ONLY those
        // employees — this is what's actually about to be approved/paid, so an
        // already-settled employee's amount never gets re-summed into it. Once nothing is
        // outstanding, fall back to the month's full totals (unchanged from before), since
        // that's a plain read-only summary of an already-finished month.
        const matchStage = {
            year: Number(year),
            month: Number(month),
            corporateUser: corporateUserID,
            ...(outstandingStatus ? { paymentStatus: outstandingStatus } : {}),
        };

        const noOfEmployees = outstandingStatus
            ? outstandingDocs.length
            : await Salary.countDocuments({ corporateUser: corporateUserID, salaryCycleStart: cycleStart, salaryCycleEnd: cycleEnd });
        // Only meaningfully different from noOfEmployees for a PARTIALLY_PAID month — lets
        // the UI show "1 (of 24)" instead of just "1".
        const totalEmployeesInMonth = salaryDocsForMonth.length;

        const total = await Salary.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalOtherDeduction: {
                        $sum: { $add: ["$totalOtherDeduction", "$leaveDeduction"] }
                    },
                    totalPayable: {
                        $sum: "$totalPayable"
                    }
                }
            }
        ]);

        const totalDeduction = total.length > 0 ? total[0].totalOtherDeduction : 0;
        const totalPayable = total.length > 0 ? total[0].totalPayable : 0;

        return {
            organizationWorkingDays,
            payrollStartsFrom,
            month,
            noOfEmployees,
            totalEmployeesInMonth,
            totalDeduction,
            totalPayable,
            paymentStatus,
            payingDate,
            // Lets the frontend tell apart the two flavors of PARTIALLY_PAID: 'PENDING'
            // means there's still something to approve (safe to auto-approve on "Run
            // Payroll", same as a plain-PENDING month), 'APPROVED' means the outstanding
            // employee(s) are already approved and just awaiting "Mark as Paid" — nothing
            // to auto-approve. null means nothing is outstanding at all.
            outstandingStatus
        };
    } catch (error) {
        console.log(error);
        return error;
    }
};


const dayMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

exports.getSalaryCycleDay = async (corporateUserId) => {
    const settings = await OrganizationSettings.findOne({ corporateUser: corporateUserId });

    if (!settings) {
      return false
      // throw new Error("Complete your onboarding");
    }

    const payroll = settings.payrollSettings || {};

    const workingDays = payroll.selectWorkingDays || [];
    const payEmployeeOn = payroll.payEmployeeOn;
    const payrollFrom = payroll.payrollFrom;
    const salaryCycleDay = payroll.salaryCycleDay || 1;

    if (!payEmployeeOn) {
      throw new Error("payEmployeeOn missing");
    }

    // Validate working days
    if (!Array.isArray(workingDays) || workingDays.length === 0) {
      throw new Error("selectWorkingDays is empty or invalid");
    }

    let targetDay;

    // If payEmployeeOn is a full date (YYYY-MM-DD)
    if (payEmployeeOn.includes("-")) {
      const parsed = new Date(payEmployeeOn);
      if (isNaN(parsed.getTime())) {
        throw new Error("Invalid date in payEmployeeOn: " + payEmployeeOn);
      }
      targetDay = parsed.getDate();  // Extract only the day number
    } else {
      targetDay = Number(payEmployeeOn);
    }

    if (!targetDay || isNaN(targetDay) || targetDay < 1 || targetDay > 31) {
      throw new Error("Invalid payEmployeeOn value: " + payEmployeeOn);
    }

    // Create date for CURRENT month using extracted day
    const today = new Date();
    let date = new Date(today.getFullYear(), today.getMonth(), targetDay);

    if (isNaN(date.getTime())) {
      throw new Error("Invalid initial date created from targetDay");
    }

    // Adjust backward to a valid working day
    let safety = 0;

    while (!workingDays.includes(dayMap[date.getDay()])) {
      date.setDate(date.getDate() - 1);

      if (isNaN(date.getTime())) {
        throw new Error("Date became invalid during adjustment");
      }

      safety++;
      if (safety > 31) {
        throw new Error("No working day found within 31 days. Check workingDays.");
      }
    }
    return {
      salaryCycleDay: salaryCycleDay,
      salaryCycleDate: date,
      payrollStartsFrom:payrollFrom,
      workingDays:workingDays,
    };
};


  exports.getExcelSalaryDetails = async (params) => {
  try {
    const { cycleStart, cycleEnd, corporateUserID } = params;

    const aggregationPipeline = [
      // ---- MATCH SALARY CYCLE ----
      {
        $match: {
          corporateUser: corporateUserID,
          salaryCycleStart: { $gte: new Date(cycleStart) },
          salaryCycleEnd: { $lte: new Date(cycleEnd) }
        }
      },

      // ---- HANDLE employee STRING / ObjectId ----
      {
        $addFields: {
          employeeObjId: {
            $cond: [
              { $eq: [{ $type: "$employee" }, "string"] },
              { $toObjectId: "$employee" },
              "$employee"
            ]
          }
        }
      },

      // ---- LOOKUP EMPLOYEE ----
      {
        $lookup: {
          from: "employee",
          localField: "employeeObjId",
          foreignField: "_id",
          as: "employee"
        }
      },

      // ---- DO NOT DROP SALARY IF EMPLOYEE MISSING ----
      {
        $unwind: {
          path: "$employee",
          preserveNullAndEmptyArrays: true
        }
      },

      // ---- LOOKUP DEPARTMENT ----
      {
        $lookup: {
          from: "departments",
          let: { departmentId: "$employee.employeeInformation.department" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ["$$departmentId", null] },
                    { $eq: ["$_id", "$$departmentId"] }
                  ]
                }
              }
            },
            {
              $project: {
                _id: 1,
                departmentName: 1
              }
            }
          ],
          as: "department"
        }
      },

      // ---- DO NOT DROP SALARY IF DEPARTMENT MISSING ----
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true
        }
      },

      // ---- CALCULATED FIELDS ----
      {
        $addFields: {
          others: {
            $sum: [
              { $ifNull: ["$totalIncentive", 0] },
              { $ifNull: ["$totalBonus", 0] },
              { $ifNull: ["$totalOvertime", 0] }
            ]
          },
          monthlySalary: {
            $sum: [
              { $ifNull: ["$salaryInformation.basicPay", 0] },
              { $ifNull: ["$salaryInformation.increamentAmount", 0] },
              { $ifNull: ["$salaryInformation.hraAmount", 0] },
              { $ifNull: ["$salaryInformation.daAmount", 0] },
              { $ifNull: ["$salaryInformation.other", 0] }
            ]
          }
        }
      },

      // ---- CLEANUP FOR EXCEL ----
      {
        $addFields: {
          "employee.id": "$employee._id",
          "employee._id": "$$REMOVE",
          "employee.updatedAt": "$$REMOVE",
          "employee.createdAt": "$$REMOVE",
          "employee.salaryInformation": "$$REMOVE",
          "employee.bankDetails": "$$REMOVE",
          "employee.employeeDocuments": "$$REMOVE",
          "employee.workSchedule": "$$REMOVE",
          "employee.__v": "$$REMOVE",

          id: "$_id",
          "_id": "$$REMOVE",
          "__v": "$$REMOVE",
          overtime: "$$REMOVE",
          bonus: "$$REMOVE",
          incentives: "$$REMOVE",
          otherDeductions: "$$REMOVE",
          updatedAt: "$$REMOVE",
          createdAt: "$$REMOVE"
        }
      }
    ];

    // ---- FETCH ALL DATA (NO PAGINATION) ----
    const salaryDetails = await Salary.aggregate(aggregationPipeline);

    return salaryDetails;

  } catch (error) {
    console.error("Error in getExcelSalaryDetails:", error);
    return error;
  }
};


exports.findApprovedSalariesForEmp = async (month, year, corporateUser) => {
    try {
        const salaryRecord = await Salary.findOne({
            corporateUser,
            month,
            year,
            paymentStatus: { $in: ['APPROVED', 'PAID'] }
        });

        if (!salaryRecord) {
            return { status: true, message: 'Success' };
        }

        if (salaryRecord.paymentStatus === 'APPROVED') {
            return {
                status: false,
                message: 'The salary for this month is already approved'
            };
        }

        if (salaryRecord.paymentStatus === 'PAID') {
            return {
                status: false,
                message: 'The salary for this month is already paid'
            };
        }

        return { status: true, message: 'Success' };
    } catch (error) {
        console.error('Error checking salary:', error);
        return { status: false, message: 'Something went wrong..' };
    }
}

exports.checkSalaryDetailsForEmployee = async (params) => {
    try {
      const {corporateUserID, employeeId, month, year}= params
        const salaryRecord = await Salary.findOne({
            corporateUser:corporateUserID,
            employee:new ObjectId(employeeId),
            month,
            year,
        });

        if (!salaryRecord) {
            return { status: false, message: 'Salary is not processed for this month' };
        }
        // A payslip is a record of what was actually paid — a PENDING/APPROVED/UPCOMING/
        // INITIATED/FAILD record (e.g. the current month, still mid-cycle) has no real
        // payout to document yet, so generating one would misrepresent an amount that
        // hasn't actually gone out.
        if (salaryRecord.paymentStatus !== 'PAID') {
            return {
                status: false,
                message: 'The salary for this month has not been marked as paid. The payslip cannot be generated.',
            };
        }
        return { status: true, message: 'Salary information retrieved successfully' };
    } catch (error) {
        console.error('Error checkSalaryDetailsForEmployee:', error);
        return { status: false, message: 'Something went wrong..' };
    }
}
const getMonthRange = (month, year) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    return { startDate, endDate };
};

exports.empApproveSalary = async (params) => {
    try {
        const { payingDate, paymentStatus, corporateUserID, month, year } = params;
        const { startDate, endDate } = getMonthRange(month, year);

        // Only ever acts on docs still PENDING — a month can be "mixed" once a late-added
        // employee (DOJ backfilled into an already-approved/paid month) picks up their own
        // PENDING doc alongside everyone else's PAID ones. Scoping both the read and the
        // update to these specific ids (never a blanket month-wide filter) guarantees an
        // already-settled employee's status/payingDate and arrears are never re-touched.
        const pendingSalaries = await Salary.find({
            corporateUser: corporateUserID,
            month: Number(month),
            year: Number(year),
            paymentStatus: 'PENDING'
        });

        if (pendingSalaries.length === 0) {
            return { success: true, alreadyPaid: true, message: 'Salaries for this month and year are already paid.' };
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const isUpcomingMonth = year > currentYear || (year === currentYear && month >= currentMonth);

        if (isUpcomingMonth) {
            return { success: false, message: 'You cannot approve upcoming months salaries.' };
        }

        const pendingIds = pendingSalaries.map(s => s._id);

        await Salary.updateMany(
            { _id: { $in: pendingIds } },
            { payingDate, paymentStatus })

        // Only genuinely settled now — see approveSalary's identical comment for why this
        // can't live inside processEmpSalary itself. Re-fetched by the same ids captured
        // above, so this only ever processes arrears for employees this call just settled.
        const settledSalaries = await Salary.find({ _id: { $in: pendingIds } });
        await markArrearsAsPaid(settledSalaries.flatMap(s => s.arrears || []));
      // -------------------------------
      // 2. Update Incentives (By Date)
      // -------------------------------
      await Incentives.updateMany(
        {
          corporateUser: corporateUserID,
          paymentStatus: 'UNPAID',
          incentiveDate: {
            $gte: startDate,
            $lt: endDate
          }
        },
        {
          paymentStatus: 'PAID'
        });  
        // -------------------------------
        // 3. Update Bonus
        // -------------------------------
        await Bonus.updateMany(
            {
                corporateUser: corporateUserID,
                paymentStatus: 'UNPAID',
                bonusDate: {
                    $gte: startDate,
                    $lt: endDate
                }
            },
            {
                paymentStatus: 'PAID'
            }
        );

        // -------------------------------
        // 4. Update Reimbursement
        // -------------------------------
        await Reimbursement.updateMany(
            {
                corporateUser: corporateUserID,
                paymentStatus: { $in: ['UNPAID', 'APPROVED'] },
                transferMethod: 'SALARY',
                expenseDate: {
                    $gte: startDate,
                    $lt: endDate
                }
            },
            {
                paymentStatus: 'PAID'
            }
        );

        // -------------------------------
        // 5. Update Overtime (If exists)
        // -------------------------------
        if (Overtime) {
            await Overtime.updateMany(
                {
                    corporateUser: corporateUserID,
                    paymentStatus: 'UNPAID',
                    overtimeDate: {
                        $gte: startDate,
                        $lt: endDate
                    }
                },
                {
                    paymentStatus: 'PAID'
                }
            );
        }
        return {
            success: true,
            message: 'Salary & related payments approved successfully'
        };
        // return salary
    } catch (error) {
       console.error(error);
        return {
            success: false,
            message: 'Approval failed'
        };
    }
}

exports.markSalaryAsPaid = async ({ payingDate, corporateUserID, month, year }) => {
    try {
        const now = new Date();
        const isUpcomingMonth =
            year > now.getFullYear() ||
            (year === now.getFullYear() && month > now.getMonth() + 1);

        if (isUpcomingMonth) {
            return { success: false, message: 'You cannot mark upcoming months salaries as paid.' };
        }

        const paidViaRollout = await Salary.findOne({
            corporateUser: corporateUserID, month: Number(month), year: Number(year), paidViaRollout: true
        });
        if (paidViaRollout) {
            return { success: false, message: 'Salary for this month was processed via Peko Salary Rollout and cannot be marked as paid manually.' };
        }

        // Only ever acts on docs not yet paid (PENDING or APPROVED) — never re-touches an
        // already-PAID employee's payingDate/paidViaRollout. This matters now that a
        // late-added employee's own PENDING salary can be marked paid directly (skipping
        // the APPROVED stage) for a month everyone else already got paid in earlier —
        // scoping by captured ids, not a blanket month-wide filter, guarantees that.
        const unpaidSalaries = await Salary.find({
            corporateUser: corporateUserID, month: Number(month), year: Number(year),
            paymentStatus: { $in: ['PENDING', 'APPROVED'] }
        });

        if (unpaidSalaries.length === 0) {
            return { success: true, alreadyPaid: true, message: 'Salary for this month is already fully paid.' };
        }

        const unpaidIds = unpaidSalaries.map(s => s._id);

        await Salary.updateMany(
            { _id: { $in: unpaidIds } },
            { payingDate, paymentStatus: 'PAID', paidViaRollout: false }
        );

        // Only genuinely settled now — see approveSalary's identical comment for why this
        // can't live inside processEmpSalary itself. Re-fetched by the same ids captured
        // above, so this only ever processes arrears for employees this call just settled.
        const settledSalaries = await Salary.find({ _id: { $in: unpaidIds } });
        await markArrearsAsPaid(settledSalaries.flatMap(s => s.arrears || []));

        return { success: true, message: 'Salary marked as paid successfully' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to mark salary as paid' };
    }
};

exports.revertSalaryToApproved = async ({ corporateUserID, month, year }) => {
    try {
        const rolloutRecord = await Salary.findOne({
            corporateUser: corporateUserID, month, year,
            paymentStatus: 'PAID',
            $or: [{ paidViaRollout: true }, { paidViaRollout: null }],
        });
        if (rolloutRecord) {
            return { success: false, message: 'Cannot revert salary status. Payment was initiated via Peko Salary Rollout.' };
        }

        const paidRecord = await Salary.findOne({
            corporateUser: corporateUserID, month, year, paymentStatus: 'PAID'
        });
        if (!paidRecord) {
            return { success: false, message: 'No paid salaries found for this month to revert.' };
        }

        await Salary.updateMany(
            { corporateUser: corporateUserID, month, year, paymentStatus: 'PAID', paidViaRollout: false },
            { paymentStatus: 'APPROVED' }
        );

        return { success: true, message: 'Salary status reverted to approved successfully' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to revert salary status' };
    }
};

exports.salaryHistoryList = async ({ corporateUserID, year, page = 1, limit = 10 }) => {
  const matchStage = { corporateUser: corporateUserID };
  if (year) matchStage.year = Number(year);

  const skip = (Number(page) - 1) * Number(limit);

  const result = await Salary.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { year: '$year', month: '$month' },
        totalEmployees: { $sum: 1 },
        salariesProcessed: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] }
        },
        totalPayroll: { $sum: '$totalPayable' },
        processedOn: { $max: '$payingDate' },
        paidCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] } },
        failedCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'FAILD'] }, 1, 0] } },
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    {
      $facet: {
        count: [{ $count: 'total' }],
        rows: [{ $skip: skip }, { $limit: Number(limit) }],
      }
    }
  ]);

  const count = result[0]?.count[0]?.total || 0;
  const rows = (result[0]?.rows || []).map(r => {
    let salaryStatus;
    if (r.paidCount === r.totalEmployees) {
      salaryStatus = 'PAID';
    } else if (r.paidCount > 0) {
      salaryStatus = 'PARTIAL';
    } else if (r.failedCount === r.totalEmployees) {
      salaryStatus = 'FAILD';
    } else {
      salaryStatus = 'PENDING';
    }

    return {
      month: r._id.month,
      year: r._id.year,
      totalEmployees: r.totalEmployees,
      salariesProcessed: r.salariesProcessed,
      totalPayroll: r.totalPayroll,
      salaryStatus,
      processedOn: r.processedOn,
    };
  });

  return { count, rows };
};

exports.salaryHistoryDetail = async ({ corporateUserID, month, year, page, limit, search }) => {
  const basePipeline = [
    {
      $match: {
        corporateUser: corporateUserID,
        month: Number(month),
        year: Number(year),
      }
    },
    {
      $addFields: {
        employeeObjId: {
          $cond: [
            { $eq: [{ $type: '$employee' }, 'string'] },
            { $toObjectId: '$employee' },
            '$employee'
          ]
        }
      }
    },
    {
      $lookup: {
        from: Employee.collection.collectionName,
        localField: 'employeeObjId',
        foreignField: '_id',
        as: 'employeeData'
      }
    },
    { $unwind: { path: '$employeeData', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: BankDetails.collection.collectionName,
        let: { empId: '$employeeObjId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$employeeId', '$$empId'] },
                  { $eq: ['$isDefaultAccount', true] }
                ]
              }
            }
          },
          { $limit: 1 }
        ],
        as: 'bankData'
      }
    },
    { $unwind: { path: '$bankData', preserveNullAndEmptyArrays: true } },
  ];

  if (search) {
    basePipeline.push({
      $match: {
        $or: [
          { 'employeeData.personalInformation.fullName': { $regex: escapeSearch(search), $options: 'i' } },
          { 'employeeData.employeeInformation.employeeId': { $regex: escapeSearch(search), $options: 'i' } },
          { 'employeeData.personalInformation.email': { $regex: escapeSearch(search), $options: 'i' } },
        ]
      }
    });
  }

  const [summaryResult, countResult, rows, oneTimePayments] = await Promise.all([
    Salary.aggregate([
      ...basePipeline,
      {
        $group: {
          _id: null,
          totalProcessed: { $sum: '$totalPayable' },
          totalEmployees: { $sum: 1 },
          totalPaid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] } }
        }
      }
    ]),
    Salary.aggregate([...basePipeline, { $count: 'count' }]),
    Salary.aggregate([
      ...basePipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]),
    OneTimePayment.find({
      corporateUser: corporateUserID,
      month: Number(month),
      year: Number(year),
    }).select('employee amount paymentStatus referenceId decentroTxnId remark initiatedAt completedAt failedAt').lean(),
  ]);

  const otpMap = {};
  oneTimePayments.forEach(p => {
    const key = p.employee.toString();
    if (!otpMap[key]) otpMap[key] = [];
    otpMap[key].push({
      amount:        p.amount,
      paymentStatus: p.paymentStatus,
      referenceId:   p.referenceId,
      decentroTxnId: p.decentroTxnId || null,
      remark:        p.remark || null,
      initiatedAt:   p.initiatedAt || null,
      completedAt:   p.completedAt || null,
      failedAt:      p.failedAt || null,
    });
  });

  const summary = summaryResult[0] || { totalProcessed: 0, totalEmployees: 0, totalPaid: 0 };
  const totalCount = countResult[0]?.count || 0;

  const formatAccount = (bd) => {
    if (!bd?.accountNumber) return 'N/A';
    const masked = `XXXX${String(bd.accountNumber).slice(-4)}`;
    return `${bd.bankName || 'N/A'} - ${masked}`;
  };

  return {
    summary: {
      totalProcessed: summary.totalProcessed,
      totalEmployees: summary.totalEmployees,
      totalPaid: summary.totalPaid,
    },
    count: totalCount,
    rows: rows.map(r => {
      const empKey = r.employeeObjId?.toString() || r.employee?.toString();
      return {
        empId: r.employeeData?.employeeInformation?.employeeId || 'N/A',
        name: r.employeeData?.personalInformation?.fullName || 'N/A',
        email: r.employeeData?.personalInformation?.email || 'N/A',
        accountDetail: formatAccount(r.bankData),
        transType: r.bankData?.transactionType || 'N/A',
        grossSalary: (r.salaryInformation?.basicPay || 0) + (r.salaryInformation?.hraAmount || 0) + (r.salaryInformation?.daAmount || 0) + (r.salaryInformation?.other || 0),
        deduction: r.salaryInformation?.deductionAmount || 0,
        netPayable: r.totalPayable || 0,
        paymentStatus: r.paymentStatus || 'N/A',
        remark: r.message || null,
        oneTimePayments: otpMap[empKey] || [],
      };
    }),
  };
};

exports.salaryHistoryDetailAll = async ({ corporateUserID, month, year }) => {
  const basePipeline = [
    {
      $match: {
        corporateUser: corporateUserID,
        month: Number(month),
        year: Number(year),
      }
    },
    {
      $addFields: {
        employeeObjId: {
          $cond: [
            { $eq: [{ $type: '$employee' }, 'string'] },
            { $toObjectId: '$employee' },
            '$employee'
          ]
        }
      }
    },
    {
      $lookup: {
        from: Employee.collection.collectionName,
        localField: 'employeeObjId',
        foreignField: '_id',
        as: 'employeeData'
      }
    },
    { $unwind: { path: '$employeeData', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: BankDetails.collection.collectionName,
        let: { empId: '$employeeObjId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$employeeId', '$$empId'] },
                  { $eq: ['$isDefaultAccount', true] }
                ]
              }
            }
          },
          { $limit: 1 }
        ],
        as: 'bankData'
      }
    },
    { $unwind: { path: '$bankData', preserveNullAndEmptyArrays: true } },
  ];

  const [rows, oneTimePayments] = await Promise.all([
    Salary.aggregate(basePipeline),
    OneTimePayment.find({
      corporateUser: corporateUserID,
      month: Number(month),
      year: Number(year),
    }).select('employee amount paymentStatus referenceId').lean(),
  ]);

  const otpMap = {};
  oneTimePayments.forEach(p => {
    const key = p.employee.toString();
    if (!otpMap[key]) otpMap[key] = [];
    otpMap[key].push({ amount: p.amount, paymentStatus: p.paymentStatus, referenceId: p.referenceId });
  });

  const formatAccount = (bd) => {
    if (!bd?.accountNumber) return 'N/A';
    return `${bd.bankName || 'N/A'} - XXXX${String(bd.accountNumber).slice(-4)}`;
  };

  return rows.map(r => {
    const empKey = r.employeeObjId?.toString() || r.employee?.toString();
    return {
      empId: r.employeeData?.employeeInformation?.employeeId || 'N/A',
      name: r.employeeData?.personalInformation?.fullName || 'N/A',
      email: r.employeeData?.personalInformation?.email || 'N/A',
      accountDetail: formatAccount(r.bankData),
      transType: r.bankData?.transactionType || 'N/A',
      grossSalary: (r.salaryInformation?.basicPay || 0) + (r.salaryInformation?.hraAmount || 0) + (r.salaryInformation?.daAmount || 0) + (r.salaryInformation?.other || 0),
      deduction: r.salaryInformation?.deductionAmount || 0,
      netPayable: r.totalPayable || 0,
      paymentStatus: r.paymentStatus || 'N/A',
      oneTimePayments: otpMap[empKey] || [],
    };
  });
};

exports.calculateWorkingDays = ({ cycleStart, workingDays }) => {
    if (!cycleStart) {
      throw new Error("cycleStart missing");
    }

    if (!Array.isArray(workingDays) || workingDays.length === 0) {
      throw new Error("workingDays is empty or invalid");
    }

    const startDate = new Date(cycleStart);

    const year = startDate.getFullYear();
    const month = startDate.getMonth();

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    let totalWorkingDays = 0;

    for (let d = 1; d <= lastDayOfMonth; d++) {
      const current = new Date(year, month, d);
      const dayName = dayMap[current.getDay()];

      if (workingDays.includes(dayName)) {
        totalWorkingDays++;
      }
    }

    return totalWorkingDays;
};

exports.salaryProfileEmp = async (params) => {
  try {
    const { corporateUserID, employeeId, month, year } = params
    const componentData =
      await getEmployeeSalaryComponentForProcessSalary({
        corporateUserID,
        employeeId,
        month,
        year
      });

    if (!componentData?.salaryComponents?.length) {
      throw new Error("Salary components not available");
    }
    const salaryRecord = await Salary.findOne({
      corporateUser: corporateUserID,
      employee: new ObjectId(employeeId),
      year: year,
      month: month
    }).select("paymentStatus");
    const salaryStatus = salaryRecord?.paymentStatus || "PENDING";
    // ---------------- Month Range ----------------
    const { startDate, endDate } = getMonthRange(month, year);
    let { totalIncentivesPay } = await fetchIncentivesByEmployeeAndCorporateUserProfileSalary(employeeId, corporateUserID, startDate, endDate)
    let { totalBonusPay } = await fetchBonusByEmployeeAndCorporateUserProfileSalary(employeeId, corporateUserID, startDate, endDate)
    let { totalOvertimePay } = await fetchOvertimeByEmployeeAndCorporateUserProfileSalary(employeeId, corporateUserID, startDate, endDate)

    const salaryRows = [];

    // Earnings / Allowances
    componentData.salaryComponents.forEach((item) => {
      salaryRows.push({
        componentName: item.componentName,
        category: "Earnings",
        amount: item.calculatedAmount
      });
    });

    // Bonus
    if (totalBonusPay > 0) {
      salaryRows.push({
        componentName: "Bonus",
        category: "Bonus",
        amount: totalBonusPay
      });
    }

    // Incentives
    if (totalIncentivesPay > 0) {
      salaryRows.push({
        componentName: "Incentives",
        category: "Bonus",
        amount: totalIncentivesPay
      });
    }

    // Overtime
    if (totalOvertimePay > 0) {
      salaryRows.push({
        componentName: "Overtime Allowance",
        category: "Bonus",
        amount: totalOvertimePay
      });
    }

    // Deductions
    componentData.deductionComponents.forEach((item) => {
      salaryRows.push({
        componentName: item.deductionName,
        category: "Deduction",
        amount: item.calculatedAmount
      });
    });

    const totalEarnings =
      componentData.salaryComponents.reduce(
        (sum, item) => sum + item.calculatedAmount,
        0
      ) +
      totalBonusPay +
      totalIncentivesPay +
      totalOvertimePay;

    const totalDeductions =
      componentData.deductionComponents.reduce(
        (sum, item) => sum + item.calculatedAmount,
        0
      );

    const leaveDeduction = componentData.leaveDetails?.leaveDeduction || 0;

    const netSalary = totalEarnings - totalDeductions - leaveDeduction;
    return {
      status: true,
      salaryRows,
      salaryStatus,
      totals: {
        totalEarnings,
        totalDeductions,
        netSalary
      },
    };

  } catch (error) {
    console.error('Error checkSalaryDetailsForEmployee:', error);
    return { status: false, message: 'Something went wrong..' };
  }
}

// Tag text for a structural earning/deduction — mirrors CtcBreakdownCard.tsx's
// earningBadge/deductionBadge exactly, so a component reads identically here and on the
// Salary Structure (CTC) tab.
const salaryProfileEarningBadge = (earning) => {
  if (!earning) return undefined;
  if (earning.calculationType === 'FIXED') return 'Fixed';
  if (earning.calculationType === 'BALANCING') return 'Balancing';
  const pct = earning.amountPercentage ?? 0;
  if (earning.calculationBasis === 'CTC') return `${pct}% of CTC`;
  return earning.calculationBasis === 'GROSS_SALARY' ? `${pct}% of Gross` : `${pct}% of Basic Salary`;
};
const salaryProfileDeductionBadge = (deduction, pfWage, basicSalary) => {
  if (!deduction) return undefined;
  if (deduction.calculationType === 'FIXED') return 'Fixed';
  const pct = deduction.amountPercentage ?? 0;
  if (deduction.deductionName === 'Provident Fund (PF)') {
    return pfWage < basicSalary
      ? `${pct}% of Basic, capped at ₹${Math.round(pfWage * 0.12).toLocaleString('en-IN')}`
      : `${pct}% of Basic`;
  }
  return deduction.salaryDeductionType === 'GROSS_SALARY' ? `${pct}% of Gross` : `${pct}% of Basic Salary`;
};
// Splits a single lump-sum figure (e.g. Salary record's `other`/leftover deduction total,
// the only granularity actually stored for anything beyond Basic/HRA/DA/PF/ESI) across the
// LIVE structure's individually-named components, proportionally scaled so the rows still
// sum to the true recorded total — exact for a pending/upcoming month (nothing's diverged
// yet), a reasonable best-effort approximation for an already-paid month whose structure
// has since changed.
const splitLumpSumAcrossLiveComponents = (liveComponents, lumpSum, badgeFn) => {
  const liveTotal = liveComponents.reduce((sum, c) => sum + c.calculatedAmount, 0);
  const scale = liveTotal > 0 ? (lumpSum || 0) / liveTotal : 0;
  return liveComponents
    .map(c => ({
      componentName: c.componentName || c.deductionName,
      badge: badgeFn(c),
      amount: Math.round(c.calculatedAmount * scale * 100) / 100,
    }))
    .filter(row => row.amount > 0.01);
};
const buildTaxNote = (taxInfo, tdsAmount) => {
  if (!taxInfo?.fy) return null;
  if ((tdsAmount || 0) <= 0) {
    return taxInfo.rebate > 0
      ? `Section 192 — nil, yearly income is within the tax rebate limit for FY ${taxInfo.fy}.`
      : `Section 192 — nil tax liability for FY ${taxInfo.fy}.`;
  }
  if ((taxInfo.marginalRelief || 0) > 0) {
    return `Section 192 — ${taxInfo.regime === 'old' ? 'Old' : 'New'} Tax Regime, FY ${taxInfo.fy}. Section 87A marginal relief applied.`;
  }
  return `Section 192 — ${taxInfo.regime === 'old' ? 'Old' : 'New'} Tax Regime, FY ${taxInfo.fy}.`;
};

exports.salaryProfileEmpV2 = async (params) => {
  try {
    const { corporateUserID, employeeId, month, year } = params;

    const [salaryRecord, employee, hrSettings, organizationSettings, breakdown] = await Promise.all([
      Salary.findOne({
        corporateUser: corporateUserID,
        employee: new ObjectId(employeeId),
        year: Number(year),
        month: Number(month)
      }).lean(),
      Employee.findOne({ _id: new ObjectId(employeeId), corporateUser: corporateUserID })
        .select('employeeInformation.dateOfJoin offBoardingInformation.lastWorkingDay personalInformation.fullName personalInformation.email')
        .lean(),
      HrSettings.findOne({ corporateUser: corporateUserID })
        .select('payrollSettings.salaryCycleDay payrollSettings.payrollStartsFrom')
        .lean(),
      OrganizationSettings.findOne({ corporateUser: corporateUserID })
        .select('payrollSettings.calculateSalaryBasedOn payrollSettings.selectWorkingDays')
        .lean(),
      // Supplies calculation-rule tags (e.g. "50% of Gross") and employer PF/ESI/LWF
      // schedule info — none of that is stored on the Salary record itself, only
      // resolved amounts. Best-effort: if this employee's live structure can't be
      // resolved for some reason, fall back to a plain payslip with no tags rather than
      // failing the whole profile. month/year passed through so a historical Salary
      // Profile view keeps that month's own PF wage ceiling.
      getEmployeeCtcBreakdown({ corporateUserID, employeeId, month, year, includePfEarningsLine: true }).catch(() => null),
    ]);

    if (!salaryRecord) {
      return { status: false, message: 'Salary record not found for this month' };
    }

    const si = salaryRecord.salaryInformation || {};
    const salaryStatus = salaryRecord.paymentStatus || 'PENDING';

    // A record is computed once (whenever payroll processing last ran for this month) and
    // never automatically recomputed afterward — the daily cron only flips UPCOMING to
    // PENDING at cycle end, it doesn't re-resolve anything, and PENDING still means
    // nothing has actually been disbursed or locked in (only PAID/APPROVED/COMPLETED are).
    // If the employee's CTC Structure changes after the last processing run (e.g. a new
    // standalone allowance added, or a Revise Salary creating new arrears independently —
    // reviseSalary.js's exports.reviseSalary creates the Arrears doc but never touches an
    // ALREADY-EXISTING Salary document for its payout month), these persisted figures
    // silently drift from what's actually current. Since nothing has actually been paid
    // yet, it's safe to override the DISPLAY-ONLY earnings/deductions/arrears from live
    // sources here — deliberately NOT re-running processEmpSalary itself, which would
    // prematurely mark this month's arrears as PAID (markArrearsAsPaid) before any real
    // payout has happened. Variable pay (bonus/incentive/overtime/reimbursement/leave/TDS)
    // is left untouched — those aren't derived from the CTC structure, so they can't have
    // gone stale the same way.
    const PAID_STATUSES = ['PAID', 'APPROVED', 'COMPLETED'];
    const isLockedIn = PAID_STATUSES.includes(salaryStatus);

    // See findOneSalary — one-time recoveries as the payroll run applied them.
    const oneTimeDeductionRows = oneTimeDeductionLines(salaryRecord);
    const totalOneTimeDeductions = oneTimeDeductionRows.reduce((sum, d) => sum + d.amount, 0);
    if (!isLockedIn) {
      const { totalArrearsPay } = await fetchArrearsForPayout({
        employeeId,
        corporateUserID,
        month: Number(month),
        year: Number(year),
      });
      salaryRecord.totalArrears = totalArrearsPay;

    }

    // A later CTC revision governs "now" (what breakdown reflects) but not necessarily
    // this target month — see findSupersededHistoricalCtc's own comment above.
    const supersededHistoricalCtc = isLockedIn
      ? null
      : await findSupersededHistoricalCtc(employeeId, month, year);

    // With Loss of Pay the recorded earnings/deductions are the reduced, paid figures, and
    // the live breakdown is always the full month — so the record is used as-is (it is
    // regenerated on every salary-list load and on every LOP save, so it is not stale).
    const hasLossOfPay = (salaryRecord.lossOfPay?.days || 0) > 0;
    // Same for a joiner/leaver part month — the recorded figures are the prorated ones.
    const isEarningsProrated = salaryRecord.payDays?.isEarningsProrated === true;
    const hasRecordedPaidFigures = hasLossOfPay || isEarningsProrated;

    if (!isLockedIn && breakdown && !supersededHistoricalCtc && !hasRecordedPaidFigures) {
      const liveOtherEarnings = breakdown.earnings.filter(
        e => !['Basic Salary', 'House Rent Allowance', 'Dearness Allowance'].includes(e.componentName)
      );
      si.basicPay = breakdown.basicSalary;
      si.hraAmount = breakdown.earnings.find(e => e.componentName === 'House Rent Allowance')?.calculatedAmount || 0;
      si.daAmount = breakdown.earnings.find(e => e.componentName === 'Dearness Allowance')?.calculatedAmount || 0;
      si.other = liveOtherEarnings.reduce((sum, e) => sum + (e.calculatedAmount || 0), 0);
      si.earnings = breakdown.earnings.map(e => ({ componentName: e.componentName, calculatedAmount: e.calculatedAmount || 0 }));

      si.epfAmount = breakdown.deductions.find(d => d.deductionName === 'Provident Fund (PF)')?.calculatedAmount || 0;
      // See the identical fix/comment above (findOneSalary) — ESI is never an actual
      // DeductionComponent row, so it lives at breakdown.esi.employeeContribution instead.
      si.esiAmount = breakdown.esi?.employeeContribution || 0;
      si.deductions = breakdown.deductions.map(d => ({ componentName: d.deductionName, calculatedAmount: d.calculatedAmount || 0 }));
      si.deductionAmount = breakdown.deductions.reduce((sum, d) => sum + (d.calculatedAmount || 0), 0) + (si.lwfAmount || 0) + si.esiAmount;
    }

    // Old Tax Regime employees: HR enters TDS manually (the platform doesn't compute
    // old-regime TDS yet). Editing is allowed only while this month isn't locked in, and
    // the entry in force for an unlocked month is shown live — the same refresh-on-view
    // rule as the earnings/deductions above. A locked month keeps exactly what was paid.
    const isOldRegimeEmployee = await isOldTaxRegimeEmployee(corporateUserID, employeeId);
    const manualTds = isOldRegimeEmployee && !isLockedIn
      ? await resolveManualTds({ corporateUserID, employeeId, month, year })
      : null;
    if (manualTds) {
      si.tdsAmount = manualTds.amount;
      si.tdsSource = 'MANUAL';
    }
    const tdsEdit = {
      allowed: Boolean(isOldRegimeEmployee) && !isLockedIn,
      effectiveFrom: manualTds ? { month: manualTds.month, year: manualTds.year } : null,
      applyToFutureMonths: manualTds ? manualTds.applyToFutureMonths !== false : null,
    };

    // ---- Non-working days deduction (DOJ / last working day) ----
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const cycleStart = new Date(salaryRecord.salaryCycleStart);
    const cycleEnd = new Date(salaryRecord.salaryCycleEnd);
    const cycleDays = salaryRecord.salaryCycleDays || Math.floor((cycleEnd - cycleStart) / MS_PER_DAY);

    const doj = employee?.employeeInformation?.dateOfJoin
      ? new Date(employee.employeeInformation.dateOfJoin)
      : null;
    const lastWorkingDay = employee?.offBoardingInformation?.lastWorkingDay
      ? new Date(employee.offBoardingInformation.lastWorkingDay)
      : null;
    const payrollStartsFrom = hrSettings?.payrollSettings?.payrollStartsFrom
      ? new Date(hrSettings.payrollSettings.payrollStartsFrom)
      : null;

    let nonWorkingDeductionDays = 0;

    if (payrollStartsFrom && payrollStartsFrom > cycleStart) {
      nonWorkingDeductionDays += Math.floor((payrollStartsFrom - cycleStart) / MS_PER_DAY);
    }

    if (doj && doj > cycleStart) {
      const effectiveCycleStart = (payrollStartsFrom && payrollStartsFrom > cycleStart && payrollStartsFrom >= doj)
        ? cycleStart
        : cycleStart;
      nonWorkingDeductionDays += Math.floor((doj - effectiveCycleStart) / MS_PER_DAY);
    }

    if (doj && doj > cycleEnd) {
      nonWorkingDeductionDays = cycleDays;
    }

    if (lastWorkingDay && lastWorkingDay < cycleEnd) {
      nonWorkingDeductionDays += Math.floor((cycleEnd - lastWorkingDay) / MS_PER_DAY);
    }

    // Per-day rate mirrors processEmpSalary: (grossSalary - deductions) / perDayDivisor —
    // calendar days in the cycle, or Company Working Days when the org picked that in
    // Payroll Settings > Payroll Cycle (resolvePerDayDivisor).
    const perDayDivisor = resolvePerDayDivisor(cycleStart, cycleEnd, cycleDays, organizationSettings?.payrollSettings);
    // Same unit as the divisor (working days for a "Company working days" payroll) — see resolveNonWorkingPayDays.
    nonWorkingDeductionDays = resolveNonWorkingPayDays({ calendarDeductionDays: nonWorkingDeductionDays, cycleStart, cycleEnd, perDayDivisor, payrollSettings: organizationSettings?.payrollSettings, doj, lastWorkingDay, payrollStartsFrom });
    // Joiner/leaver days are charged at the full month's rate — the recorded earnings are
    // already reduced when Loss of Pay applies, so its grossBeforeLop is used instead.
    const grossEarnings = (salaryRecord.lossOfPay?.days || 0) > 0
      ? salaryRecord.lossOfPay.grossBeforeLop
      : (si.basicPay || 0) + (si.hraAmount || 0) + (si.daAmount || 0) + (si.other || 0);
    const netGross = grossEarnings - (si.deductionAmount || 0);
    const perDayRate = perDayDivisor > 0 ? netGross / perDayDivisor : 0;
    // Records with prorated earnings already exclude these days — no separate deduction.
    const nonWorkingDaysDeduction = isEarningsProrated ? 0 : Math.round(perDayRate * nonWorkingDeductionDays * 100) / 100;

    // ---- Build rows ----
    const salaryRows = [];

    // Earnings
    if (si.basicPay > 0) salaryRows.push({ componentName: 'Basic Pay', category: 'Earnings', amount: si.basicPay });
    if (si.increamentAmount > 0) salaryRows.push({ componentName: 'Increment', category: 'Earnings', amount: si.increamentAmount });
    if (si.hraAmount > 0) salaryRows.push({ componentName: 'House Rent Allowance', category: 'Earnings', amount: si.hraAmount });
    if (si.daAmount > 0) salaryRows.push({ componentName: 'Dearness Allowance', category: 'Earnings', amount: si.daAmount });
    if (si.other > 0) salaryRows.push({ componentName: 'Other Allowance', category: 'Earnings', amount: si.other });

    // Variable pay (from salary table)
    if (salaryRecord.totalBonus > 0) salaryRows.push({ componentName: 'Bonus', category: 'Bonus', amount: salaryRecord.totalBonus });
    if (salaryRecord.totalIncentive > 0) salaryRows.push({ componentName: 'Incentives', category: 'Bonus', amount: salaryRecord.totalIncentive });
    if (salaryRecord.totalOvertime > 0) salaryRows.push({ componentName: 'Overtime Allowance', category: 'Bonus', amount: salaryRecord.totalOvertime });
    if (salaryRecord.totalReimbursement > 0) salaryRows.push({ componentName: 'Reimbursement', category: 'Bonus', amount: salaryRecord.totalReimbursement });

    // Deductions (from salary table)
    if (si.epfAmount > 0) salaryRows.push({ componentName: 'Provident Fund (PF)', category: 'Deduction', amount: si.epfAmount });
    if (si.esiAmount > 0) salaryRows.push({ componentName: 'ESI', category: 'Deduction', amount: si.esiAmount });
    if (si.lwfAmount > 0) salaryRows.push({ componentName: 'LWF', category: 'Deduction', amount: si.lwfAmount });

    const otherDeductionAmount = (si.deductionAmount || 0) - (si.epfAmount || 0) - (si.esiAmount || 0) - (si.lwfAmount || 0);
    if (otherDeductionAmount > 0) salaryRows.push({ componentName: 'Other Deductions', category: 'Deduction', amount: otherDeductionAmount });

    if (salaryRecord.leaveDeduction > 0) salaryRows.push({ componentName: 'Leave Deduction', category: 'Deduction', amount: salaryRecord.leaveDeduction });
    if (nonWorkingDaysDeduction > 0) salaryRows.push({ componentName: 'Non-Working Days Deduction', category: 'Deduction', amount: nonWorkingDaysDeduction });
    oneTimeDeductionRows.forEach(d => {
      salaryRows.push({ componentName: d.label, category: 'Deduction', amount: d.amount });
    });
    if (si.tdsAmount > 0) salaryRows.push({ componentName: 'TDS', category: 'Deduction', amount: si.tdsAmount });

    // ---- Totals ----
    const totalEarnings =
      (si.basicPay || 0) +
      (si.increamentAmount || 0) +
      (si.hraAmount || 0) +
      (si.daAmount || 0) +
      (si.other || 0) +
      (salaryRecord.totalBonus || 0) +
      (salaryRecord.totalIncentive || 0) +
      (salaryRecord.totalOvertime || 0) +
      (salaryRecord.totalReimbursement || 0) +
      (salaryRecord.totalArrears || 0);

    const totalDeductions =
      (si.deductionAmount || 0) +
      (salaryRecord.leaveDeduction || 0) +
      nonWorkingDaysDeduction +
      (si.tdsAmount || 0) +
      totalOneTimeDeductions;

    // salaryRecord.totalPayable is itself stale for a not-yet-locked-in month for the same
    // reason si.* is overridden above — re-derive it from the already-refreshed
    // totalEarnings/totalDeductions instead of trusting the persisted figure.
    // Net pay is rounded once, to the nearest rupee — same as the payroll run.
    const netSalary = isLockedIn ? (Number(salaryRecord.totalPayable) || 0) : Math.round(totalEarnings - totalDeductions);

    // ---- Rich, tag-aware breakdown for the redesigned Salary Profile page ----
    // Falls back to empty/null when the live structure couldn't be resolved (breakdown ===
    // null) — the caller still gets the plain salaryRows/totals above either way.
    const richEarnings = [];
    const richDeductions = [];
    const employerContributions = [];
    let lwf = null;
    let monthlyCTC = null;
    let annualCTC = null;

    if (breakdown) {
      const basicLive = breakdown.earnings.find(e => e.componentName === 'Basic Salary');
      const hraLive = breakdown.earnings.find(e => e.componentName === 'House Rent Allowance');
      const daLive = breakdown.earnings.find(e => e.componentName === 'Dearness Allowance');
      const otherLiveEarnings = breakdown.earnings.filter(
        e => !['Basic Salary', 'House Rent Allowance', 'Dearness Allowance'].includes(e.componentName)
      );

      if (si.basicPay > 0) {
        richEarnings.push({ componentName: 'Basic Salary', badge: salaryProfileEarningBadge(basicLive), amount: si.basicPay });
      }
      if (si.increamentAmount > 0) {
        richEarnings.push({ componentName: 'Increment', badge: 'Applied this cycle', amount: si.increamentAmount });
      }
      if (si.hraAmount > 0) {
        richEarnings.push({ componentName: 'HRA', badge: salaryProfileEarningBadge(hraLive), amount: si.hraAmount });
      }
      if (si.daAmount > 0) {
        richEarnings.push({ componentName: 'Dearness Allowance', badge: salaryProfileEarningBadge(daLive), amount: si.daAmount });
      }
      if (si.other > 0) {
        richEarnings.push(...splitLumpSumAcrossLiveComponents(otherLiveEarnings, si.other, salaryProfileEarningBadge));
      }

      const pfLive = breakdown.deductions.find(d => d.deductionName === 'Provident Fund (PF)');
      const otherLiveDeductions = breakdown.deductions.filter(
        d => d.deductionName !== 'Provident Fund (PF)' && d.deductionName !== 'ESI'
      );

      if (si.epfAmount > 0) {
        richDeductions.push({
          componentName: "PF Employee's Contribution",
          badge: `Statutory — ${salaryProfileDeductionBadge(pfLive, breakdown.employerPf.pfWage, breakdown.basicSalary)}`,
          amount: si.epfAmount,
        });
      }
      if (si.esiAmount > 0) {
        richDeductions.push({ componentName: 'ESI', badge: 'Statutory — 0.75% of Gross', amount: si.esiAmount });
      }
      if (otherDeductionAmount > 0) {
        richDeductions.push(
          ...splitLumpSumAcrossLiveComponents(otherLiveDeductions, otherDeductionAmount, d => {
            const badge = salaryProfileDeductionBadge(d, breakdown.employerPf.pfWage, breakdown.basicSalary);
            const isStatutory = d.deductionName === 'Professional Tax';
            if (!isStatutory) return badge;
            return badge === 'Fixed' ? 'Statutory' : `Statutory — ${badge}`;
          })
        );
      }

      // Single row (the EPS/Employer-EPF/EDLI/Admin account-wise split is available on
      // breakdown.employerPf for a UI that wants to show it in a hover breakup, same as the
      // Salary Structure (CTC) tab's info icon — this row itself stays a single line).
      // The "capped at ₹X" badge compares against breakdown.employerPf.ceiling (the
      // PERIOD's own PF wage ceiling — ₹15,000 through August 2026, ₹25,000 from September
      // 2026), never a hardcoded figure, so it reads correctly for whichever month this
      // breakdown was resolved for.
      employerContributions.push({
        label: "PF Employer's Contribution",
        badge:
          breakdown.employerPf.pfWage >= breakdown.employerPf.ceiling
            ? `12% + 1% admin/EDLI, capped at ₹${Math.round(breakdown.employerPf.employerTotal).toLocaleString('en-IN')}`
            : '12% + 1% admin/EDLI of Basic Salary',
        // Loss of Pay / part months: employer PF follows the Basic actually paid, which the
        // payroll run recorded — the live breakdown is always the full month.
        amount: hasRecordedPaidFigures && si.epfBreakup?.employerTotal != null
          ? si.epfBreakup.employerTotal
          : breakdown.employerPf.employerTotal,
      });
      if (breakdown.esi?.eligible) {
        employerContributions.push({
          label: "ESI Employer's Contribution",
          badge: '3.25% of Gross',
          // Loss of Pay / part months: on the gross actually paid, rounded up like the run.
          amount: hasRecordedPaidFigures
            ? Math.ceil(((si.basicPay || 0) + (si.hraAmount || 0) + (si.daAmount || 0) + (si.other || 0)) * ESI_EMPLOYER_RATE)
            : breakdown.esi.employerContribution,
        });
      }

      if (breakdown.lwf?.configured) {
        lwf = {
          // The CONFIGURED amount (lwfFor's own doc comment: "always shows the configured
          // amount regardless of the current month, per the always-visible row
          // requirement") — not si.lwfAmount, which processEmpSalary deliberately zeroes
          // out for any month LWF doesn't fire (correct for what's actually deducted, but
          // wrong for "what will it be when it next fires", which is what this row shows
          // for a non-firing month like this one).
          amount: breakdown.lwf.employeeAmount || 0,
          fires: breakdown.lwf.fires,
          scheduleLabel: breakdown.lwf.scheduleLabel,
          workState: breakdown.lwf.workState,
          nextFireMonth: breakdown.lwf.nextFireMonth,
          nextFireYear: breakdown.lwf.nextFireYear,
        };
      }

      // CTC is the standing structural rate, not a reflection of this month's actual
      // payout — reads directly off breakdown.annualCtc (the same field the Salary
      // Structure (CTC) tab shows) rather than re-deriving it from this month's earnings +
      // employer contributions, which used to double as an ad-hoc CTC recomputation. That
      // recomputation always summed in the FULL employer ESI unconditionally, even for the
      // "on top of CTC" case (gross above the ceiling from a mid-period raise, still
      // covered by contribution-period continuation — see reviseSalary.js's esiNote) —
      // where that extra is deliberately NOT part of the agreed CTC (see
      // getEmployeeCtcBreakdown's identical annualCtc fix), so it inflated this page's
      // Annual CTC above what Salary Structure (CTC) shows for the exact same employee.
      // A later revision has superseded this target month (findSupersededHistoricalCtc
      // above) — breakdown.annualCtc is "now"'s committed CTC, not what was actually in
      // effect for this month, so the historical version's figure is used instead.
      // A paid month skips supersededHistoricalCtc above (its earnings are frozen on the
      // Salary record), but its CTC still has to be the one it was paid at, not "now"'s:
      // arrears-covered → the pre-revision CTC; otherwise the version in effect that month.
      const ctcPaidBeforeArrears = await findCtcPaidForMonthBeforeArrears(employeeId, month, year);
      const historicalCtc = isLockedIn ? await findSupersededHistoricalCtc(employeeId, month, year) : supersededHistoricalCtc;
      annualCTC = ctcPaidBeforeArrears
        ?? (historicalCtc ? historicalCtc.annualCTC : breakdown.annualCtc);
      monthlyCTC = annualCTC / 12;
    }

    // Month-specific earnings/deductions — one-time pay and attendance-driven deductions
    // that are never part of the recurring Salary Structure (CTC) tab, only this month's
    // actual payout. Pushed unconditionally (not gated on `breakdown` resolving above)
    // since none of them need the live CTC structure to compute or tag correctly.
    if (salaryRecord.totalBonus > 0) richEarnings.push({ componentName: 'Bonus', badge: 'One-time', amount: salaryRecord.totalBonus });
    if (salaryRecord.totalIncentive > 0) richEarnings.push({ componentName: 'Incentives', badge: 'One-time', amount: salaryRecord.totalIncentive });
    if (salaryRecord.totalOvertime > 0) richEarnings.push({ componentName: 'Overtime Allowance', badge: 'One-time', amount: salaryRecord.totalOvertime });
    if (salaryRecord.totalReimbursement > 0) richEarnings.push({ componentName: 'Reimbursement', badge: 'One-time', amount: salaryRecord.totalReimbursement });
    if (salaryRecord.totalArrears > 0) {
      richEarnings.push({
        componentName: 'Arrears',
        badge: 'One-time — paid & taxed this month',
        amount: salaryRecord.totalArrears,
      });
    }
    if (salaryRecord.leaveDeduction > 0) {
      richDeductions.push({ componentName: 'Loss of Pay / Unpaid Leave', badge: 'Prorated for unpaid leave', amount: salaryRecord.leaveDeduction });
    }
    if (nonWorkingDaysDeduction > 0) {
      richDeductions.push({ componentName: 'Non-Working Days Deduction', badge: 'Prorated for days not worked', amount: nonWorkingDaysDeduction });
    }
    // Named by the type, with HR's note as the badge. deductionId/deductionFor/note let the
    // profile offer Edit/Delete on the row; carriedForward is the balance moving to next month.
    oneTimeDeductionRows.forEach(d => {
      richDeductions.push({
        componentName: d.label,
        badge: d.note || 'One-time recovery',
        amount: d.amount,
        oneTimeDeduction: {
          deductionId: d.deductionId,
          deductionFor: d.deductionFor,
          note: d.note,
          fullAmount: d.fullAmount,
          carriedForward: d.carriedForward,
          isCarriedIn: d.isCarriedIn,
        },
      });
    });
    const isManualTds = si.tdsSource === 'MANUAL';
    if (si.tdsAmount > 0 || si.taxInformation?.fy || tdsEdit.allowed) {
      richDeductions.push({
        componentName: 'Income Tax (TDS)',
        badge: isManualTds
          ? 'Section 192 — Old Tax Regime, amount entered by HR'
          : (buildTaxNote(si.taxInformation, si.tdsAmount) || 'Section 192'),
        amount: si.tdsAmount || 0,
      });
    }

    // Full step-by-step figures behind the "How is this calculated?" TDS drawer — every
    // value here is read straight from si.taxInformation (the exact record the tax engine
    // persisted), never recomputed, so the drawer can never disagree with the report row.
    // Not shown for an HR-entered amount: the engine's working wouldn't match it.
    const tdsDetails = si.taxInformation?.fy && !isManualTds
      ? {
          employeeName: employee?.personalInformation?.fullName || '',
          employeeEmail: employee?.personalInformation?.email || '',
          taxRegime: si.taxInformation.regime === 'old' ? 'Old Tax Regime' : 'New Tax Regime',
          tdsFrequency: 'Monthly',
          dateOfJoin: employee?.employeeInformation?.dateOfJoin || null,
          fy: si.taxInformation.fy || '',
          monthlySalary: totalEarnings,
          grossThisMonth: totalEarnings,
          standardDeduction: si.taxInformation.standardDeduction || 0,
          exemptions: si.taxInformation.exemptions || 0,
          grossAnnual: si.taxInformation.grossAnnual || totalEarnings * 12,
          taxableIncome: si.taxInformation.taxableIncome || 0,
          slabBreakdown: si.taxInformation.slabBreakdown || [],
          taxBeforeRebate: si.taxInformation.taxBeforeRebate || 0,
          rebate: si.taxInformation.rebate || 0,
          marginalRelief: si.taxInformation.marginalRelief || 0,
          rebateLimit: si.taxInformation.rebateLimit || 0,
          // What the "Less: Section 87A rebate / marginal relief" line in the drawer shows —
          // full rebate and marginal relief are mutually exclusive per band, so summing is safe.
          totalRebate: (si.taxInformation.rebate || 0) + (si.taxInformation.marginalRelief || 0),
          surcharge: si.taxInformation.surcharge || 0,
          surchargeRate: si.taxInformation.surchargeRate || 0,
          surchargeThreshold: si.taxInformation.surchargeThreshold || 0,
          surchargeBeforeRelief: si.taxInformation.surchargeBeforeRelief || 0,
          cess: si.taxInformation.cess || 0,
          totalTax: si.taxInformation.totalTax || 0,
          tdsMonthly: si.taxInformation.tdsMonthly || si.tdsAmount || 0,
        }
      : null;

    return {
      status: true,
      salaryRows,
      salaryStatus,
      totals: {
        totalEarnings,
        totalDeductions,
        netSalary
      },
      monthlyGrossSalary: totalEarnings,
      monthlyCTC,
      annualCTC,
      earnings: richEarnings,
      deductions: richDeductions,
      employerContributions,
      lwf,
      netSalary,
      tdsDetails,
      tdsEdit,
      // "Loss of Pay: 2 days, ₹2,903.23 off the month's pay" line under the summary.
      lossOfPay: hasLossOfPay
        ? {
            days: salaryRecord.lossOfPay.days,
            amount: salaryRecord.lossOfPay.amount,
            isAmountOverridden: !!salaryRecord.lossOfPay.isAmountOverridden,
            grossBeforeLop: salaryRecord.lossOfPay.grossBeforeLop,
          }
        : null,
      payDays: salaryRecord.payDays || null,
    };

  } catch (error) {
    console.error('Error salaryProfileEmpV2:', error);
    return { status: false, message: 'Something went wrong..' };
  }
};

exports.payrollHistory = async (params) => {
  try {
    const { corporateUserID, year } = params
    const requestedYear = Number(year);

    const payrollHistoryAgg = await Salary.aggregate([
      {
        $match: {
          corporateUser: corporateUserID,
          year: requestedYear
        }
      },
      // A month can now be "mixed" (most employees PAID, one late-added employee still
      // PENDING, mid-backfill) — $first without an explicit sort picks whatever document
      // Mongo happens to encounter first, which is not guaranteed to be a PAID one.
      // Ranking PAID/APPROVED ahead of PENDING before grouping keeps this history row
      // reading as the org's already-processed month it is, rather than flickering to
      // PENDING because of one late addition.
      {
        $addFields: {
          __statusPriority: {
            $switch: {
              branches: [
                { case: { $eq: ["$paymentStatus", "PAID"] }, then: 0 },
                { case: { $eq: ["$paymentStatus", "APPROVED"] }, then: 1 },
                { case: { $eq: ["$paymentStatus", "PENDING"] }, then: 2 },
                { case: { $eq: ["$paymentStatus", "INITIATED"] }, then: 3 },
                { case: { $eq: ["$paymentStatus", "UPCOMING"] }, then: 4 },
                { case: { $eq: ["$paymentStatus", "FAILD"] }, then: 5 },
              ],
              default: 6,
            }
          }
        }
      },
      { $sort: { __statusPriority: 1 } },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month"
          },
          createdDate: { $min: "$createdAt" },
          processedOn: { $max: "$payingDate" },
          totalEmployees: { $sum: 1 },
          totalAmount: { $sum: "$totalPayable" },
          paymentStatus: { $first: "$paymentStatus" }
        }
      }
    ]);

    // Real, already-processed months — createdDate/processedOn/status all come straight
    // from actual Salary docs, unchanged from before.
    const byMonth = new Map(
      payrollHistoryAgg.map((item) => [
        item._id.month,
        {
          createdDate: item.createdDate,
          month: item._id.month,
          year: item._id.year,
          processedOn: item.processedOn,
          totalEmployees: item.totalEmployees,
          totalAmount: item.totalAmount,
          salaryStatus: item.paymentStatus
        }
      ])
    );

    // Top up every month's totals with the employees who DON'T have a real Salary doc
    // for it yet — cloning their nearest same-structure real payslip (or, failing that, a
    // live projection) — same approach as the Payroll Slip tab's scaffold
    // (allPayrollSlips, controller/salary.js). Without this, a month where only 1 of 3
    // employees has been processed reads as "1 employee, ₹X" instead of the company's
    // actual expected payroll for that month.
    const rawDocs = await Salary.find({ corporateUser: corporateUserID, year: requestedYear })
      .select('employee month totalPayable')
      .lean();
    const realRowsByEmployee = new Map();
    rawDocs.forEach((doc) => {
      const empKey = doc.employee.toString();
      if (!realRowsByEmployee.has(empKey)) realRowsByEmployee.set(empKey, new Map());
      realRowsByEmployee.get(empKey).set(doc.month, Number(doc.totalPayable) || 0);
    });

    const employees = await Employee.find({ corporateUser: corporateUserID, isEmployeeDeleted: false })
      .select('employeeInformation.dateOfJoin')
      .lean();

    let payrollStartsFrom = null;
    try {
      const cycleInfo = await exports.getSalaryCycleDay(corporateUserID);
      if (cycleInfo && cycleInfo.payrollStartsFrom) payrollStartsFrom = new Date(cycleInfo.payrollStartsFrom);
    } catch (e) {
      payrollStartsFrom = null;
    }
    const monthFloorForYear = (date) => {
      if (!date) return 1;
      if (date.getFullYear() === requestedYear) return date.getMonth() + 1;
      return date.getFullYear() > requestedYear ? 13 : 1;
    };
    const orgFloor = monthFloorForYear(payrollStartsFrom);

    const employeeIds = employees.map((e) => e._id);
    const allRevisions = await SalaryStructureVersion.find({ employee: { $in: employeeIds } })
      .select('employee effectiveFrom')
      .lean();
    const revisionMonthsByEmployee = new Map();
    allRevisions.forEach((r) => {
      const d = new Date(r.effectiveFrom);
      if (d.getFullYear() !== requestedYear) return;
      const key = r.employee.toString();
      if (!revisionMonthsByEmployee.has(key)) revisionMonthsByEmployee.set(key, new Set());
      revisionMonthsByEmployee.get(key).add(d.getMonth() + 1);
    });
    const hasRevisionBetween = (monthsSet, monthA, monthB) => {
      const low = Math.min(monthA, monthB);
      const high = Math.max(monthA, monthB);
      for (let m = low + 1; m <= high; m += 1) {
        if (monthsSet.has(m)) return true;
      }
      return false;
    };

    const addToMonth = (month, amount) => {
      const existing = byMonth.get(month);
      if (existing) {
        existing.totalEmployees += 1;
        existing.totalAmount += amount;
      } else {
        byMonth.set(month, {
          createdDate: null,
          month,
          year: requestedYear,
          processedOn: null,
          totalEmployees: 1,
          totalAmount: amount,
          salaryStatus: null,
        });
      }
    };

    // Cap how far into the year we show/project — a future month with no real Salary doc
    // for ANY employee is pure speculation with nothing backing it (no createdAt, nobody's
    // actually run or scheduled it), so it shouldn't appear at all. The cap is whichever
    // is FURTHER: the current month, or the latest month that already has a real doc
    // (an admin can legitimately run payroll ahead of schedule, e.g. September's doc
    // already exists in August) — never further than that just because it's still
    // technically "this year".
    const now = new Date();
    const isCurrentYear = requestedYear === now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const highestRealMonth = Math.max(0, ...Array.from(byMonth.keys()));
    const maxMonth =
      requestedYear < now.getFullYear() ? 12 :
      requestedYear > now.getFullYear() ? highestRealMonth :
      Math.max(currentMonth, highestRealMonth);

    for (const emp of employees) {
      const empKey = emp._id.toString();
      const dateOfJoin = emp?.employeeInformation?.dateOfJoin ? new Date(emp.employeeInformation.dateOfJoin) : null;
      const empFloor = Math.max(monthFloorForYear(dateOfJoin), orgFloor);
      const realMonths = realRowsByEmployee.get(empKey) || new Map();
      const revisionMonths = revisionMonthsByEmployee.get(empKey) || new Set();
      const realRowList = Array.from(realMonths.entries()).map(([month, netPaid]) => ({ month, netPaid }));

      for (let month = empFloor; month <= maxMonth; month += 1) {
        if (realMonths.has(month)) continue; // already counted in the aggregation above

        const candidates = realRowList.filter((r) => !hasRevisionBetween(revisionMonths, month, r.month));
        let amount = null;
        if (candidates.length) {
          const nearest = candidates.reduce((closest, r) =>
            Math.abs(r.month - month) < Math.abs(closest.month - month) ? r : closest
          );
          amount = nearest.netPaid;
        } else {
          // eslint-disable-next-line no-await-in-loop
          const projection = await exports.salaryProfileEmp({ corporateUserID, employeeId: empKey, month, year: requestedYear });
          if (projection?.status) amount = projection.totals.netSalary;
        }
        if (amount !== null) addToMonth(month, amount);
      }
    }

    // Scaffold in every month up to maxMonth that still has no contribution at all (e.g.
    // before any employee had joined) so the table shows every month that's actually
    // relevant. A month with no real doc is either still ahead of us (UPCOMING) or already
    // elapsed with no payroll run recorded for it (PENDING).
    const salaryRows = [];
    for (let month = maxMonth; month >= 1; month -= 1) {
      const isFuture = isCurrentYear ? month > currentMonth : requestedYear > now.getFullYear();
      const existing = byMonth.get(month);
      if (existing) {
        salaryRows.push({
          ...existing,
          salaryStatus: existing.salaryStatus || (isFuture ? 'UPCOMING' : 'PENDING'),
        });
        continue;
      }
      salaryRows.push({
        createdDate: null,
        month,
        year: requestedYear,
        processedOn: null,
        totalEmployees: 0,
        totalAmount: 0,
        salaryStatus: isFuture ? 'UPCOMING' : 'PENDING'
      });
    }

    return {
      status: true,
      salaryRows
    };

  } catch (error) {
    console.error('Error PayrollHistory:', error);
    return { status: false, message: 'Something went wrong..' };
  }
}

exports.empMonthlyApproveSalary = async (params) => {
    try {
        const { payingDate, paymentStatus, corporateUserID, month, year,employeeId } = params;
        const { startDate, endDate } = getMonthRange(month, year);
        const existingSalaries = await Salary.find({
            corporateUser: corporateUserID,
            month,
            year,
            employee: new ObjectId(employeeId),
            paymentStatus: { $in: ['PAID', 'APPROVED'] }
        });

        if (existingSalaries.length > 0) {
            return { success: false, message: 'Salaries for this month and year are already approved.' };
        }
        const isUpcoming = await Salary.find({
            corporateUser: corporateUserID,
            month,
            year,
            employee: new ObjectId(employeeId),
            paymentStatus: 'UPCOMING'
        });

        if (isUpcoming.length > 0) {
            return { success: false, message: 'You cannot approve upcoming months salaries.' };
        }

        await Salary.updateOne(
            {
                corporateUser: corporateUserID,
                employee: new ObjectId(employeeId),
                month,
                year
            },
            { payingDate, paymentStatus })

        // Only genuinely settled now — see approveSalary's identical comment for why this
        // can't live inside processEmpSalary itself.
        const settledSalaryForArrears = await Salary.findOne({
            corporateUser: corporateUserID, employee: new ObjectId(employeeId), month, year
        });
        await markArrearsAsPaid(settledSalaryForArrears?.arrears || []);
      // -------------------------------
      // 2. Update Incentives (By Date)
      // -------------------------------
      await Incentives.updateMany(
        {
          corporateUser: corporateUserID,
          paymentStatus: 'UNPAID',
          employee: new ObjectId(employeeId),
          incentiveDate: {
            $gte: startDate,
            $lt: endDate
          }
        },
        {
          paymentStatus: 'PAID'
        });  
        // -------------------------------
        // 3. Update Bonus
        // -------------------------------
        await Bonus.updateMany(
            {
                corporateUser: corporateUserID,
                paymentStatus: 'UNPAID',
                employee: new ObjectId(employeeId),
                bonusDate: {
                    $gte: startDate,
                    $lt: endDate
                }
            },
            {
                paymentStatus: 'PAID'
            }
        );

        // -------------------------------
        // 4. Update Reimbursement
        // -------------------------------
        await Reimbursement.updateMany(
            {
                corporateUser: corporateUserID,
                paymentStatus: 'UNPAID',
                employee: new ObjectId(employeeId),
                expenseDate: {
                    $gte: startDate,
                    $lt: endDate
                }
            },
            {
                paymentStatus: 'PAID'
            }
        );

        // -------------------------------
        // 5. Update Overtime (If exists)
        // -------------------------------
        if (Overtime) {
            await Overtime.updateMany(
                {
                    corporateUser: corporateUserID,
                    paymentStatus: 'UNPAID',
                    employee: new ObjectId(employeeId),
                    overtimeDate: {
                        $gte: startDate,
                        $lt: endDate
                    }
                },
                {
                    paymentStatus: 'PAID'
                }
            );
        }
        return {
            success: true,
            message: 'Salary & related payments approved successfully'
        };
        // return salary
    } catch (error) {
       console.error(error);
        return {
            success: false,
            message: 'Approval failed'
        };
    }
}
exports.getSalaryHistoryList = async (params) => {
    try {
        const { corporateUserID, year, status, page = 1, limit = 10, searchText } = params;
        const normalizedStatus = String(status || '').toUpperCase();
        const resolvedPage = Math.max(Number(page) || 1, 1);
        const resolvedLimit = Math.max(Number(limit) || 10, 1);
        const resolvedYear = Number(year);
        const skip = (resolvedPage - 1) * resolvedLimit;
        const activeStatuses = ['ACTIVE', 'CONFIRMED', 'INPROBATION'];
        const pastStatuses = ['RESIGNED', 'SUSPENDED'];

        const employeeMatch = {
            corporateUser: corporateUserID,
            isEmployeeDeleted: false,
        };
        const employeeFilters = [];

        if (normalizedStatus === 'ACTIVE') {
            employeeFilters.push({
                'employeeInformation.employeeStatus': { $in: activeStatuses },
            });
        } else if (['PAST', 'INACTIVE'].includes(normalizedStatus)) {
            employeeFilters.push({
                $or: [
                    { 'offBoardingInformation.offBoardingType': { $in: ['RESIGNATION', 'SUSPENSION'] } },
                    { 'employeeInformation.employeeStatus': { $in: pastStatuses } },
                ],
            });
        }

        if (searchText) {
            employeeFilters.push({
                $or: [
                    { 'personalInformation.fullName': { $regex: escapeSearch(searchText), $options: 'i' } },
                    { 'personalInformation.email': { $regex: escapeSearch(searchText), $options: 'i' } },
                    { 'employeeInformation.employeeId': { $regex: escapeSearch(searchText), $options: 'i' } },
                    { 'employeeInformation.workEmailId': { $regex: escapeSearch(searchText), $options: 'i' } },
                ],
            });
        }

        if (employeeFilters.length) {
            employeeMatch.$and = employeeFilters;
        }

        const paidSalariesLookupStage = {
            $lookup: {
                from: Salary.collection.name,
                let: { employeeId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$employee', '$$employeeId'] },
                                    { $eq: ['$corporateUser', corporateUserID] },
                                    { $eq: ['$year', resolvedYear] },
                                    { $gt: ['$totalPayable', 0] },
                                ],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: SalaryPayoutTransaction.collection.name,
                            let: { salaryId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$salary', '$$salaryId'] },
                                                { $eq: ['$corporateUser', corporateUserID] },
                                                { $eq: ['$status', 'SUCCESS'] },
                                            ],
                                        },
                                    },
                                },
                                { $sort: { createdAt: -1 } },
                                { $limit: 1 },
                            ],
                            as: 'successfulPayouts',
                        },
                    },
                    {
                        $match: {
                            $or: [
                                { paymentStatus: 'PAID' },
                                { successfulPayouts: { $ne: [] } },
                            ],
                        },
                    },
                    { $sort: { month: 1 } },
                    {
                        $project: {
                            _id: 0,
                            month: 1,
                            amount: '$totalPayable',
                        },
                    },
                ],
                as: 'salaries',
            },
        };

        const [rows, countResult] = await Promise.all([
            Employee.aggregate([
                { $match: employeeMatch },
                { $sort: { 'personalInformation.fullName': 1, _id: 1 } },
                { $skip: skip },
                { $limit: resolvedLimit },
                paidSalariesLookupStage,
                {
                    $project: {
                        employeeId: { $toString: '$_id' },
                        employeeCode: '$employeeInformation.employeeId',
                        employeeName: '$personalInformation.fullName',
                        salaries: 1,
                    },
                },
            ]),
            Employee.aggregate([{ $match: employeeMatch }, { $count: 'total' }]),
        ]);

        return {
            status: true,
            rows: rows.map(item => ({
                employeeId: item.employeeId,
                employeeCode: item.employeeCode || null,
                employeeName: item.employeeName || 'Unknown',
                salaries: Array.isArray(item.salaries) ? item.salaries : [],
            })),
            count: countResult[0]?.total ?? 0,
        };
    } catch (error) {
        console.error('Error getSalaryHistoryList:', error);
        return { status: false, message: 'Something went wrong.' };
    }
};

// Same non-working-days-deduction math as findOneSalary's inline calculation
// (kept as a separate copy rather than a shared refactor, so this addition
// can't affect the already-working corporate payslip PDF).
const computeNonWorkingDaysDeduction = (salaryRecord, employee, hrSettings, organizationSettings) => {
    // Earnings on this record are already prorated for the part month.
    if (salaryRecord.payDays?.isEarningsProrated === true) return 0;
    const si = salaryRecord.salaryInformation || {};
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const cycleStart = new Date(salaryRecord.salaryCycleStart);
    const cycleEnd = new Date(salaryRecord.salaryCycleEnd);
    const cycleDays = salaryRecord.salaryCycleDays || Math.floor((cycleEnd - cycleStart) / MS_PER_DAY);

    const doj = employee?.employeeInformation?.dateOfJoin ? new Date(employee.employeeInformation.dateOfJoin) : null;
    const lastWorkingDay = employee?.offBoardingInformation?.lastWorkingDay ? new Date(employee.offBoardingInformation.lastWorkingDay) : null;
    const payrollStartsFrom = hrSettings?.payrollSettings?.payrollStartsFrom ? new Date(hrSettings.payrollSettings.payrollStartsFrom) : null;

    let nonWorkingDeductionDays = 0;
    if (payrollStartsFrom && payrollStartsFrom > cycleStart) {
        nonWorkingDeductionDays += Math.floor((payrollStartsFrom - cycleStart) / MS_PER_DAY);
    }
    if (doj && doj > cycleStart) {
        nonWorkingDeductionDays += Math.floor((doj - cycleStart) / MS_PER_DAY);
    }
    if (doj && doj > cycleEnd) {
        nonWorkingDeductionDays = cycleDays;
    }
    if (lastWorkingDay && lastWorkingDay < cycleEnd) {
        nonWorkingDeductionDays += Math.floor((cycleEnd - lastWorkingDay) / MS_PER_DAY);
    }

    const perDayDivisor = resolvePerDayDivisor(cycleStart, cycleEnd, cycleDays, organizationSettings?.payrollSettings);
    // Same unit as the divisor (working days for a "Company working days" payroll) — see resolveNonWorkingPayDays.
    nonWorkingDeductionDays = resolveNonWorkingPayDays({ calendarDeductionDays: nonWorkingDeductionDays, cycleStart, cycleEnd, perDayDivisor, payrollSettings: organizationSettings?.payrollSettings, doj, lastWorkingDay, payrollStartsFrom });
    // Joiner/leaver days are charged at the full month's rate — the recorded earnings are
    // already reduced when Loss of Pay applies, so its grossBeforeLop is used instead.
    const grossEarnings = (salaryRecord.lossOfPay?.days || 0) > 0
      ? salaryRecord.lossOfPay.grossBeforeLop
      : (si.basicPay || 0) + (si.hraAmount || 0) + (si.daAmount || 0) + (si.other || 0);
    const netGross = grossEarnings - (si.deductionAmount || 0);
    const perDayRate = perDayDivisor > 0 ? netGross / perDayDivisor : 0;
    return Math.round(perDayRate * nonWorkingDeductionDays * 100) / 100;
};

// ESS "My Pay" listing: one row per month for the given year, newest-first.
// Months with no processed Salary record yet get a placeholder row (pending
// if in the past, upcoming if the current/future month) instead of being
// omitted, matching the corporate-side calendar-of-months UX.
exports.findPayslipsForEmployee = async (corporateUserID, employeeId, year) => {
    const numericYear = Number(year);
    const [salaries, employee, hrSettings, organizationSettings] = await Promise.all([
        Salary.find({
            corporateUser: corporateUserID,
            employee: new ObjectId(employeeId),
            year: numericYear,
        }).lean(),
        Employee.findOne({ _id: employeeId, corporateUser: corporateUserID }).lean(),
        HrSettings.findOne({ corporateUser: corporateUserID })
            .select('payrollSettings.payrollStartsFrom')
            .lean(),
        OrganizationSettings.findOne({ corporateUser: corporateUserID })
            .select('payrollSettings.calculateSalaryBasedOn payrollSettings.selectWorkingDays')
            .lean(),
    ]);

    const byMonth = new Map(salaries.map(s => [s.month, s]));

    const now = new Date();
    const currentYear = now.getFullYear();
    const lastMonth = numericYear === currentYear ? now.getMonth() + 1 : 12;
    const dateOfJoin = employee?.employeeInformation?.dateOfJoin
        ? new Date(employee.employeeInformation.dateOfJoin)
        : null;

    const rows = [];
    for (let month = lastMonth; month >= 1; month--) {
        const existing = byMonth.get(month);
        if (existing) {
            rows.push({
                id: existing._id,
                year: numericYear,
                month,
                payingDate: existing.payingDate,
                totalPayable: existing.totalPayable,
                paymentStatus: existing.paymentStatus,
                salaryInformation: existing.salaryInformation,
                totalIncentive: existing.totalIncentive,
                totalBonus: existing.totalBonus,
                totalOvertime: existing.totalOvertime,
                totalReimbursement: existing.totalReimbursement,
                leaveDeduction: existing.leaveDeduction,
                totalOtherDeduction: existing.totalOtherDeduction,
                nonWorkingDaysDeduction: computeNonWorkingDaysDeduction(existing, employee, hrSettings, organizationSettings),
                // Paid days ("29 (LOP 2)") for the ESS payslip — LOP is never a deduction line.
                payDays: existing.payDays || null,
                // One-time recoveries applied this month, each named by its type with HR's note.
                oneTimeDeductions: oneTimeDeductionLines(existing).map(d => ({ label: d.label, note: d.note, amount: d.amount })),
            });
        } else {
            const isUpcoming = numericYear > currentYear ||
                (numericYear === currentYear && month >= now.getMonth() + 1);
            const isBeforeJoining = dateOfJoin && (
                numericYear < dateOfJoin.getFullYear() ||
                (numericYear === dateOfJoin.getFullYear() && month < dateOfJoin.getMonth() + 1)
            );
            let paymentStatus = 'PENDING';
            if (isUpcoming) paymentStatus = 'UPCOMING';
            else if (isBeforeJoining) paymentStatus = 'NOT_APPLICABLE';
            rows.push({
                id: null,
                year: numericYear,
                month,
                totalPayable: 0,
                paymentStatus,
            });
        }
    }

    return rows;
};
