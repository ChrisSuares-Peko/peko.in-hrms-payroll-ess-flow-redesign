const { getDaysDifference } = require("../../../utils/dateUtils");
const HrSettings = require("../../entities/payroll/hrSettings");
const Salary = require("../../entities/payroll/salary");
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose

exports.findOneSalary = async (params) => {
    try {
        const { corporateUserID, salaryId } = params
        const salary = await Salary.findOne({
            corporateUser: corporateUserID,
            _id: new ObjectId(salaryId),
        }).populate('employee corporateUser').lean().exec();
        if (!salary || !salary.employee) {
            throw new Error('Salary or employee details not available for this user')
        }
        const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID });
        if (!existingHrSettings || !existingHrSettings.officialDocuments) {
            throw new Error('Hr settings not available for this user')
        }
        salary.officialDocuments = existingHrSettings.officialDocuments
        return salary
    } catch (error) {
        return error
    }
}
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
        const { corporateUserID, salaryId } = params
        const salary = await Salary.updateOne(
            {
                corporateUser: corporateUserID,
                _id: new ObjectId(salaryId),
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


        const salary = await Salary.updateMany(
            {
                corporateUser: corporateUserID,
                month,
                year
            },
            { payingDate, paymentStatus })

        return salary
    } catch (error) {
        return error
    }
}

exports.getSalaryDetails = async (params) => {
    try {
        const { page, limit, searchText, cycleStart, cycleEnd, corporateUserID } = params;
        // const cycleDays = getDaysDifference(cycleStart, cycleEnd)
        // Calculate the skip value based on the page and limit
        const skip = (page - 1) * limit;

        // Aggregation pipeline for searching across collections
        const aggregationPipeline = [
            {
                $match: {
                    corporateUser: corporateUserID,
                    $and: [
                        { salaryCycleStart: { $gte: new Date(cycleStart) } },
                        { salaryCycleEnd: { $lte: new Date(cycleEnd) } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'employees', // Replace 'employees' with your actual Employee collection name
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'employee'
                }
            },
            {
                $unwind: '$employee'
            },
            {
                $lookup: {
                    from: 'departments', // Replace 'departments' with your actual department collection name
                    let: { departmentId: '$employee.employeeInformation.department' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$departmentId'] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                departmentName: 1
                            }
                        }
                    ],
                    as: 'department'
                }
            },
            // Unwind the 'department' array if needed
            {
                $unwind: '$department'
            },
            {
                $addFields: {
                    'others': {
                        $sum: [
                            '$totalIncentive',
                            '$totalBonus',
                            '$totalOvertime'
                        ]
                    },
                    'monthlySalary': {
                        $sum: [
                            '$salaryInformation.basicPay',
                            '$salaryInformation.travelAllowances',
                            '$salaryInformation.homeAllowances',
                            '$salaryInformation.medicalAllowances',
                            '$salaryInformation.otherAllowances',
                            '$salaryInformation.other'
                        ]
                    }
                }
            }
        ];
        // Projecting and transforming fields
        aggregationPipeline.push(
            {
                $addFields: {
                    'employee.id': '$employee._id',
                    'employee._id': '$$REMOVE',
                    'employee.updatedAt': '$$REMOVE',
                    'employee.createdAt': '$$REMOVE',
                    'employee.salaryInformation': '$$REMOVE',
                    'employee.bankDetails': '$$REMOVE',
                    'employee.employeeDocuments': '$$REMOVE',
                    'employee.workSchedule': '$$REMOVE',
                    'employee.__v': '$$REMOVE',
                    'id': '$_id',
                    '_id': '$$REMOVE',
                    '__v': '$$REMOVE',
                    'overtime': '$$REMOVE',
                    'bonus': '$$REMOVE',
                    'incentives': '$$REMOVE',
                    'otherDeductions': '$$REMOVE',
                    'updatedAt': '$$REMOVE',
                    'createdAt': '$$REMOVE',

                }
            }
        );

        // Add $match condition for searchText if provided
        // Add $match condition for searchText if provided
        if (searchText) {
            aggregationPipeline.push({
                $match: {
                    $or: [
                        { 'employee.fullName': { $regex: `^${searchText}`, $options: 'i' } },
                        { 'employee.employeeInformation.employeeId': { $regex: `^${searchText}`, $options: 'i' } },
                        { 'employee.employeeInformation.designation': { $regex: `^${searchText}`, $options: 'i' } }
                    ]
                }
            });
        }


        // Group stage to compute total count without pagination
        const countPipeline = [...aggregationPipeline];
        countPipeline.push(
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 }
                }
            }
        );
        let totalSalaryData = await Salary.aggregate(aggregationPipeline);
        const totalPayableSum = totalSalaryData.reduce((total, item) => total + item.totalPayable, 0);

        const [totalCountResult] = await Salary.aggregate(countPipeline);

        const totalCount = totalCountResult ? totalCountResult.count : 0;

        aggregationPipeline.push(
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        );

        const salaryDetails = await Salary.aggregate(aggregationPipeline);
        const cycleDays = getDaysDifference(cycleStart, cycleEnd)
        return {
            count: totalCount,
            salaryCycle: { salaryCycleStart: cycleStart, salaryCycleEnd: cycleEnd, salaryCycleDays: cycleDays },
            totalPayableSum: totalPayableSum || 'N/A',
            rows: salaryDetails,
        };
    } catch (error) {
        return error;
    }
};

//salary-details for excel data
exports.getExcelSalaryDetails = async (params) => {
    try {
        const { cycleStart, cycleEnd, corporateUserID } = params;

        // Construct the query conditions for search
        const queryConditions = {
            corporateUser: corporateUserID,
            $and: [
                { salaryCycleStart: { $gte: new Date(cycleStart) } },
                { salaryCycleEnd: { $lte: new Date(cycleEnd) } }
            ]
        };

        const salaryDetails = await Salary.find(queryConditions)
            .populate({
                path: 'employee',
                match: { isEmployeeDeleted: false },
                select: 'fullName salaryInformation employeeInformation personalEmail', // Specify the fields you want to populate
                populate: {
                    path: 'employeeInformation.department',
                    model: 'Department',
                    select: 'departmentName'
                }
            })
            .exec();

        return salaryDetails;
    } catch (error) {
        return error;
    }
};

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



