const Employee = require('../entities/employee');

exports.getAllEmployees = async (userId) => {
    try {
        const employees = await Employee.find({
            corporateUser: userId,
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
        }, 'fullName personalEmail');

        return employees;
    } catch (error) {
        return error
    }
};

