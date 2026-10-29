const { monthNames } = require("../../utils/dateUtils");
const Employee = require("../entities/employee");
const Salary = require("../entities/salary");
const CorporateBankAccount = require("../entities/corporateBankAccount");
const { getEmployeeSalaryComponentForProcessSalary } = require("../../models/use-cases/salaryComponent");
const { fetchAdjustedBasicPay } = require('../../services/increment');


exports.getTotalSalaryForActiveAndLeaveEmployees = async (params) => {
    const { corporateUser } = params
    // 1. Fetch employees
    const employees = await Employee.find({
      corporateUser:corporateUser,
      isEmployeeDeleted: false,
      "employeeInformation.employeeStatus": {
        $nin: ["SUSPENDED", "RESIGNED", "NEW_HIRE"]
      }
    }).select("_id employeeInformation.dateOfJoin");

    let totalSalary = 0;

    // 2. Calculate salary dynamically
    for (const emp of employees) {
      const empId = emp._id;
      const doj = emp.employeeInformation?.dateOfJoin;

      const componentData =
        await getEmployeeSalaryComponentForProcessSalary({
          corporateUserID:corporateUser,
          employeeId: empId
        });

      if (!componentData?.salaryComponents?.length) continue;

      const salaryComponents = componentData.salaryComponents || [];
      const deductionComponents = componentData.deductionComponents || [];

      // Base Basic
      const baseBasic =
        getComponentAmount(salaryComponents, "Basic Salary");

      // Increment-adjusted basic
      const adjustedBasic =
        await fetchAdjustedBasicPay({
          baseBasic,
          corporateUser,
          dateOfJoin: doj,
          employeeId: empId
        });

      // Apply adjusted basic
      salaryComponents.forEach(c => {
        if (c.componentName === "Basic Salary") {
          c.calculatedAmount = adjustedBasic;
        }
      });

      // Gross salary
      const grossSalary = salaryComponents.reduce(
        (sum, c) => sum + Number(c.calculatedAmount || 0),
        0
      );

        const totalDeduction = deductionComponents.reduce(
            (sum, d) => sum + Number(d.calculatedAmount || 0),
            0
        );
        const netSalary = Math.max(0, grossSalary - totalDeduction);
        totalSalary += netSalary
    }

    return totalSalary;
};


exports.getLastMonthSalaryDetails = async (params) => {
    try {
        const { corporateUser } = params
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Adding 1 since getMonth() returns a zero-based index
        let currentYear = currentDate.getFullYear();
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1; // Handling the case for January
        currentYear = lastMonth === 12 ? currentYear - 1 : currentYear;

        //get the salaries having this month and year for the corporate
        const aggregateResult = await Salary.aggregate([
            {
                $match: {
                    corporateUser,
                    month: lastMonth,
                    year: currentYear,
                },
            },
            {
                $group: {
                    _id: null,
                    totalPayableSum: { $sum: '$totalPayable' },
                },
            },
        ]);
        // Extract the totalPayable sum from the aggregation result
        const totalPayableSum = aggregateResult.length > 0 ? aggregateResult[0].totalPayableSum : 0;

        return totalPayableSum;
    } catch (error) {
        return error;
    }
};

exports.getMonthlyTotalSalary = async (year, corporateUserId) => {
    try {
        const result = await Salary.aggregate([
            {
                $match: {
                    corporateUser: corporateUserId,
                    year
                }
            },
            {
                $group: {
                    _id: "$month",
                    totalSalary: { $sum: "$totalPayable" }
                }
            }
        ]);

        // Convert result to an object for easier lookup
        const resultObj = {};
        result.forEach(entry => resultObj[entry._id] = entry.totalSalary)

        // Populate result with all months, adding 0 value for missing months
        const resultWithMonthNames = [];
        for (let i = 1; i <= 12; i++) {
            const monthName = monthNames[i];
            const totalSalary = resultObj[i] || 0; // If the month doesn't exist in the database result, set total salary to 0
            resultWithMonthNames.push({ id: i, month: monthName, totalSalary });
        }

        return resultWithMonthNames;
    } catch (error) {
        return error
    }
};

exports.getCurrentMonthTotalSalary = async (params) => {
    try {
        const { corporateUser } = params
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Adding 1 since getMonth() returns a zero-based index
        let currentYear = currentDate.getFullYear();

        //get the salaries having this month and year for the corporate
        const aggregateResult = await Salary.aggregate([
            {
                $match: {
                    corporateUser,
                    month: currentMonth,
                    year: currentYear,
                },
            },
            {
                $group: {
                    _id: null,
                    totalPayableSum: { $sum: '$totalPayable' },
                },
            },
        ]);
        if (aggregateResult.length == 0) { // if we result found form salary table use from employee profile
            let totalSalary = await this.getTotalSalaryForActiveAndLeaveEmployees({ corporateUser })
            aggregateResult.push({ totalPayableSum: totalSalary })
        }
        // Extract the totalPayable sum from the aggregation result
        const totalPayableSum = aggregateResult.length > 0 ? aggregateResult[0].totalPayableSum : 0;

        return totalPayableSum;
    } catch (error) {
        return error;
    }
};

exports.getNextMonthTotalSalary = async (params) => {
    try {
        const { corporateUser } = params
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Adding 1 since getMonth() returns a zero-based index
        let currentYear = currentDate.getFullYear();
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1; // Handling the case for Dec
        currentYear = currentMonth === 12 ? currentYear + 1 : currentYear;

        //get the salaries having this month and year for the corporate
        const aggregateResult = await Salary.aggregate([
            {
                $match: {
                    corporateUser,
                    month: nextMonth,
                    year: currentYear,
                },
            },
            {
                $group: {
                    _id: null,
                    totalPayableSum: { $sum: '$totalPayable' },
                },
            },
        ]);
        if (aggregateResult.length == 0) { // if we result found form salary table use from employee profile
            let totalSalary = await this.getTotalSalaryForActiveAndLeaveEmployees({ corporateUser })
            aggregateResult.push({ totalPayableSum: totalSalary })
        }
        // Extract the totalPayable sum from the aggregation result
        const totalPayableSum = aggregateResult.length > 0 ? aggregateResult[0].totalPayableSum : 0;

        return totalPayableSum;
    } catch (error) {
        return error;
    }
};

exports.getTotalSalary = async (params) => {
    try {
        const { corporateUser } = params

        const totalSalarySum = await Salary.aggregate([
            {
                $match: {
                    corporateUser: corporateUser
                }
            },
            {
                $group: {
                    _id: null,
                    totalSalarySum: { $sum: '$totalPayable' }
                }
            }
        ])
        return totalSalarySum.length > 0 ? totalSalarySum[0].totalSalarySum : 0;
    } catch (error) {
        return error;
    }
};

exports.countActiveEmployees = async (corporateUser) => {
    try {
        const currentDate = new Date();
        
        // Find the employees matching the criteria
        const employees = await Employee.find({
            corporateUser,
            $or: [
                { 'isEmployeeDeleted': false },
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } },
                { 'offBoardingInformation.lastWorkingDay': { $gte: currentDate } }
            ],
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $ne: 'NEW_HIRE' }
        });

        return employees.length;
    } catch (error) {
        console.error('Error fetching employees:', error);
        return error;
    }
};

const getComponentAmount = (components, name) =>
  components.find(c =>
    (c.componentName || c.deductionName) === name
  )?.calculatedAmount || 0;



  
/**
 * Get total deduction summary for a given month & year
 * @param {Object} params
 * @param {String} params.corporateUser - corporateUser _id
 * @param {Number} params.year - year (eg: 2025)
 * @param {Number} params.month - month (1-12)
 */
exports.getMonthlyDeductionSummary = async ({ corporateUser, year, month }) => {
    try {
        const result = await Salary.aggregate([
            {
                $match: {
                    corporateUser,
                    year: parseInt(year),
                    month: parseInt(month)
                }
            },
            {
                $group: {
                    _id: null,
                    epf: { $sum: "$salaryInformation.epfAmount" },
                    esi: { $sum: "$salaryInformation.esiAmount" },
                    tds: { $sum: "$salaryInformation.tdsAmount" },
                    lwf: { $sum: "$salaryInformation.lwfAmount" },
                    totalDeduction: { $sum: "$salaryInformation.deductionAmount" }
                }
            },
            {
                $project: { _id: 0 }
            }
        ]);

        return result;
    } catch (error) {
        console.error('Error in getMonthlyDeductionSummary:', error);
        throw error;
    }
};

exports.countActiveEmployeesDashboard = async (corporateUser) => {
    const currentDate = new Date();

    return await Employee.countDocuments({
      corporateUser,
      isEmployeeDeleted: false,
      $or: [
        // Probation and confirmed employees are active too.
        { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } },
        { 'offBoardingInformation.lastWorkingDay': { $gte: currentDate } }
      ]
    });
};

exports.getCurrentMonthTotalSalaryDashboard = async ({ corporateUser }) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [result] = await Salary.aggregate([
      {
        $match: { corporateUser, month, year }
      },
      {
        $group: {
          _id: null,
          totalPayableSum: { $sum: '$totalPayable' }
        }
      }
    ]);

    return result ? result.totalPayableSum : 0;
};

exports.getNextMonthTotalSalaryDashboard = async ({ corporateUser }) => {
    const now = new Date();
    let month = now.getMonth() + 2;
    let year = now.getFullYear();

    if (month === 13) {
      month = 1;
      year += 1;
    }

    const [result] = await Salary.aggregate([
      {
        $match: { corporateUser, month, year }
      },
      {
        $group: {
          _id: null,
          totalPayableSum: { $sum: '$totalPayable' }
        }
      }
    ]);

    return result ? result.totalPayableSum : 0;
};

exports.getSalarySummaryDashboard = async ({ corporateUser }) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [currentResult, lastResult, bankAccount, chartResult] = await Promise.all([
        Salary.aggregate([
            { $match: { corporateUser, month: currentMonth, year: currentYear } },
            { $group: { _id: null, total: { $sum: '$totalPayable' } } }
        ]),
        Salary.aggregate([
            { $match: { corporateUser, month: lastMonth, year: lastYear } },
            { $group: { _id: null, total: { $sum: '$totalPayable' } } }
        ]),
        CorporateBankAccount.findOne({ corporateUser })
            .select('accountHolderName accountNumber ifscCode branch nameAtBank')
            .lean(),
        Salary.aggregate([
            { $match: { corporateUser, year: currentYear } },
            { $group: { _id: '$month', totalSalary: { $sum: '$totalPayable' } } }
        ]),
    ]);

    const chartMap = {};
    chartResult.forEach(e => { chartMap[e._id] = e.totalSalary; });
    const payrollCosts = [];
    for (let i = 1; i <= 12; i++) {
        payrollCosts.push({ id: i, month: monthNames[i], totalSalary: chartMap[i] || 0 });
    }

    let primaryBank = null;
    if (bankAccount) {
        const acc = bankAccount.accountNumber || '';
        primaryBank = {
            accountHolderName: bankAccount.nameAtBank || bankAccount.accountHolderName || '',
            accountNumber: acc.length > 4 ? `XXXX${acc.slice(-4)}` : acc,
            ifscCode: bankAccount.ifscCode || '',
            branch: bankAccount.branch || '',
        };
    }

    return {
        currentMonthDue: currentResult[0]?.total || 0,
        lastMonthRolledOut: lastResult[0]?.total || 0,
        primaryBank,
        payrollCosts,
    };
};
