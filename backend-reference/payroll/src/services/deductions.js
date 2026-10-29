/* eslint-disable no-unused-vars */
const Employee = require("../models/entities/employee");
const HrSettings = require("../models/entities/hrSettings");
const OrganizationSettings = require("../models/entities/organizationSettings");
const { fetchIndividualLeavesByEmployeeAndCorporateUser } = require("../models/use-cases/leaveApplication");
const { findOneSalaryForReprocessing } = require("../models/use-cases/salary");
const { getDaysDifference, resolvePerDayDivisor, resolveNonWorkingPayDays } = require("../utils/dateUtils");
const { calculateSalaryCycleBasedOnMonth, fetchDeductionDays } = require("./salary");
const { findAllDeductionsByEmployeeAndCorporateUser } = require('../models/use-cases/deductions');
function getYearlyDays(year) {
    function isLeapYear(year) {
        // Leap years are divisible by 4
        // but not divisible by 100 unless also divisible by 400
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    const leapYear = isLeapYear(year);
    return leapYear ? 366 : 365;
}
exports.calculateLeaveDeduction = async (params) => {
    const { employeeId, corporateUserID, cycleStart, cycleEnd, month, year } = params
    try {
        const employee = await Employee.findOne({ _id: employeeId, corporateUser: corporateUserID });
        let doj = employee.employeeInformation.dateOfJoin
        const salaryInfo = employee.salaryInformation;

        const cycleDays = getDaysDifference(cycleStart, cycleEnd)
        if (cycleDays === undefined || typeof cycleDays !== 'number' || !Number.isInteger(cycleDays)) {
            throw new Error('Invalid cycle duration');
        }
        if (!doj) throw new Error('Employee date of join not available')

        let leaves = await fetchIndividualLeavesByEmployeeAndCorporateUser(employeeId, corporateUserID, cycleStart, cycleEnd, doj)

        //calculate the salary payable after deducting the leave
        let { basicPay, travelAllowances, homeAllowances, medicalAllowances, otherAllowances, other } = salaryInfo
        let grossSalary = (basicPay || 0) + (travelAllowances || 0) + (homeAllowances || 0) + (medicalAllowances || 0) + (otherAllowances || 0) + (other || 0);
        // const yearlyCTC = grossSalary * 12
        // const yearlyDays = getYearlyDays(year)
        // let perDayRate = yearlyCTC / yearlyDays

        const organizationSettings = await OrganizationSettings.findOne({ corporateUser: corporateUserID }).select('payrollSettings.calculateSalaryBasedOn payrollSettings.selectWorkingDays').lean();
        const perDayDivisor = resolvePerDayDivisor(cycleStart, cycleEnd, cycleDays, organizationSettings?.payrollSettings)
        let perDayRate = grossSalary / perDayDivisor

        const existingSalaryRecord = await findOneSalaryForReprocessing({ corporateUserID, employeeId, year, month, cycleStart, cycleEnd })
        let deductionStatus = "PENDING"
        if (existingSalaryRecord && existingSalaryRecord.paymentStatus === 'PAID') {
            deductionStatus = "DEDUCTED"
        }
        const hrSettings1 = await HrSettings.findOne({ corporateUser: corporateUserID });
        let { salaryCycleDay, payrollStartsFrom } = hrSettings1?.payrollSettings || {};

        let leaveDeductions = []
        leaves.forEach((leave, i) => {
            let { corporateUser, employee, leaveCount, start } = leave
            const leaveDate = new Date(start);
            // leaveDeductions.push({
            //     corporateUser: corporateUser,
            //     employee: employee,
            //     deductionDate: start,
            //     deductionType: "Leave deduction",
            //     deductionAmount: parseFloat((perDayRate * leaveCount).toFixed(2)),
            //     deductionStatus,
            //     id: false
            // })
            if (leaveDate >= payrollStartsFrom) {
                leaveDeductions.push({
                    corporateUser: corporateUser,
                    employee: employee,
                    deductionDate: start,
                    deductionType: "Leave deduction",
                    deductionAmount: parseFloat((perDayRate * leaveCount).toFixed(2)),
                    deductionStatus,
                    id: false
                });
            }
        })

        return {
            status: true,
            leaveDeductions
        }
    } catch (error) {
        return {
            status: false,
            message: error.message || 'Something went wrong'
        }
    }
}
exports.calculateOtherDeduction = async (params) => {
    const { employeeId, corporateUserID, cycleStart, cycleEnd, month, year } = params
    try {
        const employee = await Employee.findOne({ _id: employeeId, corporateUser: corporateUserID });
        let doj = employee.employeeInformation.dateOfJoin
        const lastWorkingDay = employee?.offBoardingInformation?.lastWorkingDay || false
        const salaryInfo = employee.salaryInformation;

        const hrSettings2 = await HrSettings.findOne({ corporateUser: corporateUserID });
        let { salaryCycleDay, payrollStartsFrom } = hrSettings2?.payrollSettings || {};

        const cycleDays = getDaysDifference(cycleStart, cycleEnd)
        if (cycleDays === undefined || typeof cycleDays !== 'number' || !Number.isInteger(cycleDays)) {
            throw new Error('Invalid cycle duration');
        }
        if (!doj) throw new Error('Employee date of join not available')


        //get other days to be deducted like late join / if first payroll is after than cycle start
        let { deductionDays } = await fetchDeductionDays({ corporateUserID, month, year, doj, lastWorkingDay, salaryCycleDay, payrollStartsFrom })

        //calculate the salary payable after deducting the leave
        let { basicPay, travelAllowances, homeAllowances, medicalAllowances, otherAllowances, other } = salaryInfo
        let grossSalary = (basicPay || 0) + (travelAllowances || 0) + (homeAllowances || 0) + (medicalAllowances || 0) + (otherAllowances || 0) + (other || 0);
        const organizationSettings2 = await OrganizationSettings.findOne({ corporateUser: corporateUserID }).select('payrollSettings.calculateSalaryBasedOn payrollSettings.selectWorkingDays').lean();
        const perDayDivisor = resolvePerDayDivisor(cycleStart, cycleEnd, cycleDays, organizationSettings2?.payrollSettings)
        // Same unit as the divisor (working days for a "Company working days" payroll) — see resolveNonWorkingPayDays.
        deductionDays = resolveNonWorkingPayDays({ calendarDeductionDays: deductionDays, cycleStart, cycleEnd, perDayDivisor, payrollSettings: organizationSettings2?.payrollSettings, doj, lastWorkingDay, payrollStartsFrom })
        let perDayRate = grossSalary / perDayDivisor

        const existingSalaryRecord = await findOneSalaryForReprocessing({ corporateUserID, employeeId, year, month, cycleStart, cycleEnd })
        let deductionStatus = "PENDING"
        if (existingSalaryRecord && existingSalaryRecord.paymentStatus === 'PAID') {
            deductionStatus = "DEDUCTED"
        }


        let otherDeductions = []
        if (parseFloat((perDayRate * deductionDays).toFixed(2)) > 0) {
            otherDeductions.push({
                corporateUser: corporateUserID,
                employee: employeeId,
                deductionDate: cycleEnd,
                deductionType: "Non-Worked Days Deduction",
                deductionAmount: parseFloat((perDayRate * deductionDays).toFixed(2)),
                deductionStatus,
                description:'This amount represents the salary adjustment for the days you were not employed at the start of the salary cycle. For example, this applies if the employee joined in the middle of the month or if the payroll started in the middle of the month.',
                id: false
            })
        }


        return {
            status: true,
            otherDeductions
        }
    } catch (error) {
        return {
            status: false,
            message: error.message || 'Something went wrong'
        }
    }
}
exports.checkDeductionAmountWithSalary = async (params, corporateUserID, employeeId, deductionId = false) => {
    try {
        const currentDate = new Date();
        let { deductionDate, deductionAmount } = params
        if (!deductionDate || !deductionAmount) {
            throw new Error('Deduction date and amount is required')
        }
        deductionAmount = parseFloat(deductionAmount)
        const dateObj = new Date(deductionDate);
        let month = dateObj.getMonth() + 1; // Adding 1 because getMonth() returns a zero-based index
        let year = dateObj.getFullYear();
        let day = dateObj.getDate();

        //#1 need to find the salary cycle 
        const hrSettings3 = await HrSettings.findOne({ corporateUser: corporateUserID });
        let { salaryCycleDay, payrollStartsFrom } = hrSettings3?.payrollSettings || {};
        if (salaryCycleDay === undefined || typeof salaryCycleDay !== 'number' || !Number.isInteger(salaryCycleDay)) {
            throw new Error('HR settings not found or invalid salary cycle day for this corporate user')
        }
        if (salaryCycleDay >= 15 && day >= salaryCycleDay) {
            if (month == 12) {
                month = 1
                year++
            } else {
                month++
            }
        }

        let { cycleStart, cycleEnd } = await calculateSalaryCycleBasedOnMonth(month, year, salaryCycleDay, corporateUserID)
        console.log({ cycleStart, cycleEnd, salaryCycleDay, payrollStartsFrom })
        //- Check if cycleStart is less than payrollStartsFrom
        if (cycleStart < payrollStartsFrom && cycleEnd < payrollStartsFrom) {
            throw new Error('Selected date is less than payroll start date')
        }
        //#2 get all other deductions added in this same salary cycle
        let { totalDeductionsPay } = await findAllDeductionsByEmployeeAndCorporateUser(employeeId, corporateUserID, cycleStart, cycleEnd, deductionId)
        let totalDeduction = totalDeductionsPay + deductionAmount
        //#3 check weather the total deduction is less than total salary 
        console.log({ totalDeduction, totalDeductionsPay, deductionAmount })
        let employee = await Employee.findOne({ _id: employeeId })
        const salaryInfo = employee.salaryInformation;
        let { basicPay, travelAllowances, homeAllowances, medicalAllowances, otherAllowances, other } = salaryInfo
        let grossSalary = (basicPay || 0) + (travelAllowances || 0) + (homeAllowances || 0) + (medicalAllowances || 0) + (otherAllowances || 0) + (other || 0);
        if (grossSalary <= deductionAmount) {
            throw new Error('Deduction amount is higher than gross salary ')
        }
        if (grossSalary <= totalDeduction) {
            throw new Error(`Deduction exceeds gross salary,${totalDeductionsPay} is already exists in deductions`)
        }

        return {
            status: true,
            message: 'Success'
        }
    } catch (error) {
        return {
            status: false,
            message: error.message || 'Something went wrong'
        }
    }
}
