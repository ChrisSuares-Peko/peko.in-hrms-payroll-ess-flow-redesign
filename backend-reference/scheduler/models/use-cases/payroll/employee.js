const Employee = require('../../entities/payroll/employee');

const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose
const { customLog } = require('../../../utils/loggerHelper');


exports.getEmployeesList = async (userId, searchText) => {
    try {

        let matchConditions = {
            corporateUser: userId,
            isEmployeeDeleted: false,
            'employeeInformation.status': { $in: ['ACTIVE', 'LEAVE'] }
        };
        if (searchText) {
            matchConditions.fullName = { $regex: `^${searchText}`, $options: 'i' };
        }

        const employees = await Employee.aggregate([
            { $match: matchConditions },
            {
                $addFields: {
                    workHours: {
                        $divide: [
                            {
                                $subtract: [
                                    { $toDate: '$workSchedule.endTime' },
                                    { $toDate: '$workSchedule.startTime' }
                                ]
                            },
                            3600000 // Convert milliseconds to hours
                        ]
                    }
                }
            },
            {
                $addFields: {
                    'workSchedule.workHrs': {
                        $subtract: ['$workHours', '$workSchedule.breakTimeHrs']
                    }
                }
            },
            {
                $project: {
                    fullName: 1,
                    label: '$fullName',
                    value: '$fullName',
                    workSchedule: 1,
                    employeeInformation: 1,
                    id: '$_id', // Include only the id field
                    _id: 0 // Exclude the _id field
                }
            },
            {
                $sort: { fullName: 1 } // Sort by fullName in ascending order
            }
        ]);

        return employees;
    } catch (error) {
        console.log(error);
        return error;
    }
};



exports.getAllEmployeesList = async (userId, searchText) => {
    try {

        let matchConditions = {
            corporateUser: userId,
            isEmployeeDeleted: false,
            'employeeInformation.status': { $in: ['ACTIVE', 'LEAVE'] }
        };
        if (searchText) {
            matchConditions.fullName = { $regex: `^${searchText}`, $options: 'i' };
        }

        const employees = await Employee.find(matchConditions);
        return employees;
    } catch (error) {
        customLog(null, "error", { error, message: "Error getting all employees list" });
        return error;
    }
};

exports.getEmployeeIds = async (userId) => {
    try {
        let matchConditions = {
            corporateUser: userId,
            isEmployeeDeleted: false,
            'employeeInformation.status': { $in: ['ACTIVE', 'LEAVE'] }
        };

        const employees = await Employee.find(matchConditions).select('employeeInformation.employeeId');
        return employees.map(emp => emp.employeeInformation.employeeId);
    } catch (error) {
        customLog(null, "error", { error, message: "Error getting employee IDs" });
        return error;
    }
};



exports.getActiveEmployees = async (userId) => {
    try {

        let employees = await Employee.find({
            corporateUser: userId,
            "employeeInformation.status": {
                $nin: ["SUSPENDED", "RESIGNED"],
            },
        });

        return employees;
    } catch (error) {
        customLog(null, "error", { error, message: "Error getting active employees" });
        return error;
    }
};

exports.getEmployeesUsingCorporateId = async (corporateUser) => {
    try {
        return await Employee.find({ corporateUser })

    } catch (error) {
        return error;

    }
}

exports.getEmployeesUsingId = async (id) => {
    try {
        return await Employee.findOne({ _id: id })

    } catch (error) {
        return error;

    }
}
exports.findOneCorporateEmployee = async ({ employeeId, corporateUserID }) => {
    try {
        return await Employee.findOne({
            _id: employeeId,
            corporateUser: corporateUserID
        })
    } catch (error) {
        customLog(null, "error", { error, message: "Error finding corporate employee" });
        throw error;
    }
}

exports.fetchEmployeesForGenerateSalary = async (corporateUserID, cycleStart, cycleEnd, employeeId) => {
    try {
        let query = {
            corporateUser: corporateUserID,
            isEmployeeDeleted: false,
            'employeeInformation.dateOfJoin': {
                $lte: cycleEnd // Filtering employees with dateOfJoin less than or equal to the specified cycleEnd
            }
        };
        if (employeeId) {
            query._id = employeeId
        }
        // Adding condition for 'offBoardingInformation.lastWorkingDay' if it's available
        query['$or'] = [
            { 'offBoardingInformation.lastWorkingDay': { $exists: false } },
            { 'offBoardingInformation.lastWorkingDay': { $gte: cycleStart } }
        ];

        let employees = await Employee.find(query);
        return employees;
    } catch (error) {
        customLog(null, "error", { error, message: "Error fetching employees for generate salary" });
        return error;
    }
};

exports.fetchEmployeeWithDepartment = async (corporateUserID, departmentId) => {
    try {

        const employee = await Employee.findOne({
            $and: [
                { corporateUser: corporateUserID },
                { 'employeeInformation.department': new ObjectId(departmentId) },
                {isEmployeeDeleted: false},
                {'employeeInformation.status':'ACTIVE'}
            ]
        });

        return employee;
    } catch (error) {
        customLog(null, "error", { error, message: "Error fetching employee with department" });
        return error;
    }
};
