const Employee = require("../models/entities/employee");
const Salary = require("../models/entities/salary");

// corporateUser is optional: when passed, the employee lookup is scoped to that corporate
// (a foreign employee then resolves to "not found"). Existing callers are unaffected.
exports.checkSalaryDate = async (date, employeeId, cycleStart, cycleEnd, corporateUser) => {
    try {
        const salaryQuery = {
            "employee": employeeId,
            "salaryCycleStart": { "$eq": cycleStart },
            "salaryCycleEnd": { "$eq": cycleEnd },
            "paymentStatus": { "$in": ["PAID", "APPROVED"] }
        };

        const employeeQuery = {
            "_id": employeeId
        };
        if (corporateUser) employeeQuery.corporateUser = corporateUser;

        const [salaryResult, employeeResult] = await Promise.all([
            Salary.findOne(salaryQuery),
            Employee.findOne(employeeQuery)
        ]);

        if (corporateUser && !employeeResult) {
            return { status: false, message: 'Employee not found' };
        }

        // Check if the employee has joined before the provided date
        const joinDate = employeeResult.employeeInformation.dateOfJoin;
        const hasJoinedBefore = new Date(date) >= joinDate;
        
        if (salaryResult) {
            return { status: false, message: 'Salary for this employee is already approved or paid' };
        }

        if (!hasJoinedBefore) {
            return { status: false, message: 'Provided date is before the employee joined' };
        }
            return { status: true, message: '' };
    } catch (error) {
        console.log(error);
    }

}