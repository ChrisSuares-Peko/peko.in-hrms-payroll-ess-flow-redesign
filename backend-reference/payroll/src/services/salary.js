/* eslint-disable no-async-promise-executor */
/* eslint-disable no-unused-vars */
// const { promisify } = require('util');
// const setTimeoutPromise = promisify(setTimeout);
const moment = require('moment');
const Employee = require("../models/entities/employee");
const Salary = require("../models/entities/salary");
const { fetchLeavesByEmployeeAndCorporateUser } = require("../models/use-cases/leaveApplication");
const { fetchReimbursementsByEmployeeAndCorporateUser } = require("../models/use-cases/reimbursement");
const { isSalaryProcessedForMonthYearCorporateUser, findOneSalary, updateEmailSent, findOneSalaryForReprocessing,getSalaryCycleDay } = require("../models/use-cases/salary");
const { getDaysInMonth, getDaysDifference, getDaysInPreviousMonth, getPreviousMonthAndYear, resolvePerDayDivisor, resolvePartMonthDays } = require("../utils/dateUtils");
const { paySlipEmailTemplate, payslipHtmlAE } = require("../utils/email/emailTemplates/paySlipEmail");
const { resolveDynamicEmail } = require('./emailTemplateResolver');
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require('../utils/email/emailTemplateKeys');
const { v2LayoutVariables } = require('../utils/email/sharedLayout');
const { salaryHistoryReportHtml } = require("../utils/email/emailTemplates/salaryHistoryReport");
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose
const emailer = require('../utils/email/emailer');
const wkhtmltopdf = require('wkhtmltopdf');
// if (process.env.WKHTMLTOPDF_PATH) wkhtmltopdf.command = process.env.WKHTMLTOPDF_PATH;

const fs = require("fs");
const crypto = require("crypto");
const { restrictPayrollSettings } = require('../models/use-cases/hrSettings');
const { fetchEmployeesForGenerateSalary } = require('../models/use-cases/employee');
const { fetchIncentivesByEmployeeAndCorporateUser } = require('../models/use-cases/incentives');
const { fetchBonusByEmployeeAndCorporateUser } = require('../models/use-cases/bonus');
const { fetchOvertimeByEmployeeAndCorporateUser } = require('../models/use-cases/overTime');
const HrSettings = require('../models/entities/hrSettings');
const OrganizationSetting = require('../models/entities/organizationSettings');
const { fetchDeductionsByEmployeeAndCorporateUser, fetchOutstandingOneTimeDeductions } = require('../models/use-cases/deductions');
const { allocateOneTimeRecoveries } = require('../utils/oneTimeDeductionTypes');
const { fetchAdjustedBasicPay } = require('./increment');
const { getEmployeeSalaryComponentForProcessSalary, isProvidentFundDeduction } = require("../models/use-cases/salaryComponent");
const { fetchArrearsForPayout } = require("../models/use-cases/reviseSalary");
const { resolvePfWage, calculateEmployerPfContribution, resolveEpfPolicyFromComplianceSettings, isPfInEarningsForPeriod } = require("./calculateEmployerPf");
const { applyPfEarningsLine } = require("./pfEarningsLine");
const { resolveEsi } = require("../models/use-cases/ctcCalculator");
const { lwfFor } = require("./lwfCalc");
const { getComplianceSettingsUsingCorporateId, ensureEpfEnabledWhenMandatory } = require("../models/use-cases/complianceSettings");
const { resolveManualTds } = require("../models/use-cases/tdsOverride");
const { salaryProfileEmp } = require("../models/use-cases/salary");
const { findLossOfPayForMonth } = require("../models/use-cases/lossOfPay");
const path = require("path");
const os = require("os");

exports.calculateSalaryCycleBasedOnMonth = async (month, year, salaryCycleDay, corporateUserID) => {
    month = Number(month);
    year = Number(year);
    let tempMonth = month
    let tempYear = year
    // to adjust the cycle based on salary cycle day
    if (salaryCycleDay < 15) {
        if (month === 12) {
            month = 1;
            year += 1;
        } else {
            month = month + 1;
        }
    }
    let daysInMonth = getDaysInMonth(month, year)
    let salaryCycleDaysCurrent

    // updated salary cycle day based on current month's days
    if (salaryCycleDay > daysInMonth) {
        salaryCycleDaysCurrent = daysInMonth
    } else {
        salaryCycleDaysCurrent = salaryCycleDay
    }

    let daysInPastMonth = getDaysInPreviousMonth(month, year)

    let salaryCycleDaysPrevious
    if (salaryCycleDay > daysInPastMonth) {
        salaryCycleDaysPrevious = daysInPastMonth
    } else {
        salaryCycleDaysPrevious = salaryCycleDay
    }
    let { year: y1, month: m1 } = getPreviousMonths(year, month, 1)
    let cycleStart = moment.utc([y1, m1 - 1, salaryCycleDaysPrevious]).startOf('day').toDate();
    let { year: y2, month: m2 } = getPreviousMonths(year, month, 0)
    let cycleEnd = moment.utc([y2, m2 - 1, salaryCycleDaysCurrent]).endOf('day').subtract(1, 'days').toDate(); //subtract 1 day- avoid over lapping

    //cycleStart is last month cycleEnd || above calculated
    let { previousMonth, previousYear } = getPreviousMonthAndYear(tempMonth, tempYear)
    let lastMonthsSalaryDetails = await isSalaryProcessedForMonthYearCorporateUser(previousMonth, previousYear, corporateUserID)
    if (lastMonthsSalaryDetails && lastMonthsSalaryDetails?.salaryCycleEnd) {
        let newDate = moment.utc(lastMonthsSalaryDetails.salaryCycleEnd).startOf('day').add(1, 'days');
        cycleStart = newDate.toDate();
    }
    return { cycleStart, cycleEnd }
}

exports.fetchDeductionDays = async ({ corporateUserID, month, year, doj, lastWorkingDay, salaryCycleDay, payrollStartsFrom }) => {
    let deductionDays = 0
    const millisecondsInDay = 1000 * 60 * 60 * 24; // milliseconds * seconds * minutes * hours

    try {
        let { cycleStart, cycleEnd } = await this.calculateSalaryCycleBasedOnMonth(month, year, salaryCycleDay, corporateUserID)
        const cycleDays = getDaysDifference(cycleStart, cycleEnd)
        if (payrollStartsFrom > cycleStart) {
            //need to check many days after he joined
            const differenceInMilliseconds = payrollStartsFrom - cycleStart;
            const differenceInDays = Math.floor(differenceInMilliseconds / millisecondsInDay);
            deductionDays += differenceInDays
            if (payrollStartsFrom < doj) {
                cycleStart = payrollStartsFrom
            } else if (payrollStartsFrom >= doj) {
                doj = cycleStart
            }

        }
        //if a new employee we need to deduct a days before he joined as leave days
        if (doj > cycleStart) {
            //need to check many days after he joined
            const differenceInMilliseconds = doj - cycleStart;
            const differenceInDays = Math.floor(differenceInMilliseconds / millisecondsInDay);
            deductionDays += differenceInDays
        }
        if (doj > cycleEnd) {
            deductionDays = cycleDays
        }
        if (lastWorkingDay && lastWorkingDay < cycleEnd) {
            const differenceInMilliseconds = cycleEnd - lastWorkingDay;
            const differenceInDays = Math.floor(differenceInMilliseconds / millisecondsInDay);
            deductionDays += differenceInDays
        }
        return { deductionDays }

    } catch (error) {
        console.log(error)
        return { deductionDays }
    }
}
exports.processSalary = async (params) => {
    try {
        const currentDate = new Date();
        let { month, year, corporateUserID, cycleStart, cycleEnd, employeeId } = params
        let paymentStatus = cycleEnd >= currentDate ? 'UPCOMING' : 'PENDING'

        const cycleDays = getDaysDifference(cycleStart, cycleEnd)
        if (cycleDays === undefined || typeof cycleDays !== 'number' || !Number.isInteger(cycleDays)) {
            throw new Error('Invalid cycle duration');
        }
        let { payrollSettings: { salaryCycleDay, payrollStartsFrom, isEditable } = {} } = await HrSettings.findOne({ corporateUser: corporateUserID });
        const organizationSetting = await OrganizationSetting.findOne({ corporateUser: corporateUserID }).select('payrollSettings.calculateSalaryBasedOn payrollSettings.selectWorkingDays').lean();
        const perDayDivisor = resolvePerDayDivisor(cycleStart, cycleEnd, cycleDays, organizationSetting?.payrollSettings)

        let employees = await fetchEmployeesForGenerateSalary(corporateUserID, cycleStart, cycleEnd, employeeId)
        let salariesArray = [];//for bulk create
        console.log({ a: 'Promise start' })
        const startTime = new Date(); // Record start time
        const updatedResponses = await Promise.all(employees.map(async (employee) => {
            try {
                const { dateOfJoin: doj, status } = employee.employeeInformation
                const lastWorkingDay = employee?.offBoardingInformation?.lastWorkingDay || false
                const employeeId = employee._id
                // Check if status is SUSPENDED or RESIGNED and lastWorkingDay is after cycleStart
                if ((status == 'SUSPENDED' || status == 'RESIGNED') && lastWorkingDay < cycleStart) {
                    return false
                }

                const salaryInfo = employee.salaryInformation;


                const existingSalaryRecord = await findOneSalaryForReprocessing({ corporateUserID, employeeId: employee._id, year, month, cycleStart, cycleEnd })
                if (existingSalaryRecord && (existingSalaryRecord.paymentStatus === 'PAID' || existingSalaryRecord.paymentStatus === 'APPROVED' || existingSalaryRecord.paymentStatus === 'COMPLETED')) return false

                //get the unpaid leaves taken by this employee during this period
                let { leaveCount } = await fetchLeavesByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)

                //get other days to be deducted like late join / if first payroll is after than cycle start
                let { deductionDays } = await this.fetchDeductionDays({ corporateUserID, month, year, doj, lastWorkingDay, salaryCycleDay, payrollStartsFrom })
                // need to adjust basic pay with increments for future and past unpaid salary recalculation
                salaryInfo.basicPay = await fetchAdjustedBasicPay({ basicPay: salaryInfo?.basicPay || 0, corporateUserID, dateOfJoin: doj, employeeId, month, year })

                //calculate the salary payable after deducting the leave
                let { basicPay, travelAllowances, homeAllowances, medicalAllowances, otherAllowances, other } = salaryInfo
                let grossSalary = (basicPay || 0) + (travelAllowances || 0) + (homeAllowances || 0) + (medicalAllowances || 0) + (otherAllowances || 0) + (other || 0);

                let perDayRate = grossSalary / perDayDivisor
                let leaveDeduction = (perDayRate * leaveCount)
                let otherDeductions = (perDayRate * Math.min(deductionDays, perDayDivisor))
                let netSalary = grossSalary - leaveDeduction - otherDeductions
                let attendancePercentage = calculateAttendancePercentage(leaveCount, cycleDays)


                //get the additional payments that needs to be add with salary
                let { totalIncentivesPay, incentivesIds } = await fetchIncentivesByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)
                let { totalBonusPay, bonusIds } = await fetchBonusByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)
                let { totalOvertimePay, overtimeIds } = await fetchOvertimeByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)
                // if (employeeId == '66123bd96034f6b8bfca1ec7') {
                //     console.log({ totalIncentivesPay, incentivesIds, totalBonusPay, bonusIds, totalOvertimePay, overtimeIds, employeeId })
                // }
                //get the additional deductions that needs to be deducted form the salary
                let { totalDeductionsPay, deductionsIds } = await fetchDeductionsByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)
                console.log({ leaveCount, deductionDays ,totalDeductionsPay ,otherDeductions})


                //calculate the total salary payable to employee
                let totalPayable = netSalary + totalBonusPay + totalIncentivesPay + totalOvertimePay - totalDeductionsPay
                // console.log({ grossSalary, leaveDeduction, otherDeductions }, '---', { netSalary, totalBonusPay, totalIncentivesPay, totalOvertimePay, totalDeductionsPay, totalPayable })
                if (existingSalaryRecord) {
                    existingSalaryRecord.year = year
                    existingSalaryRecord.month = month
                    existingSalaryRecord.salaryCycleStart = cycleStart
                    existingSalaryRecord.salaryCycleEnd = cycleEnd
                    existingSalaryRecord.salaryCycleDays = cycleDays
                    existingSalaryRecord.attendancePercentage = attendancePercentage
                    existingSalaryRecord.salaryInformation = salaryInfo

                    existingSalaryRecord.leaveCount = leaveCount
                    existingSalaryRecord.leaveDeduction = leaveDeduction
                    existingSalaryRecord.otherDeductions = deductionsIds
                    existingSalaryRecord.totalOtherDeduction = totalDeductionsPay + otherDeductions

                    existingSalaryRecord.incentives = incentivesIds
                    existingSalaryRecord.totalIncentive = totalIncentivesPay
                    existingSalaryRecord.bonus = bonusIds
                    existingSalaryRecord.totalBonus = totalBonusPay
                    existingSalaryRecord.overtime = overtimeIds
                    existingSalaryRecord.totalOvertime = totalOvertimePay

                    existingSalaryRecord.totalPayable = parseFloat(totalPayable.toFixed(2))
                    existingSalaryRecord.paymentStatus = paymentStatus
                    existingSalaryRecord.status = true
                    existingSalaryRecord.message = 'Successfully salary generated'
                    // Written by this legacy engine, not processEmpSalary — never serve it
                    // as a pre-calculated row; the next Salary Process read recomputes it.
                    existingSalaryRecord.calculatedVersion = null
                    existingSalaryRecord.calculatedAt = null
                    existingSalaryRecord.calcHash = null
                    await existingSalaryRecord.save()
                    return true
                } else {
                    const salary = new Salary({
                        corporateUser: corporateUserID,
                        employee: employee._id,
                        year: year,
                        month: month,
                        salaryCycleStart: cycleStart,
                        salaryCycleEnd: cycleEnd,
                        salaryCycleDays: cycleDays,
                        attendancePercentage: attendancePercentage,
                        salaryInformation: salaryInfo,

                        leaveCount: leaveCount,
                        leaveDeduction: leaveDeduction,
                        otherDeductions: deductionsIds,
                        totalOtherDeduction: totalDeductionsPay + otherDeductions,

                        incentives: incentivesIds,
                        totalIncentive: totalIncentivesPay,
                        bonus: bonusIds,
                        totalBonus: totalBonusPay,
                        overtime: overtimeIds,
                        totalOvertime: totalOvertimePay,

                        totalPayable: parseFloat(totalPayable.toFixed(2)),
                        paymentStatus,
                        status: true,
                        message: 'Successfully salary generated'
                    });
                    await salary.save();
                    return true
                }
            } catch (error) {
                console.log("error from process salary")
                console.log({ error })
                return false
            }
        }))
        console.log({ b: `Promise ends, Time spent for processing: ${(new Date() - startTime) / 1000} s` });

        if (isEditable) {
            //need to make payroll settings non editable - after initial salary creation  payroll setting cannot be editable
            await restrictPayrollSettings(corporateUserID)
        }

        return { status: true, message: 'Success' }
    } catch (error) {
        return { status: false, message: `Faild to processing salary, ${error?.message}'` }
    }

}

exports.fetchSalaryByEmployeeId = async (params) => {
    try {
        const { salaryId, corporateUserID } = params
        const employeeSalary = await Salary.findOne({
            corporateUser: corporateUserID,
            _id: new ObjectId(salaryId),
        });
        if (!employeeSalary) {
            throw new Error("Salary information not found")
        }

        //before sending employeeSalary to user need to re precess for it 
        const { employee: employeeId, year, month, salaryCycleStart, salaryCycleEnd } = employeeSalary
        let { status, message } = await this.processSalary({
            month, year, corporateUserID,
            cycleStart: salaryCycleStart,
            cycleEnd: salaryCycleEnd,
            employeeId
        })
        if (!status) throw new Error(message)

        const updatedEmployeeSalary = await Salary.findOne({
            corporateUser: corporateUserID,
            _id: new ObjectId(salaryId),
        });

        // Calculate total allowance
        const totalAllowance =
            updatedEmployeeSalary.salaryInformation.travelAllowances +
            updatedEmployeeSalary.salaryInformation.homeAllowances +
            updatedEmployeeSalary.salaryInformation.medicalAllowances +
            updatedEmployeeSalary.salaryInformation.otherAllowances +
            updatedEmployeeSalary.salaryInformation.other

        // Add total allowance to the salary information
        updatedEmployeeSalary.salaryInformation.totalAllowance = totalAllowance;

        // Update other deductions
        updatedEmployeeSalary.totalOtherDeduction += updatedEmployeeSalary.leaveDeduction;
        updatedEmployeeSalary.totalOtherDeduction = updatedEmployeeSalary.totalOtherDeduction.toFixed(2);


        const salaryInfoWithTotalAllowance = { ...updatedEmployeeSalary.toObject(), totalAllowance };

        return {
            status: true,
            message: `Success`,
            data: salaryInfoWithTotalAllowance
        }
    } catch (error) {
        console.log({ error })
        return {
            status: false,
            message: `${error?.message || 'Faild to fetch salary details'}`,
            data: {}
        }
    }
}



exports.downloadPayslip = async (params) => {
    try {
        const { corporateUserID, employeeId, companyInfo, month, year } = params
        let salaryData = await findOneSalary({ corporateUserID, employeeId, month, year })//Find salary details with the salary id
       
        if (!salaryData) throw new Error("Salary information not found");
        if (salaryData.status == false) throw new Error(`Faild, ${salaryData.message}`);
        salaryData.companyInfo = companyInfo

        const data = await generatePdfFile(salaryData)

        return {
            status: true,
            message: `Email send successfully`,
            data: data
        }
    } catch (error) {
        console.log(error)
        return {
            status: false,
            message: `${error?.message}`,
            data: {}
        }
    }
}

exports.emailPayslip = async (req, params) => {
    try {
        const { corporateUserID, employeeId, month, year, companyInfo } = params
        const salaryData = await findOneSalary({ corporateUserID, employeeId,month, year })//Find salary details with the salary id
        if (!salaryData) throw new Error("Salary information not found");
        if (salaryData.status == false) throw new Error(`Faild, ${salaryData.message}`);
        salaryData.companyInfo = companyInfo

        const data = await emailPdfFile(req, salaryData)
        await updateEmailSent({ corporateUserID, employeeId,month, year })

        return {
            status: true,
            message: `Email send successfully`,
            data: data
        }
    } catch (error) {
        console.log(error)
        return {
            status: false,
            message: `Faild to send email,${error?.message}`,
            data: {}
        }
    }
}


/**
 * 
 * --------------------------------------------------------------------------------------------------
 */

function calculateNetHours(data) {
    let { startTime, endTime, breakTimeHrs } = data
    console.log({ data })
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Calculate the difference in milliseconds
    const diffMs = end - start;

    // Convert milliseconds to hours
    const totalHours = diffMs / (1000 * 60 * 60);

    // Subtract break time from total hours
    const netHours = totalHours - breakTimeHrs;

    return netHours;
}
function calculateAttendancePercentage(leaveDays, totalDays) {
    const presentDays = totalDays - leaveDays
    if (totalDays === 0) {
        return 100; // To avoid division by zero error
    }
    const attendance = ((presentDays / totalDays) * 100).toFixed(2);
    return parseFloat(attendance)
}
function getPreviousMonths(year, month, deduction) {

    let adjustedYear = year;
    let adjustedMonth = month - deduction;

    if (adjustedMonth < 1) {
        adjustedMonth += 12;
        adjustedYear--;
    }
    return { year: adjustedYear, month: adjustedMonth };
}




//function generate pdf file and email
async function emailPdfFile(req, salaryData) {
    return new Promise(async (resolve, reject) => {
        try {
            let { month, year } = salaryData
            let id = salaryData?.employee?.employeeInformation?.employeeId || 123
            const payingdate = salaryData?.payingDate;
            let readablePayingDate = "N/A";
            if (payingdate) {
                const date = new Date(payingdate);
                readablePayingDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            // Now include this formatted date in your parameters
            salaryData.readablePayingDate = readablePayingDate;
            const html = payslipHtmlAE(salaryData);
            let fileName = `${id}-PaySlip-${month}-${year}`
            let ranDomNumber = Math.floor(Math.random() * (1000 - 1 + 1)) + 1;
            // Private temp dir (never under public/); file names built from data are sanitized.
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'payroll-pdf-'));
            const safeName = sanitizeFileName(`${fileName}-${ranDomNumber}`);
            const inputFile = path.join(tmpDir, `${safeName}.html`);
            const outputFile = path.join(tmpDir, `${safeName}.pdf`);
            fs.writeFile(inputFile, html, async (err) => {
                if (err) {
                    console.error(err);
                    removeTmpDir(tmpDir);
                    reject(err)
                } else {
                    console.log('HTML File saved!');

                    const pdfOptions = {
                        pageSize: 'A4',
                        // orientation: 'Landscape', // Set the orientation to Landscape
                        output: outputFile,
                        disableJavascript: true
                    };

                    wkhtmltopdf(fs.createReadStream(inputFile), pdfOptions, async (pdfErr) => {
                        if (pdfErr) {
                            console.error(`Error generating PDF: ${pdfErr}`);
                            removeTmpDir(tmpDir);
                            reject(pdfErr)
                        } else {
                          try {
                            console.log(`PDF file written to ${outputFile}`);
                            console.log(`PDF file written to ${outputFile}`);
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const monthName = monthNames[(salaryData?.month || 1) - 1];
                            const resolved = await resolveDynamicEmail({
                                req,
                                key: PAYROLL_EMAIL_TEMPLATE_KEYS.PAYSLIP_EMAIL,
                                variables: {
                                    monthName: monthName || '',
                                    companyName: salaryData?.companyInfo?.companyName || '',
                                    employeeName: salaryData?.employee?.personalInformation?.fullName || '',
                                    hrManagerName: salaryData?.officialDocuments?.hrManagerName || '',
                                    year: salaryData?.year || '',
                                    // branding shows the employer's own company in the header;
                                    // it's not a genuine Peko reseller partner, so
                                    // footerBranding overrides it back to Peko for the
                                    // footer's partner-icon-hiding gate.
                                    ...v2LayoutVariables({
                                        website: salaryData?.companyInfo?.website,
                                        logo: salaryData?.companyInfo?.logo,
                                        branding: salaryData?.companyInfo?.companyName,
                                        footerBranding: 'Peko',
                                    }),
                                },
                                fallbackSubject: 'Payslip',
                                fallbackHtml: paySlipEmailTemplate(salaryData),
                                partnerId: req?.user?.registeredBy || null,
                            });
                            let to = salaryData.employee.personalInformation.email

                            // Call email function to send email with payment details in the body
                            let { status, message } = await emailer.emailWithAttachment(to, resolved.subject, resolved.html, `${fileName}.pdf`, outputFile)
                            if (!status) {
                                reject(new Error(message))
                            }
                            console.log("Email sent to " + to);
                            resolve(true)
                          } catch (sendErr) {
                            reject(sendErr)
                          } finally {
                            // Delete the temp files
                            removeTmpDir(tmpDir);
                          }
                        }
                    });
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

//function that generate pdf file and return as buffer
async function generatePdfFile(salaryData) {
  return new Promise(async (resolve, reject) => {
    try {
      let { month, year } = salaryData;
      let id = salaryData?.employee?.employeeInformation?.employeeId || 123;
      const html = payslipHtmlAE(salaryData);
      let fileName = `${id}-PaySlip-${month}-${year}`;
      let ranDomNumber = Math.floor(Math.random() * 1000) + 1;
      // Private temp dir (never under public/); file names built from data are sanitized.
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'payroll-pdf-'));
      const safeName = sanitizeFileName(`${fileName}-${ranDomNumber}`);
      const inputFile = path.join(tmpDir, `${safeName}.html`);
      const outputFile = path.join(tmpDir, `${safeName}.pdf`);
      const cleanupTmp = () => removeTmpDir(tmpDir);
      // const inputFile = `${fileName}-${ranDomNumber}.html`;
      // const outputFile = `${fileName}-${ranDomNumber}.pdf`;

      /* -------------------------
         1. Save HTML
      -------------------------- */
      fs.writeFile(inputFile, html, { encoding: "utf8" }, async (err) => {
        if (err) {
          cleanupTmp();
          return reject(err);
        }

        /* -------------------------
           2. FIXED wkhtmltopdf OPTIONS
        -------------------------- */
        const pdfOptions = {
          pageSize: "A4",
          encoding: "UTF-8",
          printMediaType: true,
          disableJavascript: true,

          marginTop: "10mm",
          marginBottom: "10mm",
          marginLeft: "10mm",
          marginRight: "10mm",

          disableSmartShrinking: true
        };

        wkhtmltopdf(html, pdfOptions, async (pdfErr, stream) => {
          if (pdfErr) {
            cleanupTmp();
            return reject(pdfErr);
          }

          const writeStream = fs.createWriteStream(outputFile);
          stream.pipe(writeStream);

          writeStream.on("finish", async () => {
            try {
              const pdfData = fs.readFileSync(outputFile);
              cleanupTmp();
              resolve({ pdfData, filename: fileName });
            } catch (readErr) {
              cleanupTmp();
              reject(readErr);
            }
          });

          writeStream.on("error", (err) => {
            cleanupTmp();
            reject(err);
          });
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

/* -------------------------
   Temp file helpers
-------------------------- */
function sanitizeFileName(name) {
  return String(name).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function removeTmpDir(dir) {
  if (!dir) return;
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) {
    console.error(`Error removing temp dir ${dir}: ${e?.message}`);
  }
}





exports.generateSalaryHistoryReportPdf = async ({ reportData, companyInfo, month, year }) => {
  return new Promise((resolve, reject) => {
    try {
      const html = salaryHistoryReportHtml({ reportData, companyInfo, month, year });

      const fileName = `SalaryReport-${month}-${year}`;
      const ranDomNumber = Math.floor(Math.random() * 1000) + 1;
      // Private temp dir (never under public/); file names built from data are sanitized.
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'payroll-pdf-'));
      const safeName = sanitizeFileName(`${fileName}-${ranDomNumber}`);
      const inputFile = path.join(tmpDir, `${safeName}.html`);
      const outputFile = path.join(tmpDir, `${safeName}.pdf`);
      const cleanupTmp = () => removeTmpDir(tmpDir);

      const pdfOptions = {
        pageSize: 'A4',
        orientation: 'Landscape',
        encoding: 'UTF-8',
        printMediaType: true,
        disableJavascript: true,
        marginTop: '10mm',
        marginBottom: '10mm',
        marginLeft: '10mm',
        marginRight: '10mm',
        disableSmartShrinking: true,
      };

      fs.writeFile(inputFile, html, { encoding: 'utf8' }, (writeErr) => {
        if (writeErr) {
          cleanupTmp();
          return reject(writeErr);
        }

        wkhtmltopdf(html, pdfOptions, (pdfErr, stream) => {
          if (pdfErr) {
            cleanupTmp();
            return reject(pdfErr);
          }
          const ws = fs.createWriteStream(outputFile);
          stream.pipe(ws);
          ws.on('finish', () => {
            try {
              const pdfData = fs.readFileSync(outputFile);
              cleanupTmp();
              resolve({ pdfData, filename: `${fileName}.pdf` });
            } catch (readErr) {
              cleanupTmp();
              reject(readErr);
            }
          });
          ws.on('error', (err) => {
            cleanupTmp();
            reject(err);
          });
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};

exports.extractStatementParams = (req) => {

    const corporateUserID = req.user._id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Adding 1 since getMonth() returns a zero-based index
    let currentYear = currentDate.getFullYear();
    const searchText = req.query.searchText || ''; // Search text from query params
    const month = parseInt(req.query.month) || currentMonth;
    const year = parseInt(req.query.year) || currentYear;

    return { corporateUserID, currentDate, currentMonth, currentYear, searchText, month, year };
}

exports.calculateSalaryCycle = async (req) => {
    try {
        let { corporateUserID, month, year } = this.extractStatementParams(req);

        //# 01
        let { payrollSettings: { salaryCycleDay } = {} } = await HrSettings.findOne({ corporateUser: corporateUserID });
        if (salaryCycleDay === undefined || typeof salaryCycleDay !== 'number' || !Number.isInteger(salaryCycleDay)) {
            throw new Error('HR settings not found or invalid salary cycle day for this corporate user')
        }
        // // to adjust the cycle based on salary cycle day
        // if (salaryCycleDay < 15) {
        //     if (month === 12) {
        //         month = 1;
        //         year += 1;
        //     } else {
        //         month += 1;
        //     }
        // }

        //# 02
        let { cycleStart, cycleEnd } = await this.calculateSalaryCycleBasedOnMonth(month, year, salaryCycleDay, corporateUserID)
        return {
            status: true,
            cycleStart, cycleEnd, month, year
        }

    } catch (error) {
        return {
            status: false,
            message: error.message || 'Something went wrong'
        }
    }
}



function getYearlyDays(year) {
    function isLeapYear(year) {
        // Leap years are divisible by 4
        // but not divisible by 100 unless also divisible by 400
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    const leapYear = isLeapYear(year);
    return leapYear ? 366 : 365;
}


// F-PRL-21: these two functions are never called anywhere in payroll — the real cron jobs
// run in the separate `scheduler` microservice, which has its own independent copies. Left
// here commented out (not deleted) per request. If ever re-enabled: updateSalaryStatus marks
// EVERY company's salary PAID on its paying date with zero check that a payment actually
// succeeded — do not wire this back in without adding a real payment-success check first.
//
// exports.updateSalaryStatus = async (req) => {
//     try {
//         const today = new Date();
//         let fetchAllSalaries = await Salary.find({});
//
//         fetchAllSalaries.forEach(async salary => {
//             const payingDate = salary.payingDate;
//
//             // Check if payingDate exists and today's date is equal to payingDate
//             if (payingDate && today.toISOString().slice(0, 10) === payingDate.toISOString().slice(0, 10)) {
//                 console.log("Today's date matches:", salary);
//                 await Salary.updateOne(
//                     { _id: salary._id },
//                     { paymentStatus: 'PAID' }
//                 );
//             }
//         });
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// }
//
//
// exports.sendPayrollSlip = async (req) => {
//     try {
//         const today = new Date();
//         let fetchAllSalaries = await Salary.find({});
//
//         fetchAllSalaries.forEach(async salary => {
//             const payingDate = salary.payingDate;
//
//             // Check if payingDate exists and today's date is equal to payingDate
//             if (payingDate && today.toISOString().slice(0, 10) === payingDate.toISOString().slice(0, 10)) {
//                 console.log("Today's date matches:", salary);
//
//                 const corporateUserID = salary.corporateUser;
//                 const salaryId = salary._id;
//                 let companyInfo = {}
//
//                 const salaryData = await findOneSalary({ corporateUserID, salaryId })//Find salary details with the salary id
//                 if (!salaryData) throw new Error("Salary information not found");
//                 if (salaryData.status == false) throw new Error(`Failed, ${salaryData.message}`);
//                 salaryData.companyInfo = companyInfo
//
//                 const data = await emailPdfFile(req, salaryData)
//                 await updateEmailSent({ corporateUserID, salaryId })
//             }
//         });
//     } catch (error) {
//         console.log(error)
//         return {
//             status: false,
//             message: `Failed to send email, ${error?.message}`,
//             data: {}
//         }
//     }
// }

exports.calculateEmpSalaryCycleBasedOnMonth = async (month, year, salaryCycleDay, corporateUserID) => {
    month = Number(month);
    year = Number(year);
    let tempMonth = month
    let tempYear = year
    // to adjust the cycle based on salary cycle day
    if (salaryCycleDay < 15) {
        if (month === 12) {
            month = 1;
            year += 1;
        } else {
            month = month + 1;
        }
    }
    let daysInMonth = getDaysInMonth(month, year)
    let salaryCycleDaysCurrent

    // updated salary cycle day based on current month's days
    if (salaryCycleDay > daysInMonth) {
        salaryCycleDaysCurrent = daysInMonth
    } else {
        salaryCycleDaysCurrent = salaryCycleDay
    }

    let daysInPastMonth = getDaysInPreviousMonth(month, year)

    let salaryCycleDaysPrevious
    if (salaryCycleDay > daysInPastMonth) {
        salaryCycleDaysPrevious = daysInPastMonth
    } else {
        salaryCycleDaysPrevious = salaryCycleDay
    }
    let { year: y1, month: m1 } = getPreviousMonths(year, month, 1)
    let cycleStart = moment.utc([y1, m1 - 1, salaryCycleDaysPrevious]).startOf('day').toDate();
    let { year: y2, month: m2 } = getPreviousMonths(year, month, 0)
    let cycleEnd = moment.utc([y2, m2 - 1, salaryCycleDaysCurrent]).endOf('day').subtract(1, 'days').toDate(); //subtract 1 day- avoid over lapping

    //cycleStart is last month cycleEnd || above calculated
    let { previousMonth, previousYear } = getPreviousMonthAndYear(tempMonth, tempYear)
    let lastMonthsSalaryDetails = await isSalaryProcessedForMonthYearCorporateUser(previousMonth, previousYear, corporateUserID)
    if (lastMonthsSalaryDetails && lastMonthsSalaryDetails?.salaryCycleEnd) {
        let newDate = moment.utc(lastMonthsSalaryDetails.salaryCycleEnd).startOf('day').add(1, 'days');
        cycleStart = newDate.toDate();
    }
    return { cycleStart, cycleEnd }
}

// exports.processEmpSalary = async (params) => {
//     try {
//         const currentDate = new Date();
//         let { month, year, corporateUserID, cycleStart, cycleEnd, employeeId } = params
//         let paymentStatus = cycleEnd >= currentDate ? 'UPCOMING' : 'PENDING'

//         const cycleDays = getDaysDifference(cycleStart, cycleEnd)
//         if (cycleDays === undefined || typeof cycleDays !== 'number' || !Number.isInteger(cycleDays)) {
//             throw new Error('Invalid cycle duration');
//         }
//         let { payrollSettings: { salaryCycleDay, payrollStartsFrom, isEditable } = {} } = await getSalaryCycleDay(corporateUserID );
//         // let salaryCycleDay = 17
//         // let { payrollSettings: { payrollFrom, isEditable } = {} } = await OrganizationSetting.findOne({ corporateUser: corporateUserID });

//         let employees = await fetchEmployeesForGenerateSalary(corporateUserID, cycleStart, cycleEnd, employeeId)
//         let salariesArray = [];//for bulk create
//         console.log({ a: 'Promise start' }, employees)
//         const startTime = new Date(); // Record start time
//         const updatedResponses = await Promise.all(employees.map(async (employee) => {
//             try {
//                 const { dateOfJoin: doj, status } = employee.employeeInformation
//                 const lastWorkingDay = employee?.offBoardingInformation?.lastWorkingDay || false
//                 const employeeId = employee._id
//                 // Check if status is SUSPENDED or RESIGNED and lastWorkingDay is after cycleStart
//                 if ((status == 'SUSPENDED' || status == 'RESIGNED') && lastWorkingDay < cycleStart) {
//                     return false
//                 }

//                 // let salaryInfo = employee.salaryComponents;
//                 //  let calculatedTax = await calculateTax({regime:"old", ctc:110000,basicSalary:1041667,dearnessAllowance:520834,hra:35000,
//         // conveyanceAllowance:7500,medicalAllowance:10000,bonus:12500,overTime:15000,pf:12,pfOpted:true,pfOptedVoluntary:1,rebate87:true,rentPaid:100000,fy:2024-25})    
    
//                     /* Fetch salary components */ 
//                     //   const componentSalary = await getEmployeeSalaryComponentForProcessSalary({corporateUserID, employeeId, month, year})
//                       let salaryInfo = await getEmployeeSalaryComponentForProcessSalary({corporateUserID, employeeId, month, year})
//                     /* Fetch deduction components */   
//                     /* Fetch overtime components */   
//                     /* Fetch bonus components */   
                
//                 //

//                 // let salaryInfo = employee.salaryComponents[0].component.amountPercentage;
//                 // console.log("1==>>>>11", JSON.stringify(componentSalary, null, 2))
//                 console.log("1==>>>>121", JSON.stringify(salaryInfo, null, 2))
//                 // console.log("1==>>>>", employee._id)


//                 const existingSalaryRecord = await findOneSalaryForReprocessing({ corporateUserID, employeeId: employee._id, year, month, cycleStart, cycleEnd })
//                 if (existingSalaryRecord && (existingSalaryRecord.paymentStatus === 'PAID' || existingSalaryRecord.paymentStatus === 'APPROVED' || existingSalaryRecord.paymentStatus === 'COMPLETED')) return false

//                 //get the unpaid leaves taken by this employee during this period
//                 let { leaveCount } = await fetchLeavesByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)
//                 // leaveCount=1;
//                 console.log("==>", leaveCount)
//                 //get other days to be deducted like late join / if first payroll is after than cycle start
//                 let { deductionDays } = await this.fetchDeductionDays({ corporateUserID, month, year, doj, lastWorkingDay, salaryCycleDay, payrollStartsFrom })
//                 console.log("==>", deductionDays)
//                 // need to adjust basic pay with increments for future and past unpaid salary recalculation
//                 // salaryInfo.basicPay = await fetchAdjustedBasicPay({ basicPay: salaryInfo?.basicPay || 0, corporateUserID, dateOfJoin: doj, employeeId, month, year })
//                 // salaryInfo.basicPay = await fetchAdjustedBasicPay({ basicPay: salaryInfo || 0, corporateUserID, dateOfJoin: doj, employeeId, month, year })
//                 const basicSalaryEntry = salaryInfo.salaryComponents.find(
//                     c => c.componentName === "Basic Salary"
//                 );

//                 salaryInfo.salaryComponents = salaryInfo.salaryComponents.map(c => {
//                     if (c.componentName === "Basic Salary") {
//                         return {
//                             ...c,
//                             calculatedAmount: salaryInfo.adjustedBasic
//                         };
//                     }
//                     return c;
//                 });

//                 let basicPay1 = basicSalaryEntry?.calculatedAmount || 0;
//                 // salaryInfo = await fetchAdjustedBasicPay({ basicPay: salaryInfo || 0, corporateUserID, dateOfJoin: doj, employeeId, month, year })
//                 salaryInfo = await fetchAdjustedBasicPay({
//                     basicPay1,
//                     corporateUserID,
//                     dateOfJoin: doj,
//                     employeeId,
//                     month,
//                     year
//                 });
                
                

//                 console.log("---->>>>", salaryInfo, basicPay1)

//                 //calculate the salary payable after deducting the leave
//                 // let { basicPay, travelAllowances, homeAllowances, medicalAllowances, otherAllowances, other } = salaryInfo
//                 let basicPay = 20000, travelAllowances = 1000, homeAllowances = 500, medicalAllowances = 500, otherAllowances = 100, other = 400;
//                 let grossSalary = (basicPay || 0) + (travelAllowances || 0) + (homeAllowances || 0) + (medicalAllowances || 0) + (otherAllowances || 0) + (other || 0);

//                 let perDayRate = grossSalary / cycleDays
//                 let leaveDeduction = (perDayRate * leaveCount)
//                 let otherDeductions = (perDayRate * deductionDays)
//                 let netSalary = grossSalary - leaveDeduction - otherDeductions
//                 let attendancePercentage = calculateAttendancePercentage(leaveCount, cycleDays)


//                 //get the additional payments that needs to be add with salary
//                 let { totalIncentivesPay, incentivesIds } = await fetchIncentivesByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)
//                 console.log("employee",employee._id)
//                 let { totalBonusPay, bonusIds } = await fetchBonusByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)
//                 // let { totalBonusPay, bonusIds } = await fetchBonusByEmployeeAndCorporateUser("681444d255ba09a511b1cf2b", corporateUserID, cycleStart, cycleEnd)
//                 let { totalOvertimePay, overtimeIds } = await fetchOvertimeByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)
//                 // if (employeeId == '66123bd96034f6b8bfca1ec7') {
//                 //     console.log({ totalIncentivesPay, incentivesIds, totalBonusPay, bonusIds, totalOvertimePay, overtimeIds, employeeId })
//                 // }
//                 //get the additional deductions that needs to be deducted form the salary
//                 let { totalDeductionsPay, deductionsIds } = await fetchDeductionsByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)
//                 console.log({ leaveCount, deductionDays, totalDeductionsPay, otherDeductions })


//                 //calculate the total salary payable to employee
//                 let totalPayable = netSalary + totalBonusPay + totalIncentivesPay + totalOvertimePay - totalDeductionsPay
//                 // console.log({ grossSalary, leaveDeduction, otherDeductions }, '---', { netSalary, totalBonusPay, totalIncentivesPay, totalOvertimePay, totalDeductionsPay, totalPayable })
//                 if (existingSalaryRecord) {
//                     existingSalaryRecord.year = year
//                     existingSalaryRecord.month = month
//                     existingSalaryRecord.salaryCycleStart = cycleStart
//                     existingSalaryRecord.salaryCycleEnd = cycleEnd
//                     existingSalaryRecord.salaryCycleDays = cycleDays
//                     existingSalaryRecord.attendancePercentage = attendancePercentage
//                     // existingSalaryRecord.salaryInformation = salaryInfo
//                     existingSalaryRecord.salaryInformation = { basicPay: 20000, homeAllowances, medicalAllowances, other, otherAllowances, travelAllowances }

//                     existingSalaryRecord.leaveCount = leaveCount
//                     existingSalaryRecord.leaveDeduction = leaveDeduction
//                     existingSalaryRecord.otherDeductions = deductionsIds
//                     existingSalaryRecord.totalOtherDeduction = totalDeductionsPay + otherDeductions

//                     existingSalaryRecord.incentives = incentivesIds
//                     existingSalaryRecord.totalIncentive = totalIncentivesPay
//                     existingSalaryRecord.bonus = bonusIds
//                     existingSalaryRecord.totalBonus = totalBonusPay
//                     existingSalaryRecord.overtime = overtimeIds
//                     existingSalaryRecord.totalOvertime = totalOvertimePay

//                     existingSalaryRecord.totalPayable = parseFloat(totalPayable.toFixed(2))
//                     existingSalaryRecord.paymentStatus = paymentStatus
//                     existingSalaryRecord.status = true
//                     existingSalaryRecord.message = 'Successfully salary generated'
//                     await existingSalaryRecord.save()
//                     return true
//                 } else {
//                     const salary = new Salary({
//                         corporateUser: corporateUserID,
//                         employee: employee._id,
//                         year: year,
//                         month: month,
//                         salaryCycleStart: cycleStart,
//                         salaryCycleEnd: cycleEnd,
//                         salaryCycleDays: cycleDays,
//                         attendancePercentage: attendancePercentage,
//                         // salaryInformation: salaryInfo,
//                         salaryInformation: {
//                             basicPay: 20000, incentiveAmount: 200,
//                             increamentAmount: 300,
//                             overtimeAmount: 400,
//                             deductionAmount: 500,
//                             tdsAmount: 1000,
//                             leavesAmount: 100,
//                             otherAmount: 100,
//                             esiAmount: 100,
//                             epfAmount: 120,
//                             lwfAmount: 4000
//                         },

//                         leaveCount: leaveCount,
//                         leaveDeduction: leaveDeduction,
//                         otherDeductions: deductionsIds,
//                         totalOtherDeduction: totalDeductionsPay + otherDeductions,

//                         incentives: incentivesIds,
//                         totalIncentive: totalIncentivesPay,
//                         bonus: bonusIds,
//                         totalBonus: totalBonusPay,
//                         overtime: overtimeIds,
//                         totalOvertime: totalOvertimePay,





//                         totalPayable: parseFloat(totalPayable.toFixed(2)),
//                         paymentStatus,
//                         status: true,
//                         message: 'Successfully salary generated'
//                     });
//                     await salary.save();
//                     return true
//                 }
//             } catch (error) {
//                 console.log("error from process salary")
//                 console.log({ error })
//                 return false
//             }
//         }))
//         console.log({ b: `Promise ends, Time spent for processing: ${(new Date() - startTime) / 1000} s` });

//         if (isEditable) {
//             //need to make payroll settings non editable - after initial salary creation  payroll setting cannot be editable
//             await restrictPayrollSettings(corporateUserID)
//         }

//         return { status: true, message: 'Success' }
//     } catch (error) {
//         return { status: false, message: `Faild to processing salary, ${error?.message}'` }
//     }

// }


const getComponentAmount = (components, name) =>
  components.find(c =>
    (c.componentName || c.deductionName) === name
  )?.calculatedAmount || 0;

// Bump whenever processEmpSalary's calculation rules change — every pre-calculated Salary
// row stored by an older version is then recalculated on its next read (salarySync
// isRowFresh). 2: non-employed days counted in working days for working-day payrolls.
// 3: Loss of Pay scales earnings; one-time recoveries (Add Deduction) come off net pay.
// 4: joiner/leaver part months prorate earnings and deductions; net pay rounded to the rupee.
const SALARY_CALC_ENGINE_VERSION = 4;
exports.SALARY_CALC_ENGINE_VERSION = SALARY_CALC_ENGINE_VERSION;

// Key-order-independent fingerprint of one processEmpSalary result — compared against the
// previous run's calcHash to tell whether a recalculation has settled (see processEmpSalary).
const toStableValue = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof ObjectId) return value.toString();
  if (Array.isArray(value)) return value.map(toStableValue);
  if (typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = toStableValue(value[key]);
      return acc;
    }, {});
  }
  return value;
};

const hashSalaryCalculation = (computedSalary) =>
  crypto.createHash('sha1').update(JSON.stringify(toStableValue(computedSalary))).digest('hex');



/**
 * Build salaryInformation (old schema) from dynamic salary & deduction components
 */
function buildSalaryInformation({
  salaryComponents,
  deductionComponents,
  baseBasic,
  adjustedBasic,
  totalBonusPay,
  totalIncentivesPay,
  totalOvertimePay,
  leaveDeduction,
  monthlyTDS,
  tdsSource = 'CALCULATED',
  taxResult,
  lwfAmount = 0,
  arrearsPfTopUp = 0,
  arrearsBasic = 0,
  esiEmployeeAmount = 0,
  employerPfBreakup = null
}) {
  // Arrears attract PF on their Basic portion — see the arrearsPfTopUp comment in
  // processEmpSalary — added on top of the regular PF deduction computed from this
  // month's own Basic, zero for anyone with no arrears payout this month.
  const epfAmount = getComponentAmount(deductionComponents, "Provident Fund (PF)") + arrearsPfTopUp;
  // Unlike Provident Fund, ESI is never modeled as an actual DeductionComponent row (it's a
  // pure statutory formula — see resolveEsi in ctcCalculator.js) — getComponentAmount(...,
  // "ESI") would always return 0 here since no such row ever exists to find. The caller
  // (processEmpSalary) computes the real eligibility/amount via resolveEsi and passes it
  // in as esiEmployeeAmount instead.
  const esiAmount = esiEmployeeAmount;

  const hraAmount = getComponentAmount(salaryComponents, "House Rent Allowance");
  const daAmount = getComponentAmount(salaryComponents, "Dearness Allowance");

  const other = salaryComponents
    .filter(c =>
      !["Basic Salary", "House Rent Allowance", "Dearness Allowance"]
        .includes(c.componentName)
    )
    .reduce((sum, c) => sum + (c.calculatedAmount || 0), 0);

  // Includes all deductions plus LWF and ESI (both computed live — lwfCalc.js and
  // resolveEsi respectively — neither is ever configured as an actual DeductionComponent,
  // so both are threaded in separately here rather than read off deductionComponents).
    const deductionAmount = deductionComponents.reduce(
      (sum, d) => sum + (d.calculatedAmount || 0),
      0
    ) + lwfAmount + arrearsPfTopUp + esiAmount;

  return {
    basicPay: adjustedBasic,
    increamentAmount: adjustedBasic - baseBasic,

    hraAmount,
    daAmount,

    bonus: totalBonusPay,
    incentiveAmount: totalIncentivesPay,
    overtimeAmount: totalOvertimePay,

    leavesAmount: leaveDeduction,
    arrearsBasic,

    epfAmount,
    esiAmount,
    lwfAmount,
    deductionAmount,

    tdsAmount: Math.round(monthlyTDS || 0),
    tdsSource,
    other,
    // The exact per-component breakdown at the moment payroll ran — `other` above is only
    // the lump sum (kept for backward-compat callers), which loses which named component
    // contributed what. Persisting the real split here means anything reading this Salary
    // record later (e.g. the Salary Profile page) shows each component's true amount
    // instead of reconstructing an approximate one from the live, possibly-since-changed
    // structure.
    earnings: salaryComponents.map(c => ({ componentName: c.componentName, calculatedAmount: c.calculatedAmount || 0 })),
    deductions: deductionComponents.map(d => ({ componentName: d.deductionName, calculatedAmount: d.calculatedAmount || 0 })),
    taxInformation: {
      fy: taxResult?.fy || "",
      regime: taxResult?.regime || "new",
      grossAnnual: taxResult?.grossAnnual || 0,
      standardDeduction: taxResult?.standardDeduction || 0,
      hraExemption: taxResult?.hraExemption || 0,
      deduction80C: taxResult?.deduction80C || 0,
      deduction80GG: taxResult?.deduction80GG || 0,
      exemptions:
        (taxResult?.standardDeduction || 0) +
        (taxResult?.hraExemption || 0) +
        (taxResult?.deduction80C || 0) +
        (taxResult?.deduction80GG || 0),
      taxableIncome: taxResult?.taxableIncome || 0,
      slabBreakdown: taxResult?.slabBreakdown || [],
      taxBeforeRebate: taxResult?.taxBeforeRebate || 0,
      rebate: taxResult?.rebate || 0,
      marginalRelief: taxResult?.marginalRelief || 0,
      rebateLimit: taxResult?.rebateLimit || 0,
      tax: taxResult?.tax || 0,
      surcharge: taxResult?.surcharge || 0,
      surchargeRate: taxResult?.surchargeRate || 0,
      surchargeThreshold: taxResult?.surchargeThreshold || 0,
      surchargeBeforeRelief: taxResult?.surchargeBeforeRelief || 0,
      cess: taxResult?.cess || 0,
      totalTax: taxResult?.totalTax || 0,
      tdsMonthly: taxResult?.tdsPerMonth || 0
    },
    ...(employerPfBreakup ? {
      epfBreakup: {
        pfWage: employerPfBreakup.pfWage || 0,
        pfWageCeiling: employerPfBreakup.ceiling || 0,
        employeeEpf: employerPfBreakup.employeeEpf || 0,
        employerEps: employerPfBreakup.employerEps || 0,
        employerEpf: employerPfBreakup.employerEpf || 0,
        edli: employerPfBreakup.edli || 0,
        adminCharges: employerPfBreakup.adminCharges || 0,
        employerTotal: employerPfBreakup.employerTotal || 0,
        totalDeposit: employerPfBreakup.totalDeposit || 0,
      }
    } : {})
  };
}











// const { fetchAdjustedBasicPay } = require("../services/payroll.helpers");

exports.processEmpSalary = async (params) => {
  try {
    const {
      month,
      year,
      corporateUserID,
      cycleStart,
      cycleEnd,
      employeeId,
      employeeIds,
      payrollStartsFrom,
      salaryCycleDay,
      // Employees whose APPROVED (not yet paid) salary must be recomputed — set only by a
      // Loss of Pay save. Run Payroll approves the month as soon as it opens, so without
      // this HR could not correct LOP between review and payout. Their status stays
      // APPROVED and the variable pay already settled at approval is kept as recorded.
      recomputeApprovedEmployeeIds = []
    } = params;
    const recomputeApproved = new Set((recomputeApprovedEmployeeIds || []).map(String));
    const paymentStatus =
      cycleEnd >= new Date() ? "UPCOMING" : "PENDING";

    // Safety net: headcount may have reached 20 through a path that didn't switch EPF back
    // on — do it before settings are read, so this run already deducts PF.
    await ensureEpfEnabledWhenMandatory(corporateUserID);

    // Fetch tax regime and FY from compliance settings
    const complianceSettingsArr = await getComplianceSettingsUsingCorporateId(corporateUserID);
    const complianceSettings = complianceSettingsArr?.[0];
    const rawRegime = complianceSettings?.tds?.taxRegime || "New Tax Regime";
    const taxRegime = rawRegime === "Old Tax Regime" ? "old" : "new";

    // Derive Indian financial year: Apr–Mar
    const numMonth = Number(month);
    const numYear = Number(year);
    const fyStart = numMonth >= 4 ? numYear : numYear - 1;
    const fyEnd = (fyStart + 1).toString().slice(-2);
    const fy = `${fyStart}-${fyEnd}`;

    const cycleDays = getDaysDifference(cycleStart, cycleEnd);
    if (!cycleDays) throw new Error("Invalid cycle duration");

    const organizationSetting = await OrganizationSetting.findOne({ corporateUser: corporateUserID }).select('payrollSettings.calculateSalaryBasedOn payrollSettings.selectWorkingDays').lean();
    const perDayDivisor = resolvePerDayDivisor(cycleStart, cycleEnd, cycleDays, organizationSetting?.payrollSettings);

    // An empty employeeIds list means "nobody" (see salarySync.ensureSalaryRecords), not
    // "everyone" — guard it here rather than letting it fall through to the whole payroll.
    if (Array.isArray(employeeIds) && employeeIds.length === 0) {
      return { status: true, message: "Success" };
    }

    const employees = await fetchEmployeesForGenerateSalary(
      corporateUserID,
      cycleStart,
      cycleEnd,
      employeeIds || employeeId
    );

    const lossOfPayByEmployee = await findLossOfPayForMonth({ corporateUserID, month, year });

    // const hasEmployeeWithoutDepartment = employees.some(emp =>
    //   emp?.employeeInformation?.department == null
    // );

    // if (hasEmployeeWithoutDepartment) {
    //  return { status: false, message:"Please add department to all employees" };
    // }

    await Promise.all(employees.map(async (employee) => {
      const calcStartedAt = new Date();
      const empId = employee._id;
      const { dateOfJoin: doj, status } = employee.employeeInformation;
      const lastWorkingDay = employee?.offBoardingInformation?.lastWorkingDay;

      if (
        (status === "SUSPENDED" || status === "RESIGNED") &&
        lastWorkingDay < cycleStart
      ) return;
      /* ---------------------------
     0. Prevent editing paid salaries
  ---------------------------- */
      const existingSalaryPaid = await findOneSalaryForReprocessing({
        corporateUserID,
        employeeId: empId,
        year,
        month,
        cycleStart,
        cycleEnd
      });

      const isApprovedRecompute = !!existingSalaryPaid
        && existingSalaryPaid.paymentStatus === "APPROVED"
        && recomputeApproved.has(String(empId));
      if (existingSalaryPaid && ["PAID", "APPROVED", "COMPLETED"].includes(existingSalaryPaid.paymentStatus) && !isApprovedRecompute) {
        return;
      }
      // Read before any input below, so a markSalaryStale ($inc staleVersion) landing
      // mid-calculation leaves calculatedVersion behind staleVersion — the row stays stale.
      const staleVersionAtStart = existingSalaryPaid?.staleVersion || 0;

      /* ---------------------------
         1. Fetch components
      ---------------------------- */
      const lopEntry = lossOfPayByEmployee.get(String(empId));
      // Joiner/leaver part month: days paid ÷ days in month, on the Payroll Cycle basis.
      const partMonth = resolvePartMonthDays({
        cycleStart,
        cycleEnd,
        dateOfJoin: doj,
        lastWorkingDay,
        payrollStartsFrom,
        payrollSettings: organizationSetting?.payrollSettings,
      });
      const componentData =
        await getEmployeeSalaryComponentForProcessSalary({
          corporateUserID,
          employeeId: empId,
          month,
          year,
          partMonth: { eligibleDays: partMonth.eligibleDays, daysInMonth: partMonth.daysInMonth },
          lossOfPay: lopEntry
            ? { days: lopEntry.days, amount: lopEntry.amount, isAmountOverridden: lopEntry.isAmountOverridden, daysInMonth: perDayDivisor }
            : null
        });

      const salaryComponents = componentData.salaryComponents;
      const deductionComponents = componentData.deductionComponents;
      // Present only when LOP applies this month.
      const lossOfPay = componentData.lossOfPay || null;
      // Present when LOP and/or a joiner/leaver part month applies — salaryComponents/
      // deductionComponents above are then already the PAID figures; this carries the
      // full-month ones.
      const proration = componentData.proration || null;
      const paidShare = proration ? proration.paidShare : 1;

      /* ---------------------------
         2. Base basic
      ---------------------------- */
      const baseBasic =
        getComponentAmount(salaryComponents, "Basic Salary");

      /* ---------------------------
         3. Increment
      ---------------------------- */
      const incrementedBasic =
        await fetchAdjustedBasicPay({
          baseBasic,
          corporateUserID,
          dateOfJoin: doj,
          employeeId: empId,
          month,
          year
        });

      // baseBasic is already the PAID Basic when Loss of Pay / a part month applies, so the
      // increment is scaled by the same paid share; fullAdjustedBasic is the full-month
      // figure that the TDS projection and the per-day rate are based on.
      const incrementDelta = incrementedBasic - baseBasic;
      const adjustedBasic = proration
        ? Math.round((baseBasic + incrementDelta * paidShare) * 100) / 100
        : incrementedBasic;
      const fullAdjustedBasic = proration ? proration.fullBasic + incrementDelta : incrementedBasic;

      salaryComponents.forEach(c => {
        if (c.componentName === "Basic Salary") {
          c.calculatedAmount = adjustedBasic;
        }
      });

      /* ---------------------------
         4. Gross salary
      ---------------------------- */
      // Components marked isPartOfGross: false (CTC benefits that sit outside Gross, e.g.
      // a company-paid benefit) are excluded here — this is what makes them never get
      // paid out in the monthly run (totalPayable derives from grossSalary below) and
      // never count toward taxable otherAllowances. undefined (pre-existing components)
      // counts as part of gross, so this is a no-op for every employee with no benefits.
      const grossSalary = salaryComponents.reduce(
        (sum, c) => sum + (c.isPartOfGross === false ? 0 : (c.calculatedAmount || 0)),
        0
      );

      /* ---------------------------
         5. Leave deduction
      ---------------------------- */
      const { leaveCount } =
        await fetchLeavesByEmployeeAndCorporateUser(
          empId,
          corporateUserID,
          cycleStart,
          cycleEnd
        );
      // Days not on payroll this month (before joining / after the last working day) —
      // already taken out of the earnings above (proration), never a separate deduction.
      const deductionDays = partMonth.unpaidDays;
      // Loss of Pay must be prorated against Gross Income, not Gross minus PF/ESI/LWF/etc
      // — those are separate, unrelated deductions and shouldn't shrink the per-day rate
      // an unpaid-leave day is charged at.
      // Full-month gross: proration already scaled grossSalary down, and leave days must
      // still be charged at the normal per-day rate, not a reduced one.
      const fullGrossSalary = proration
        ? proration.fullGross + (fullAdjustedBasic - proration.fullBasic)
        : grossSalary;
      const perDayRate = fullGrossSalary / perDayDivisor;

      const leaveDeduction = perDayRate * leaveCount;
      const totalDayDeduction = leaveDeduction;

      /* ---------------------------
         6. Variable pay
      ---------------------------- */
      // Approval marks this month's bonus/incentives/reimbursements/arrears PAID, so a
      // Loss of Pay recompute of an APPROVED row must reuse what was recorded rather than
      // re-query them (the queries would now miss them and silently drop that pay).
      const settled = isApprovedRecompute ? existingSalaryPaid : null;
      const { totalBonusPay, bonusIds } = settled
        ? { totalBonusPay: settled.totalBonus || 0, bonusIds: settled.bonus || [] }
        : await fetchBonusByEmployeeAndCorporateUser(
          empId, corporateUserID, cycleStart, cycleEnd
        );

      const { totalIncentivesPay, incentivesIds } = settled
        ? { totalIncentivesPay: settled.totalIncentive || 0, incentivesIds: settled.incentives || [] }
        : await fetchIncentivesByEmployeeAndCorporateUser(
          empId, corporateUserID, month, year
        );

      const { totalOvertimePay, overtimeIds } = settled
        ? { totalOvertimePay: settled.totalOvertime || 0, overtimeIds: settled.overtime || [] }
        : await fetchOvertimeByEmployeeAndCorporateUser(
          empId, corporateUserID, cycleStart, cycleEnd
        );

      const { totalReimbursementsPay, reimbursementIds } = settled
        ? { totalReimbursementsPay: settled.totalReimbursement || 0, reimbursementIds: settled.reimbursements || [] }
        : await fetchReimbursementsByEmployeeAndCorporateUser(
          empId, corporateUserID, cycleStart, cycleEnd
        );

      const { totalArrearsPay, totalArrearsBasic, arrearsIds } = settled
        ? {
          totalArrearsPay: settled.totalArrears || 0,
          totalArrearsBasic: settled.salaryInformation?.arrearsBasic || 0,
          arrearsIds: settled.arrears || []
        }
        : await fetchArrearsForPayout(
          { employeeId: empId, corporateUserID, month, year }
        );

      // Arrears attract PF on their Basic portion, same 12%-capped-at-the-wage-ceiling
      // rule as regular pay — computed as the wage-basis DELTA (not a flat re-multiply) so
      // an employee already at the cap correctly gets nil extra PF from arrears, while one
      // below the cap gets PF on however much of the arrear Basic fits under it. Uses THIS
      // payroll run's own month/year, so a historical month keeps its historical ceiling.
      // Nil when PF isn't deducted this month at all (establishment EPF switched off, or
      // the employee's own EPF toggle off) — there's no PF for arrears to top up.
      const hasPfDeduction = deductionComponents.some((d) => isProvidentFundDeduction(d.deductionName));
      const arrearsPfTopUp = hasPfDeduction
        ? Math.max(
            0,
            resolvePfWage(adjustedBasic + totalArrearsBasic, 'CAPPED_15000', month, year) -
              resolvePfWage(adjustedBasic, 'CAPPED_15000', month, year)
          ) * 0.12
        : 0;

      /* ---------------------------
         7. Tax
      ---------------------------- */
      // With Loss of Pay / a part month the year is re-estimated as eleven full months plus
      // this reduced one: recurring inputs stay at the full month and the gross/PF
      // reductions go in once as negative one-offs (calculateTax annualises recurring × 12,
      // one-offs × 1).
      const taxEarnings = proration ? proration.fullSalaryComponents : salaryComponents;
      const taxDeductions = proration ? proration.fullDeductionComponents : deductionComponents;
      const taxBasic = proration ? fullAdjustedBasic : adjustedBasic;
      const taxGross = proration ? fullGrossSalary : grossSalary;
      const monthlyHRA = getComponentAmount(taxEarnings, "House Rent Allowance");
      const monthlyDA  = getComponentAmount(taxEarnings, "Dearness Allowance");
      // Capture all other salary components (special allowance, conveyance, medical, etc.)
      const otherAllowances = taxGross - taxBasic - monthlyHRA - monthlyDA;
      const fullMonthPf = getComponentAmount(taxDeductions, "Provident Fund (PF)");
      const paidMonthPf = getComponentAmount(deductionComponents, "Provident Fund (PF)");
      const lossOfPayGrossReduction = proration ? Math.max(0, taxGross - grossSalary) : 0;

      const taxResult = await exports.calculateTax({
        regime: taxRegime,
        fy,
        basicSalary: taxBasic,
        hra: monthlyHRA,
        dearnessAllowance: monthlyDA,
        otherAllowances,
        bonus: totalBonusPay,
        overTime: totalOvertimePay,
        incentives: totalIncentivesPay,
        arrears: totalArrearsPay,
        lossOfPay: lossOfPayGrossReduction,
        // 80C (old regime) is credited on the PF this payslip actually deducts — ₹0 when
        // EPF is off for the establishment or for this employee, the capped amount when
        // PF wages are capped. Only unpaid months are ever processed here, so paid
        // payslips, their stored tax and Form 16 are untouched.
        employeePfMonthly: fullMonthPf,
        employeePfOneOff: arrearsPfTopUp + (paidMonthPf - fullMonthPf),
      });

      // Old Tax Regime employees: the platform doesn't compute old-regime TDS yet, so an
      // HR-entered amount (in force from its month until the next entry) replaces the
      // engine's figure. taxResult is still kept as the record's taxInformation.
      const manualTds = await resolveManualTds({ corporateUserID, employeeId: empId, month, year });
      const tdsSource = manualTds ? 'MANUAL' : 'CALCULATED';
      const monthlyTDS = manualTds ? manualTds.amount : (taxResult?.tdsPerMonth || 0);

      /* ---------------------------
         7b. Labour Welfare Fund — single source of truth (services/lwfCalc.js), fires
             only in the employee's work-state schedule's deduction month(s). Zero-impact
             for anyone explicitly opted out (laborWelfareFund: false): lwfFor returns
             fires: false, employeeAmount: 0.
      ---------------------------- */
      const lwf = lwfFor({ employee, month, complianceSettings, grossSalary });
      const lwfAmount = lwf.fires ? lwf.employeeAmount : 0;

      /* ---------------------------
         7c. ESI — statutory formula (ctcCalculator.js's resolveEsi), never an actual
             DeductionComponent row, so it has to be computed here explicitly rather than
             read off deductionComponents (see buildSalaryInformation's esiEmployeeAmount
             param). persist defaults to true here deliberately — an actual payroll run IS
             the authoritative moment to (lazily) record/maintain this employee's ESI
             coverage-since marker, unlike the CTC preview/display paths, which pass
             persist: false so merely viewing a tab can't do it prematurely.
      ---------------------------- */
      // Coverage is decided on the full monthly gross; the contribution is on the gross paid.
      const esi = await resolveEsi({ employee, grossSalary, eligibilityGross: fullGrossSalary });
      const esiEmployeeAmount = esi.employeeContribution || 0;

      /* ---------------------------
         7d. Employer PF — full account-wise breakup (EPS/Pension, Employer EPF, EDLI,
             Admin Charges), not a single lump sum, using THIS payroll run's own
             month/year so a historical month keeps its historical PF wage ceiling.
      ---------------------------- */
      const isEpfActiveForPayroll = deductionComponents.some((d) => isProvidentFundDeduction(d.deductionName));
      const employerPfBreakup = isEpfActiveForPayroll
        ? calculateEmployerPfContribution(adjustedBasic, resolveEpfPolicyFromComplianceSettings(complianceSettings), month, year)
        : null;

      /* ---------------------------
         8. Salary info
      ---------------------------- */
      const salaryInformation = buildSalaryInformation({
        salaryComponents,
        deductionComponents,
        baseBasic,
        adjustedBasic,
        totalBonusPay,
        totalIncentivesPay,
        totalOvertimePay,
        leaveDeduction,
        esiEmployeeAmount,
        monthlyTDS,
        tdsSource,
        taxResult,
        lwfAmount,
        arrearsPfTopUp,
        arrearsBasic: totalArrearsBasic,
        employerPfBreakup
      });

      // "Show PF Employee's Contribution in Earnings" as in force for THIS month — only the
      // itemized earnings snapshot the payslip/Salary Profile reads is re-laid out (line
      // added, Balancing reduced by the same amount). basicPay/hraAmount/other, the tax
      // inputs above and the payable below are all computed from the unchanged components,
      // so nothing monetary moves. Frozen with this Salary record, so a paid payslip keeps
      // whatever it showed.
      if (isPfInEarningsForPeriod(complianceSettings, month, year)) {
        const employeePfAmount = getComponentAmount(deductionComponents, "Provident Fund (PF)");
        salaryInformation.earnings = applyPfEarningsLine(salaryComponents, employeePfAmount).map(c => ({
          componentName: c.componentName,
          calculatedAmount: c.calculatedAmount || 0,
        }));
      }

      /* ---------------------------
         9. Final payable
      ---------------------------- */
      /* ---------------------------
         9a. One-time recoveries (Add Deduction) — money taken back from pay already
             earned (Code on Wages s.18(2)). They come off net pay AFTER PF/ESI/TDS and
             never touch gross, the PF/ESI base or taxable salary. Total deductions in the
             month are capped at 50% of the month's gross (the Gross Income shown on Salary
             Details — after Loss of Pay, including bonus/incentives/overtime); recoveries
             fill whatever room is left in whole rupees, oldest first, and the rest carries
             to the next month (see fetchOutstandingOneTimeDeductions).
      ---------------------------- */
      const outstandingOneTime = await fetchOutstandingOneTimeDeductions({
        employeeId: empId, corporateUserID, month, year, cycleStart, cycleEnd
      });
      const monthGross = grossSalary + totalBonusPay + totalIncentivesPay + totalOvertimePay;
      const oneTimeDeductions = allocateOneTimeRecoveries({
        outstanding: outstandingOneTime,
        monthGross,
        otherDeductions: salaryInformation.deductionAmount + salaryInformation.tdsAmount,
      }).map(d => ({
        deductionId: d._id,
        deductionFor: d.deductionFor || d.deductionType,
        note: d.note || '',
        month: d.month ?? Number(month),
        year: d.year ?? Number(year),
        amount: d.deductionAmount,
        outstanding: d.outstanding,
        appliedAmount: d.appliedAmount,
        carriedForward: d.carriedForward,
      }));
      const totalOneTimeDeduction = oneTimeDeductions.reduce((sum, d) => sum + d.appliedAmount, 0);

      // Earnings are kept to the paise; net pay is rounded once, to the nearest rupee.
      const totalPayable = Math.round(
        grossSalary
        - totalDayDeduction
        - salaryInformation.deductionAmount
        - salaryInformation.tdsAmount
        - totalOneTimeDeduction
        + totalBonusPay
        + totalIncentivesPay
        + totalOvertimePay
        + totalReimbursementsPay
        + totalArrearsPay
      );

      /* ---------------------------
         10. Update / Create
      ---------------------------- */
      const existingSalary = await findOneSalaryForReprocessing({
        corporateUserID,
        employeeId: empId,
        year,
        month,
        cycleStart,
        cycleEnd
      });

      // Re-check the same "don't touch a settled salary" condition checked at the top of
      // this function (step 0) — everything between here and there was a long chain of
      // awaited lookups (components, bonus, incentives, overtime, leaves, arrears), long
      // enough for a concurrent approve/mark-as-paid call to have settled this employee's
      // salary in the meantime. Without re-checking here, this would blindly overwrite
      // paymentStatus back to the PENDING/UPCOMING value computed at the very start of the
      // function, reverting an approval that happened mid-flight.
      if (existingSalary && ["PAID", "APPROVED", "COMPLETED"].includes(existingSalary.paymentStatus)
        && !(isApprovedRecompute && existingSalary.paymentStatus === "APPROVED")) {
        return;
      }
      const recordStatus = isApprovedRecompute ? "APPROVED" : paymentStatus;

      // Days the employee is paid for — printed on the payslip as "29 (LOP 2)".
      // isEarningsProrated marks a record whose earnings are already the part-month (joiner/
      // leaver) figures — older records instead show a separate Non-Working Days Deduction.
      const eligibleDays = partMonth.eligibleDays;
      const lopDays = lossOfPay ? lossOfPay.days : 0;
      const payDays = {
        daysInMonth: partMonth.daysInMonth,
        eligibleDays,
        lopDays,
        paidDays: Math.max(0, eligibleDays - lopDays),
        isEarningsProrated: !!proration?.partMonth,
      };
      const lossOfPayRecord = lossOfPay
        ? {
          days: lossOfPay.days,
          amount: lossOfPay.amount,
          isAmountOverridden: lossOfPay.isAmountOverridden,
          grossBeforeLop: Math.round(fullGrossSalary * 100) / 100,
        }
        : { days: 0, amount: 0, isAmountOverridden: false, grossBeforeLop: Math.round(fullGrossSalary * 100) / 100 };

      const computedSalary = {
        year,
        month,
        salaryCycleStart: cycleStart,
        salaryCycleEnd: cycleEnd,
        salaryCycleDays: cycleDays,

        leaveCount,
        leaveDeduction,

        incentives: incentivesIds,
        totalIncentive: totalIncentivesPay,

        bonus: bonusIds,
        totalBonus: totalBonusPay,

        overtime: overtimeIds,
        totalOvertime: totalOvertimePay,

        reimbursements: reimbursementIds,
        totalReimbursement: totalReimbursementsPay,

        arrears: arrearsIds,
        totalArrears: totalArrearsPay,

        attendancePercentage:
          calculateAttendancePercentage(leaveCount, cycleDays - deductionDays),

        salaryInformation,
        lossOfPay: lossOfPayRecord,
        payDays,
        oneTimeDeductions,
        otherDeductions: oneTimeDeductions.map(d => d.deductionId),
        totalOtherDeduction: totalOneTimeDeduction,
        totalPayable: parseFloat(totalPayable).toFixed(2),
        // Stays APPROVED when a Loss of Pay / deduction save recalculates an approved row.
        paymentStatus: recordStatus,
        status: true
      };

      // Only FRESH once a run reproduces the previous run's output. Some inputs are
      // written by the calculation itself (resolveEsi's esiCoverageSince stamp, the lazy
      // SalaryStructureVersion backfill), so the run right after such a write can still
      // differ — leaving calculatedVersion unset makes the next Salary Process read run it
      // again, exactly as the old recalculate-on-every-open flow would have.
      const calcHash = hashSalaryCalculation(computedSalary);
      const isSettled = !!existingSalary && existingSalary.calcHash === calcHash;
      const calculatedVersion = isSettled ? staleVersionAtStart : null;
      const calculatedAt = isSettled ? calcStartedAt : null;

      if (existingSalary) {
        // 🔥 CLEAR old embedded doc
        await Salary.updateOne(
          { _id: existingSalary._id },
          { $unset: { salaryInformation: 1 } }
        );

        // ✅ WRITE fresh data
        await Salary.updateOne(
          { _id: existingSalary._id },
          {
            $set: {
              ...computedSalary,
              calcHash,
              calculatedVersion,
              calcEngineVersion: SALARY_CALC_ENGINE_VERSION,
              calculatedAt
            }
          }
        );
        // NOT marking linked arrears PAID here — paymentStatus at this point is only ever
        // UPCOMING/PENDING (see `paymentStatus` above), and this function can re-run many
        // times before a month is actually approved/paid. Consuming arrears this early
        // would falsely mark them settled on a routine preview recompute, well before any
        // real disbursement — see approveSalary/empApproveSalary/markSalaryAsPaid/
        // empMonthlyApproveSalary (models/use-cases/salary.js), which are where a Salary
        // doc actually transitions to APPROVED/PAID/COMPLETED, for where this belongs.
        return;
      }

      await Salary.create({
        corporateUser: corporateUserID,
        employee: empId,
        ...computedSalary,
        calcHash,
        calculatedVersion,
        calcEngineVersion: SALARY_CALC_ENGINE_VERSION,
        calculatedAt,
        message: "Successfully salary generated"
      });
      // See the identical comment above (existing-salary branch) — not marked paid here.
    }));

    return { status: true, message: "Success" };

  } catch (error) {
    return { status: false, message: error.message };
  }
};









exports.calculateTax = async (params) => {
  try {
    const {
      fy = "2024-25",         // "2024-25" | "2025-26"
      regime = "new",         // "old" | "new"

      basicSalary = 0,
      dearnessAllowance = 0,
      hra = 0,
      conveyanceAllowance = 0,
      medicalAllowance = 0,
      otherAllowances = 0,   // any other monthly salary components
      bonus = 0,
      overTime = 0,
      incentives = 0,        // monthly incentives
      arrears = 0,           // backdated Revise Salary differential, paid out this cycle
      lossOfPay = 0,         // gross not paid this cycle for Loss of Pay days — the recurring
                             // inputs above stay at the full month, so this comes off once
      rentPaid = 0,
      receivesHRA = true,
      isMetro = false,

      pf = 12,                // employee PF % of (Basic + DA)
      pfOptedVoluntary = 0,   // extra VPF in ₹ per YEAR (not %)
      // The employee PF ACTUALLY deducted — when given (the payroll run always passes it),
      // it replaces the flat `pf`% assumption above, which ignored the ₹25,000/₹15,000 wage
      // ceiling, the establishment EPF switch and a per-employee EPF opt-out alike and so
      // overstated 80C (old regime) for all of them. Monthly amount is annualised; the
      // one-off part (arrears PF top-up) counts once. Omitted = the old assumption, exactly.
      employeePfMonthly = null,
      employeePfOneOff = 0,
    } = params;

    /* -----------------------------------------------------
       1) Annualize recurring inputs only. bonus/overTime/incentives/arrears are a
          single cycle's actual rupee amount, not a monthly rate — annualizing them
          (old behavior) overstates annual income and grossly distorts the tax
          withheld in this cycle. They're taxed via the marginal method instead
          (step 10 below): incremental tax = tax(recurring + one-off) − tax(recurring),
          withheld entirely in the cycle they're paid.
    ------------------------------------------------------ */
    const annualBasic = basicSalary * 12;
    const annualDA = dearnessAllowance * 12;
    const annualHRA = hra * 12;
    const annualRecurringAllowances = (conveyanceAllowance + medicalAllowance + otherAllowances) * 12;
    const oneOffTotal = bonus + overTime + incentives + arrears - lossOfPay;

    const grossAnnualRecurring = annualBasic + annualDA + annualHRA + annualRecurringAllowances;

    /* -----------------------------------------------------
       PF & 80C — based on Basic+DA only, unaffected by one-off payments, so this is
       computed once rather than inside the per-gross helper below.
    ------------------------------------------------------ */
    const pfBase = annualBasic + annualDA;

    let employeePF = employeePfMonthly !== null && employeePfMonthly !== undefined
      ? Number(employeePfMonthly) * 12 + (Number(employeePfOneOff) || 0)
      : pfBase * (pf / 100); // employee PF contribution

    if (pfOptedVoluntary > 0) {
      employeePF += pfOptedVoluntary; // treat as ₹ value
    }

    /* -----------------------------------------------------
       Slab Tax setup
    ------------------------------------------------------ */
    const calcSlabs = (income, slabs) => {
      let totalTax = 0;
      const breakdown = [];
      for (const { from, to, rate } of slabs) {
        const slabMax = to === Infinity ? income : Math.min(to, income);
        const taxableInSlab = Math.max(0, slabMax - from);
        const taxInSlab = taxableInSlab * rate;
        totalTax += taxInSlab;
        breakdown.push({
          from,
          to: to === Infinity ? null : to,
          rate: rate * 100,          // store as percentage e.g. 5, not 0.05
          taxableAmount: Math.round(taxableInSlab),
          tax: Math.round(taxInSlab),
        });
        if (income <= to) break;
      }
      return { tax: totalTax, breakdown };
    };

    const slabsOld = [
      { from: 0,       to: 250000,  rate: 0    },
      { from: 250000,  to: 500000,  rate: 0.05 },
      { from: 500000,  to: 1000000, rate: 0.20 },
      { from: 1000000, to: Infinity, rate: 0.30 },
    ];

    const slabsNew_2024_25 = [
      { from: 0,       to: 300000,  rate: 0    },
      { from: 300000,  to: 700000,  rate: 0.05 },
      { from: 700000,  to: 1000000, rate: 0.10 },
      { from: 1000000, to: 1200000, rate: 0.15 },
      { from: 1200000, to: 1500000, rate: 0.20 },
      { from: 1500000, to: Infinity, rate: 0.30 },
    ];

    const slabsNew_2025_26 = [
      { from: 0,       to: 400000,  rate: 0    },
      { from: 400000,  to: 800000,  rate: 0.05 },
      { from: 800000,  to: 1200000, rate: 0.10 },
      { from: 1200000, to: 1600000, rate: 0.15 },
      { from: 1600000, to: 2000000, rate: 0.20 },
      { from: 2000000, to: 2400000, rate: 0.25 },
      { from: 2400000, to: Infinity, rate: 0.30 },
    ];

    // FY strings are "YYYY-YY" (e.g. "2026-27") — comparing the starting year numerically
    // means every FY from 2025-26 onward gets the current rules by default, instead of
    // only the literal string "2025-26" (which silently fell back to the pre-Budget-2025
    // ₹50,000 standard deduction and ₹7,00,000 rebate limit for every later year).
    const fyStartYear = parseInt(String(fy).slice(0, 4), 10) || 0;
    const isFy2025_26OrLater = fyStartYear >= 2025;

    let activeSlabs;
    if (regime === "old") {
      activeSlabs = slabsOld;
    } else {
      activeSlabs = fy === "2024-25" ? slabsNew_2024_25 : slabsNew_2025_26;
    }

    /* -----------------------------------------------------
       Surcharge — same taxable-income bands for both regimes; only the top band's rate
       differs (New regime caps surcharge at 25% overall; Old regime alone steps up to
       37% above ₹5 crore). A band's `threshold` itself still belongs to the band BELOW it
       (e.g. exactly ₹50L is 0%, exactly ₹1Cr is still 10%) — only STRICTLY crossing a
       threshold moves to the next rate, matching how marginal relief is defined below.
    ------------------------------------------------------ */
    const surchargeBands = [
      { threshold: 0,        rate: 0    },
      { threshold: 5000000,  rate: 0.10 }, // > ₹50 lakh
      { threshold: 10000000, rate: 0.15 }, // > ₹1 crore
      { threshold: 20000000, rate: 0.25 }, // > ₹2 crore
      { threshold: 50000000, rate: regime === "old" ? 0.37 : 0.25 }, // > ₹5 crore
    ];

    const surchargeRateFor = (income) => {
      let rate = 0;
      for (const band of surchargeBands) {
        if (income > band.threshold) rate = band.rate;
      }
      return rate;
    };

    // Reusable across every one of the four surcharge boundaries (₹50L/₹1Cr/₹2Cr/₹5Cr) —
    // caps tax+surcharge at what it would have been at the LAST threshold actually crossed
    // plus the income by which this taxable income exceeds it, so a ₹1 raise across a
    // surcharge boundary can never cost more in tax+surcharge than the raise itself.
    // Returns the diagnostic fields (rate/threshold/normalSurcharge) too, not just the
    // final capped amount — the TDS drawer's Surcharge info icon shows its own worked
    // breakdown the same way the Section 87A one already does, and needs these to do it
    // without re-deriving tax-slab math client-side (which would drift from this engine
    // the moment a slab table changes here and not there).
    const calcSurchargeWithMarginalRelief = (tax, taxableIncome) => {
      const rate = surchargeRateFor(taxableIncome);
      if (rate === 0) {
        return { surcharge: 0, rate: 0, threshold: 0, normalSurcharge: 0 };
      }

      const normalSurcharge = tax * rate;

      // The highest real boundary (₹50L/₹1Cr/₹2Cr/₹5Cr) this taxable income has crossed —
      // relief is checked against THAT one, not always ₹50L.
      const crossedThreshold = [...surchargeBands]
        .reverse()
        .find((band) => band.threshold > 0 && taxableIncome > band.threshold).threshold;

      const { tax: taxAtThreshold } = calcSlabs(crossedThreshold, activeSlabs);
      const surchargeAtThreshold = taxAtThreshold * surchargeRateFor(crossedThreshold);
      const cap = taxAtThreshold + surchargeAtThreshold + (taxableIncome - crossedThreshold);

      const surcharge = (tax + normalSurcharge > cap) ? Math.max(0, cap - tax) : normalSurcharge;
      return { surcharge, rate, threshold: crossedThreshold, normalSurcharge };
    };

    /* -----------------------------------------------------
       Runs the full exemption → standard deduction → 80C/80GG → slab → rebate → surcharge
       → cess pipeline for a given annual gross figure. Called once for the recurring
       gross and once for recurring+one-off, so the one-off's incremental tax can be
       isolated (step 10).
    ------------------------------------------------------ */
    const computeTaxForGross = (grossAnnual) => {
      let hraExemption = 0;
      let deduction80GG = 0;

      if (regime === "old" && receivesHRA) {
        // HRA exemption u/s 10(13A)
        const baseSalaryDA = annualBasic + annualDA;
        const annualRent = rentPaid * 12;
        const metroCap = isMetro ? 0.5 : 0.4;

        const actualHRA = annualHRA;
        const excessRentCondition = Math.max(0, annualRent - 0.10 * baseSalaryDA);
        const metroOrNonMetroCap = metroCap * baseSalaryDA;

        hraExemption = Math.max(
          0,
          Math.min(actualHRA, excessRentCondition, metroOrNonMetroCap)
        );
      }

      const incomeAfterHRA = grossAnnual - hraExemption;

      let standardDeduction = 50000;
      if (regime === "new" && isFy2025_26OrLater) {
        standardDeduction = 75000;
      }

      const incomeAfterStandardDeduction = Math.max(
        0,
        incomeAfterHRA - standardDeduction
      );

      let deduction80C = 0;
      if (regime === "old") {
        deduction80C = Math.min(employeePF, 150000);
      }

      // 80GG (if NO HRA, OLD Regime only)
      if (regime === "old" && !receivesHRA) {
        const adjustedIncome = Math.max(0, incomeAfterStandardDeduction);
        const annualRent = rentPaid * 12;

        const maxAllowed = 60000;                         // ₹5000 × 12
        const twentyFivePercentIncome = 0.25 * adjustedIncome;
        const rentMinus10Percent = Math.max(0, annualRent - 0.10 * adjustedIncome);

        deduction80GG = Math.min(
          maxAllowed,
          twentyFivePercentIncome,
          rentMinus10Percent
        );
      }

      const total80Deductions =
        regime === "old" ? deduction80C + deduction80GG : 0;

      const taxableIncome = Math.max(
        0,
        incomeAfterStandardDeduction - total80Deductions
      );

      const { tax: slabTax, breakdown: slabBreakdown } = calcSlabs(taxableIncome, activeSlabs);
      let tax = slabTax;

      // 87A Rebate — a rebate knocks the tax bill down, not the income; below the
      // limit it wipes the slab tax out entirely (old regime caps the rebate itself at ₹12,500).
      let rebate = 0;
      const oldRebateLimit = 500000;
      const newRebateLimit = isFy2025_26OrLater ? 1200000 : 700000;
      if (regime === "old" && taxableIncome <= oldRebateLimit) {
        rebate = Math.min(tax, 12500);
      }
      if (regime === "new" && taxableIncome <= newRebateLimit) {
        rebate = tax; // full rebate
      }
      tax -= rebate;

      // Marginal relief — just above the rebate limit, tax can never exceed the
      // amount by which income crosses that limit, so a ₹1 raise can't cost more
      // in tax than the raise itself.
      let marginalRelief = 0;
      const rebateLimit = regime === "old" ? oldRebateLimit : newRebateLimit;
      if (taxableIncome > rebateLimit) {
        const reliefCap = Math.max(0, taxableIncome - rebateLimit);
        if (tax > reliefCap) {
          marginalRelief = tax - reliefCap;
          tax = reliefCap;
        }
      }

      // Surcharge — computed on the tax AFTER the Section 87A rebate/marginal relief above
      // (never on the pre-rebate slab tax), with its own marginal relief at each of the
      // ₹50L/₹1Cr/₹2Cr/₹5Cr boundaries. Zero below ₹50L taxable income, so this never
      // changes anything for the vast majority of employees.
      const {
        surcharge, rate: surchargeRate, threshold: surchargeThreshold, normalSurcharge: surchargeBeforeRelief,
      } = calcSurchargeWithMarginalRelief(tax, taxableIncome);

      const cess = (tax + surcharge) * 0.04;
      const totalTax = tax + surcharge + cess;

      return {
        grossAnnual, hraExemption, standardDeduction, deduction80C, deduction80GG,
        taxableIncome, slabBreakdown, taxBeforeRebate: slabTax, rebate, marginalRelief, rebateLimit,
        tax, surcharge, surchargeRate, surchargeThreshold, surchargeBeforeRelief, cess, totalTax,
      };
    };

    // Regular Annual Gross + taxable arrears/bonus/incentives/etc. (oneOffTotal) are combined
    // into ONE projected annual gross BEFORE any tax math runs — there is no separate tax
    // calculation for the one-off components. Standard deduction, slab tax, Section 87A
    // rebate/marginal relief and cess are all computed once against this single combined
    // projection (below), never against arrears/bonus in isolation.
    const combined = computeTaxForGross(grossAnnualRecurring + oneOffTotal);

    /* -----------------------------------------------------
       10) Net Taxes & Take Home
           Monthly TDS is simply this FY's complete projected annual tax ÷ 12 — not the
           recurring salary's tax plus a separately-computed incremental tax from any
           one-off. A one-off changes the ANNUAL projection (and is taxed as part of it,
           via combined above), and the resulting annual tax is then spread evenly, exactly
           as Section 192 intends: this month's TDS is not a special case, it's the same
           projected-annual-tax ÷ 12 as any other month.
    ------------------------------------------------------ */
    const tdsPerMonth = combined.totalTax / 12;

    const grossAnnual = grossAnnualRecurring + oneOffTotal;
    const annualTakeHome = Math.max(
      0,
      grossAnnual - employeePF - combined.totalTax
    );
    const monthlyTakeHome = annualTakeHome / 12;

    /* -----------------------------------------------------
       Return
    ------------------------------------------------------ */
    return {
      fy,
      regime,

      grossAnnual: Math.round(grossAnnual),

      // Always the real figure actually used to derive taxableIncome below — zeroing this
      // out whenever totalTax happens to be nil (e.g. a fully-rebated income under ₹12L)
      // made the TDS drawer self-contradictory: Step 3's arithmetic (annual salary minus
      // exemptions) already assumes the true standard deduction was subtracted, so hiding
      // it here just because the final tax landed on ₹0 broke that reconciliation for no
      // reason — the deduction was genuinely applied either way.
      standardDeduction: Math.round(combined.standardDeduction),
      hraExemption: Math.round(combined.hraExemption),
      deduction80C: Math.round(combined.deduction80C),
      deduction80GG: Math.round(combined.deduction80GG),

      taxableIncome: Math.round(combined.taxableIncome),
      slabBreakdown: combined.slabBreakdown,
      taxBeforeRebate: Math.round(combined.taxBeforeRebate),
      rebate: Math.round(combined.rebate),
      marginalRelief: Math.round(combined.marginalRelief),
      rebateLimit: combined.rebateLimit,
      tax: Math.round(combined.tax),
      surcharge: Math.round(combined.surcharge),
      surchargeRate: combined.surchargeRate,
      surchargeThreshold: combined.surchargeThreshold,
      surchargeBeforeRelief: Math.round(combined.surchargeBeforeRelief),
      cess: Math.round(combined.cess),
      totalTax: Math.round(combined.totalTax),

      employeePF: Math.round(employeePF),

      tdsPerMonth: Math.round(tdsPerMonth),
      annualTakeHome: Math.round(annualTakeHome),
      monthlyTakeHome: Math.round(monthlyTakeHome),
    };
  } catch (err) {
    return { error: err.message };
  }
};








// exports.calculateTax = async (params) => {
//     try {
//         const {regime,basicSalary,dearnessAllowance,hra,conveyanceAllowance,medicalAllowance,bonus,overTime,pf,pfOpted} = params;
//         let totalPf=0
//         // const { regime, ctc, monthlyDuductions, monthlyEarnings, hra=10000} = params;
//         if (pf>0){
//             totalPf = (pf*(dearnessAllowance+basicSalary))/100
//         }
        
//         let ctc = basicSalary+dearnessAllowance+hra+conveyanceAllowance+medicalAllowance+bonus+overTime;
//         let annualIncome = ctc * 12;
//         let cessTax = 4/100;
//         let tax = 0, remainingIncome = 0;
//         if (regime === 'old') {
//              let standardDeduction = 50000;
//              let rentallyPaidAnually = hra*12;
//              let basicSalaryAnually = basicSalary* 12; // get this from params 
//              let dearnessAllowanceAnually = dearnessAllowance* 12; // get this from params 
//             let retirementBenefitSalary = basicSalaryAnually + dearnessAllowanceAnually;
//             let rentPaidOverBenefitRetirementSalary = rentallyPaidAnually - retirementBenefitSalary * 0.10 // 10%
//             console.log("rentPaidOverBenefitSalary=>>",rentPaidOverBenefitRetirementSalary)
//             annualIncome = annualIncome-standardDeduction;
//             annualIncome = annualIncome - rentPaidOverBenefitRetirementSalary;
//             annualIncome = annualIncome - (totalPf*12);
//             let tax = 0;

//             if (annualIncome <= 250000) {
//                 tax = 0;
//             } else if (annualIncome <= 500000) {
//                 tax += (annualIncome - 250000) * 0.05;
//             } else if (annualIncome <= 1000000) {
//                 tax += (500000 - 250000) * 0.05;
//                 tax += (annualIncome - 500000) * 0.20;
//             } else {
//                 tax += (500000 - 250000) * 0.05;
//                 tax += (1000000 - 500000) * 0.20;
//                 tax += (annualIncome - 1000000) * 0.30;
//             }

//             // Add CESS @4%
//             const cess = tax * 0.04;
//             const totalTax = tax + cess;

//             // Monthly TDS
//             const tdsPerMonth = totalTax / 12;

//             return {
//                 totalDeduction: Math.round(totalPf+tdsPerMonth),
//                 salaryInHand: Math.round((ctc-(totalPf+tdsPerMonth))),
//                 ctc:ctc,
//                 baseTax: tax,
//                 cess: cess,
//                 totalTax: totalTax,
//                 tdsPerMonth: tdsPerMonth
//             };

//         }
//         else {
//             let standardDeduction = 75000;
//             if(annualIncome > 1200000)
//             annualIncome = (annualIncome-standardDeduction);
//             let tax = 0;

//             if (annualIncome <= 300000) {
//                 return 0;
//             }
//             if (annualIncome <= 700000) {
//                 tax += (annualIncome - 300000) * 0.05;
//             } else if (annualIncome <= 1000000) {
//                 tax += (700000 - 300000) * 0.05;
//                 tax += (annualIncome - 700000) * 0.10;
//             } else if (annualIncome <= 1200000) {
//                 tax += (700000 - 300000) * 0.05;
//                 tax += (1000000 - 700000) * 0.10;
//                 tax += (annualIncome - 1000000) * 0.15;
//             } else if (annualIncome <= 1500000) {
//                 tax += (700000 - 300000) * 0.05;
//                 tax += (1000000 - 700000) * 0.10;
//                 tax += (1200000 - 1000000) * 0.15;
//                 tax += (annualIncome - 1200000) * 0.20;
//             } else {
//                 tax += (700000 - 300000) * 0.05;
//                 tax += (1000000 - 700000) * 0.10;
//                 tax += (1200000 - 1000000) * 0.15;
//                 tax += (1500000 - 1200000) * 0.20;
//                 tax += (annualIncome - 1500000) * 0.30;
//             }
//             let totalCessTax = cessTax*tax;
//             let totalTax = totalCessTax + tax;
//             const tdsPerMonth = totalTax / 12;
//             // console.log("Tax ==>",totalTax,"monthly tax", Math.floor(totalTax/12))
//             return {
//                 totalDeduction: Math.round(totalPf+tdsPerMonth),
//                 salaryInHand: Math.round((ctc-(totalPf+tdsPerMonth))),
//                 ctc:ctc,
//                 baseTax: tax,
//                 cess: totalCessTax,
//                 totalTax: totalTax,
//                 tdsPerMonth: Math.round(tdsPerMonth)
//             };
//             // return {ctc,totalTax};
            
//         }


//     } catch (error) {
//         return { status: false, message: `Something went wrong, ${error?.message}'` }
//     }
// }
