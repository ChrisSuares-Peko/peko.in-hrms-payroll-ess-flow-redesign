    /* eslint-disable no-async-promise-executor */
/* eslint-disable no-unused-vars */
// const { promisify } = require('util');
// const setTimeoutPromise = promisify(setTimeout);
const moment = require('moment');
const Employee = require("../models/entities/payroll/employee");
const Salary = require("../models/entities/payroll/salary");
const CorporateUser = require("../models/entities/payroll/corporateUser");
const { fetchLeavesByEmployeeAndCorporateUser } = require("../models/use-cases/payroll/leaveApplication");
const { findOneHrSettings } = require("../models/use-cases/payroll/hrSettings");

const { fetchReimbursementsByEmployeeAndCorporateUser } = require("../models/use-cases/payroll/reimbursement");
const { isSalaryProcessedForMonthYearCorporateUser, findOneSalary, updateEmailSent, findOneSalaryForReprocessing,approveSalary } = require("../models/use-cases/payroll/salary");
const { getDaysInMonth, getDaysDifference, getDaysInPreviousMonth, getPreviousMonthAndYear } = require("../utils/dateUtils");


const { paySlipEmailTemplate, payslipHtmlAE } = require("../utils/email/emailTemplates/paySlipEmail");
const { resolveEmailTemplate } = require("./emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose
const emailer = require('../utils/email/emailer');
const wkhtmltopdf = require('wkhtmltopdf');
const fs = require("fs");
const { restrictPayrollSettings } = require('../models/use-cases/payroll/hrSettings');
const { fetchEmployeesForGenerateSalary ,getActiveEmployees} = require('../models/use-cases/payroll/employee');
const { fetchIncentivesByEmployeeAndCorporateUser } = require('../models/use-cases/payroll/incentives');
const { fetchBonusByEmployeeAndCorporateUser } = require('../models/use-cases/payroll/bonus');
const { fetchOvertimeByEmployeeAndCorporateUser } = require('../models/use-cases/payroll/overTime');
const HrSettings = require('../models/entities/payroll/hrSettings');
const { fetchDeductionsByEmployeeAndCorporateUser } = require('../models/use-cases/payroll/deductions');
const { fetchAdjustedBasicPay } = require('./increment');
const { customLog } = require('../utils/loggerHelper');


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
        customLog(null, "error", { message:" ", error })
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

        let employees = await fetchEmployeesForGenerateSalary(corporateUserID, cycleStart, cycleEnd, employeeId)
        let salariesArray = [];//for bulk create
        customLog(null, "info", { message: "Promise started in process salary" })
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
                // const yearlyCTC = grossSalary * 12
                // const yearlyDays = getYearlyDays(year)
                // let perDayRateBasedOnYear = yearlyCTC / yearlyDays

                let perDayRate = grossSalary / cycleDays
                let leaveDeduction = (perDayRate * leaveCount)
                let otherDeductions = (perDayRate * deductionDays)
                let netSalary = grossSalary - leaveDeduction - otherDeductions
                let attendancePercentage = calculateAttendancePercentage(leaveCount, cycleDays)
                customLog(null, "info", { message: "process salary datas", grossSalary, perDayRate, netSalary, leaveDeduction, otherDeductions, cycleStart, cycleEnd, month, year, cycleDays})

                //get the additional payments that needs to be add with salary
                let { totalIncentivesPay, incentivesIds } = await fetchIncentivesByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)
                let { totalBonusPay, bonusIds } = await fetchBonusByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)
                let { totalOvertimePay, overtimeIds } = await fetchOvertimeByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)
                // if (employeeId == '66123bd96034f6b8bfca1ec7') {
                // }
                //get the additional deductions that needs to be deducted form the salary
                let { totalDeductionsPay, deductionsIds } = await fetchDeductionsByEmployeeAndCorporateUser(employee._id, corporateUserID, cycleStart, cycleEnd)


                //calculate the total salary payable to employee
                let totalPayable = netSalary + totalBonusPay + totalIncentivesPay + totalOvertimePay - totalDeductionsPay
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
                    existingSalaryRecord.totalOtherDeduction = totalDeductionsPay

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
                        totalOtherDeduction: totalDeductionsPay,

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
                customLog(null, "error", { message:" ", error })
                return false
            }
        }))
        customLog(null, "info", { message: `Promise ends, Time spent for processing: ${(new Date() - startTime) / 1000} s` })

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
        customLog(null, "error", { message:" ", error })
        return {
            status: false,
            message: `${error?.message || 'Faild to fetch salary details'}`,
            data: {}
        }
    }
}



exports.downloadPayslip = async (params) => {
    try {
        
        const { corporateUserID, salaryId, companyInfo } = params
        let salaryData = await findOneSalary({ corporateUserID, salaryId })//Find salary details with the salary id
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
        customLog(null, "error", { message:" ", error })
        return {
            status: false,
            message: `Faild to send email,${error?.message}`,
            data: {}
        }
    }
}

exports.emailPayslip = async (params) => {
    try {
        const { corporateUserID, salaryId, companyInfo } = params
        const salaryData = await findOneSalary({ corporateUserID, salaryId })//Find salary details with the salary id
        if (!salaryData) throw new Error("Salary information not found");
        if (salaryData.status == false) throw new Error(`Faild, ${salaryData.message}`);
        salaryData.companyInfo = companyInfo

        const data = await emailPdfFile(salaryData)
        await updateEmailSent({ corporateUserID, salaryId })

        return {
            status: true,
            message: `Email send successfully`,
            data: data
        }
    } catch (error) {
        customLog(null, "error", { message:" ", error })
        return {
            status: false,
            message: `Faild to send email,${error?.message}`,
            data: {}
        }
    }
}

exports.sendPayrollSlip = async (req) => {



const today = new Date();
        let fetchAllSalaries = await Salary.find({});

        fetchAllSalaries.forEach(async salary => {
            // forEach does not await async callbacks, so catch per item or the error is lost
            try {
            const payingDate = salary.payingDate;
            const sendPayslip=salary.sendPayslip;
          
            if(!sendPayslip){

                return
            }

          
            if (payingDate && today.toISOString().slice(0, 10) === payingDate.toISOString().slice(0, 10)) {
                customLog(req?.LogTraceId, "info", { message: "SendPayrollSlip", salaryId: salary._id })

                const corporateUserID = salary.corporateUser;
                const salaryId = salary._id;
                let companyInfo = {}

                const salaryData = await findOneSalary({ corporateUserID, salaryId })//Find salary details with the salary id
                if (!salaryData) throw new Error("Salary information not found");
                if (salaryData.status == false) throw new Error(`Failed, ${salaryData.message}`);
                salaryData.companyInfo = companyInfo

                const data = await emailPdfFile(salaryData,corporateUserID)
                await updateEmailSent({ corporateUserID, salaryId })
            }
            } catch (error) {
                customLog(req?.LogTraceId, "error", { message: "sendPayrollSlip failed for salary", salaryId: salary?._id, error: error?.message || error });
            }
        });

}


/**
 * 
 * --------------------------------------------------------------------------------------------------
 */

function calculateNetHours(data) {
    let { startTime, endTime, breakTimeHrs } = data
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
async function emailPdfFile(salaryData,corporateUserID) {
    return new Promise(async (resolve, reject) => {
        try {
            let { month, year } = salaryData
            let id = salaryData?.employee?.employeeInformation?.employeeId || 123
              
      const corporateData = await findOneHrSettings(corporateUserID)
        
            
            const html = payslipHtmlAE(salaryData,corporateData);
            let fileName = `${id}-PaySlip-${month}-${year}`
           
            let ranDomNumber = Math.floor(Math.random() * (1000 - 1 + 1)) + 1;
            fs.writeFile(`${fileName}-${ranDomNumber}.html`, html, async (err) => {
                if (err) {
                    customLog(null, "error", { message:"emailPdf file write file error", error:err })
                    reject(err)
                } else {
                    const inputFile = `${fileName}-${ranDomNumber}.html`;
                    const outputFile = `${fileName}-${ranDomNumber}.pdf`;

                    const pdfOptions = {
                        pageSize: 'A4',
                        // orientation: 'Landscape', // Set the orientation to Landscape
                        output: outputFile,
                        noStopSlowScripts: true // This option might not exist in wkhtmltopdf; adjust as needed
                    };

                    wkhtmltopdf(fs.createReadStream(inputFile), pdfOptions, async (pdfErr) => {
                        if (pdfErr) {
                            customLog(null, "error", { message:"Error generating PDF ", error: pdfErr })
                            reject(pdfErr)
                        } else {
                            customLog(null, "info", { message: `PDF file written to ${outputFile}` })
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const monthName = monthNames[(salaryData?.month || 1) - 1];
                            const resolved = await resolveEmailTemplate({
                                key: EMAIL_TEMPLATE_KEYS.PAYSLIP_EMAIL,
                                service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
                                variables: {
                                    monthName: monthName || '',
                                    companyName: salaryData?.companyInfo?.companyName || '',
                                    employeeName: salaryData?.employee?.personalInformation?.fullName || '',
                                    hrManagerName: salaryData?.officialDocuments?.hrManagerName || '',
                                    year: salaryData?.year || '',
                                    // branding here is the employer's own company (header
                                    // logo/alt-text), not a genuine Peko reseller partner -
                                    // force Peko branding so the footer's partner-icon-hiding
                                    // gate doesn't fire for every employer.
                                    ...v2LayoutVariables({
                                        website: salaryData?.companyInfo?.website,
                                        logo: salaryData?.companyInfo?.logo,
                                        branding: 'Peko',
                                    }),
                                },
                                fallback: () => paySlipEmailTemplate(salaryData),
                                fallbackSubject: 'Payslip',
                            });
                            // employee.personalEmail doesn't exist on the Employee schema (the real field
                            // is nested under personalInformation.email) - this was silently sending to
                            // undefined before.
                            let to = salaryData.employee?.personalInformation?.email

                            // Call email function to send email with payment details in the body
                            let { status, message } = await emailer.emailWithAttachment(to, resolved.subject, resolved.html, `${fileName}.pdf`, '')
                            if (!status) {
                                reject(new Error(message))
                            }
                            customLog(null, "info", { message: "Email sent to " + to })
                            // Delete the file
                            const filesToDelete = [inputFile, outputFile];
                            filesToDelete.forEach((file) => {
                                fs.unlink(file, (unlinkErr) => {
                                    if (unlinkErr) {
                                        customLog(null, "error", { message:`Error deleting file ${file}`, error: unlinkErr })

                                    } else {
                                        customLog(null, "info", { message: `File ${file} deleted` })
                                    }
                                });
                            });
                            resolve(true)

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
            let { month, year } = salaryData
            let id = salaryData?.employee?.employeeInformation?.employeeId || 123
            const html = payslipHtmlAE(salaryData);
            let fileName = `${id}-PaySlip-${month}-${year}`
            let ranDomNumber = Math.floor(Math.random() * (1000 - 1 + 1)) + 1;
            fs.writeFile(`${fileName}-${ranDomNumber}.html`, html, async (err) => {
                if (err) {
                    customLog(null, "error", { message:"generate pdf file", error:err })
                    reject(err)
                } else {
                    const inputFile = `${fileName}-${ranDomNumber}.html`
                    const outputFile = `${fileName}-${ranDomNumber}.pdf`

                    const pdfOptions = {
                        pageSize: 'A4',
                        //orientation: 'Landscape', // Set the orientation to Landscape
                        output: outputFile,
                        noStopSlowScripts: true // This option might not exist in wkhtmltopdf; adjust as needed
                    };

                    wkhtmltopdf(fs.createReadStream(inputFile), pdfOptions, async (pdfErr) => {
                        if (pdfErr) {
                            customLog(null, "error", { message:"Error generating PDF ", error: pdfErr })
                            reject(pdfErr)
                        } else {
                            customLog(null, "info", { message: `PDF file written to ${outputFile}` })
                            // Read the PDF data
                            fs.readFile(outputFile, async (readErr, pdfData) => {
                                if (readErr) {
                                    customLog(null, "error", { message:"Error reading file", error:readErr, outputFile })
                                    // Delete the files
                                    const filesToDelete = [inputFile, outputFile];
                                    filesToDelete.forEach((file) => {
                                        fs.unlink(file, (unlinkErr) => {
                                            if (unlinkErr) {
                                                customLog(null, "error", { message:`Error deleting file ${file}`, error: unlinkErr })
                                            } else {
                                                customLog(null, "info", { message: `File ${file} deleted` })
                                            }
                                        });
                                    });
                                    reject(readErr)
                                } else {
                                    // Delete the files
                                    const filesToDelete = [inputFile, outputFile];
                                    filesToDelete.forEach((file) => {
                                        fs.unlink(file, (unlinkErr) => {
                                            if (unlinkErr) {
                                                customLog(null, "error", { message:`Error deleting file ${file}`, error: unlinkErr })

                                            } else {
                                                customLog(null, "info", { message: `File ${file} deleted` })
                                            }
                                        });
                                    });
                                    resolve({ pdfData, filename: fileName })
                                }
                            });
                        }
                    });
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}




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


exports.updateSalaryStatus = async (req) => {
    try {
        const today = new Date();
        // Only salaries approved through payroll (run with a paying date) become PAID on that date;
        // PENDING and every other status are left untouched.
        let fetchAllSalaries = await Salary.find({ paymentStatus: 'APPROVED' });

        fetchAllSalaries.forEach(async salary => {
            // forEach does not await async callbacks, so catch per item or the error is lost
            try {
            const payingDate = salary.payingDate;

            // Check if payingDate exists and today's date is equal to payingDate
            if (payingDate && today.toISOString().slice(0, 10) === payingDate.toISOString().slice(0, 10)) {
                customLog(req?.LogTraceId, "info", { message: "Today's date matches", salaryId: salary._id })

                // Status in the filter too, so a salary changed since it was read is not overwritten
                await Salary.updateOne(
                    { _id: salary._id, paymentStatus: 'APPROVED' },
                    { paymentStatus: 'PAID' }
                );
            }
            } catch (error) {
                customLog(req?.LogTraceId, "error", { message: "updateSalaryStatus failed for salary", salaryId: salary?._id, error: error?.message || error });
            }
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message:" ", error })
        throw error;
    }
}




