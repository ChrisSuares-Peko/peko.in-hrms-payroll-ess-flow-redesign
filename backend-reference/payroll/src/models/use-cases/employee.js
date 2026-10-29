const Employee = require('../entities/employee');
const CorporateUser = require('../entities/corporateUser');
const OrganizationSetting = require('../entities/organizationSettings');
const BankDetails = require('../entities/bankDetails');
const moment = require('moment');
const { escapeSearch } = require('../../utils/escapeRegex');
const Salary = require('../entities/salary');

const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose

const OFFBOARDED_STATUSES = ['RESIGNED', 'SUSPENDED'];

const startOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

// An offboarded employee keeps serving notice through their last working day and becomes a
// past employee the day after. The same boundary decides the Active / Past Employees lists,
// the "Notice period" stage, and when their PAN, UAN, email, mobile, Employee ID and work
// email can be reused by a rehire.
exports.OFFBOARDED_STATUSES = OFFBOARDED_STATUSES;
exports.startOfToday = startOfToday;

// Query conditions for the employees of a company who still hold their identity fields: not
// deleted and not a past employee. Uses $nor so it can be spread into a query that has its own $or.
exports.activeEmployeeFilter = (corporateUser) => ({
    corporateUser,
    isEmployeeDeleted: false,
    $nor: [{
        'employeeInformation.employeeStatus': { $in: OFFBOARDED_STATUSES },
        'offBoardingInformation.lastWorkingDay': { $lt: startOfToday() },
    }],
});

// 'NOTICE_PERIOD' until the last working day, 'PAST' after it, null if not offboarded.
exports.getOffBoardingStage = (employee) => {
    const lastWorkingDay = employee?.offBoardingInformation?.lastWorkingDay;
    if (!OFFBOARDED_STATUSES.includes(employee?.employeeInformation?.employeeStatus) || !lastWorkingDay) {
        return null;
    }
    return new Date(lastWorkingDay) < startOfToday() ? 'PAST' : 'NOTICE_PERIOD';
};

// Probation is worked out from the joining date and probation months; employeeStatus only says
// whether HR still has to review it. INPROBATION (or a NEW_HIRE) waits for HR to confirm or
// extend; an older ACTIVE employee with probation months simply counts as confirmed once it ends.
const PROBATION_STATUSES = ['INPROBATION', 'NEW_HIRE'];
// Probation for a new employee when none is given (Add Employee, bulk upload blank cell).
exports.DEFAULT_PROBATION_MONTHS = 3;

exports.EMPLOYMENT_STAGE_LABELS = {
    ON_PROBATION: 'On probation',
    PROBATION_REVIEW_DUE: 'Probation review due',
    CONFIRMED: 'Confirmed',
    NOTICE_PERIOD: 'Notice period',
    EXITED: 'Exited',
};
const DAY_MS = 24 * 60 * 60 * 1000;
exports.PROBATION_STATUSES = PROBATION_STATUSES;

const probationEndDate = (employeeInformation) => {
    const { dateOfJoin, probationPeriod } = employeeInformation || {};
    if (!dateOfJoin || !(Number(probationPeriod) > 0)) return null;
    return moment(dateOfJoin).add(Number(probationPeriod), 'months').toDate();
};
exports.probationEndDate = probationEndDate;

// Stored status for an employee given a probation period: INPROBATION keeps them waiting for
// HR's review once it ends; with no probation they're simply active.
const statusForProbation = (probationPeriod) => (Number(probationPeriod) > 0 ? 'INPROBATION' : 'ACTIVE');
exports.statusForProbation = statusForProbation;

// employeeInformation from an edit form, keeping the fields only Confirm / Extend probation and
// offboarding change. Changing the probation months of an employee who isn't confirmed yet
// restarts the review on the new end date.
exports.withManagedEmploymentFields = (incoming, existing = {}) => {
    const probationPeriod = incoming?.probationPeriod ?? existing.probationPeriod ?? 0;
    const probationChanged = Number(probationPeriod || 0) !== Number(existing.probationPeriod || 0);
    const reviewable = ['ACTIVE', 'INPROBATION'].includes(existing.employeeStatus);
    return {
        ...incoming,
        probationPeriod,
        employeeStatus: probationChanged && reviewable
            ? statusForProbation(probationPeriod)
            : existing.employeeStatus || statusForProbation(probationPeriod),
        confirmationDate: existing.confirmationDate,
        confirmedBy: existing.confirmedBy,
    };
};

// What the employee list, profile and dashboard show as the employee's status:
// EXITED | NOTICE_PERIOD | ON_PROBATION | PROBATION_REVIEW_DUE | CONFIRMED, with the dates
// each one is labelled with.
exports.getEmploymentStage = (employee) => {
    const offBoardingStage = exports.getOffBoardingStage(employee);
    const lastWorkingDay = employee?.offBoardingInformation?.lastWorkingDay || null;
    if (offBoardingStage === 'PAST') return { stage: 'EXITED', lastWorkingDay };
    if (offBoardingStage === 'NOTICE_PERIOD') return { stage: 'NOTICE_PERIOD', lastWorkingDay };

    const employeeInformation = employee?.employeeInformation || {};
    const endDate = probationEndDate(employeeInformation);
    const confirmed = { stage: 'CONFIRMED', confirmationDate: employeeInformation.confirmationDate || endDate };
    if (employeeInformation.employeeStatus === 'CONFIRMED' || !endDate) return confirmed;

    const today = startOfToday();
    if (endDate > today) {
        return { stage: 'ON_PROBATION', probationEndDate: endDate, daysLeft: Math.ceil((endDate - today) / DAY_MS) };
    }
    if (PROBATION_STATUSES.includes(employeeInformation.employeeStatus)) {
        return { stage: 'PROBATION_REVIEW_DUE', probationEndDate: endDate };
    }
    return confirmed;
};

// The same stages as getEmploymentStage, as query conditions for the Active Employees filters.
// ON_PROBATION_ALL is the "On probation" filter: still on probation or waiting for review.
exports.employmentStageCondition = (stage) => {
    const today = startOfToday();
    const probationMonths = { $ifNull: ['$employeeInformation.probationPeriod', 0] };
    const endDate = {
        $dateAdd: { startDate: '$employeeInformation.dateOfJoin', unit: 'month', amount: { $toInt: probationMonths } },
    };
    const notOffBoarded = { $not: [{ $in: ['$employeeInformation.employeeStatus', OFFBOARDED_STATUSES] }] };
    const onProbationTrack = {
        $and: [
            notOffBoarded,
            { $ne: ['$employeeInformation.employeeStatus', 'CONFIRMED'] },
            { $gt: [probationMonths, 0] },
            { $ne: [{ $ifNull: ['$employeeInformation.dateOfJoin', null] }, null] },
        ],
    };
    const onProbation = { $and: [onProbationTrack, { $gt: [endDate, today] }] };
    const reviewDue = {
        $and: [
            onProbationTrack,
            { $in: ['$employeeInformation.employeeStatus', PROBATION_STATUSES] },
            { $lte: [endDate, today] },
        ],
    };

    switch (stage) {
        case 'ON_PROBATION_ALL':
            return { $expr: { $or: [onProbation, reviewDue] } };
        case 'ENDING_IN_30_DAYS':
            return { $expr: { $and: [onProbation, { $lte: [endDate, new Date(today.getTime() + 30 * DAY_MS)] }] } };
        case 'PROBATION_REVIEW_DUE':
            return { $expr: reviewDue };
        case 'CONFIRMED':
            return { $expr: { $and: [notOffBoarded, { $not: [{ $or: [onProbation, reviewDue] }] }] } };
        default:
            return {};
    }
};

// The first identity field (in `fields` order) another active employee of the company already
// holds, or null. `fields` maps a field path to the value to check; empty values are skipped.
exports.findActiveIdentityConflict = async (corporateUser, fields, excludeEmployeeId) => {
    const entries = Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && value !== '');
    if (!entries.length) return null;

    const conflicts = await Employee.find(
        {
            ...exports.activeEmployeeFilter(corporateUser),
            ...(excludeEmployeeId && { _id: { $ne: excludeEmployeeId } }),
            $or: entries.map(([path, value]) => ({ [path]: value })),
        },
        Object.fromEntries(entries.map(([path]) => [path, 1]))
    ).lean();

    const valueAt = (doc, path) => path.split('.').reduce((node, key) => node?.[key], doc);
    const match = entries.find(([path, value]) => conflicts.some(doc => valueAt(doc, path) === value));
    return match ? match[0] : null;
};


exports.getEmployeeCountByCorporateUser = async (userId) => {
    try {
        let matchConditions = {
            corporateUser: userId,
            isEmployeeDeleted: false,

        };

        const employeeCount = await Employee.countDocuments(matchConditions);
        const lastEmployee = await Employee.findOne(matchConditions)
            .sort({ createdAt: -1 })
            .select('createdAt');

        const lastEmployeeAddedDate = lastEmployee ? lastEmployee.createdAt : null;

        return { count: employeeCount, lastEmployeeAddedDate };
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.getEmployeesList = async (userId, searchText, month, year) => {
    try {

        const currentDate = new Date();

        // let matchConditions = {
        //     corporateUser: userId,
        //     isEmployeeDeleted: false,
        //     $or: [
        //         { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'CONFIRMED','INPROBATION'] } }
        //     ]
        // };
        let queryConditions = {
            corporateUser: userId,
            isEmployeeDeleted: false,
        $and: [
          {
            // Employee must not be fully past status
            $or: [
              { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } },
              { 'employeeInformation.employeeStatus': { $in: ['RESIGNED', 'SUSPENDED'] } }
            ]
          }
        ]
      }

        if (month !== undefined && year !== undefined) {

            const firstDayOfMonth = new Date(year, month - 1, 1);


            queryConditions.$and.push({
                $or: [
                    { offBoardingInformation: { $exists: false } },
                    // { 'employeeInformation.employeeStatus': { $in: ['RESIGNED', 'SUSPENDED'] } },
                    { 'offBoardingInformation.lastWorkingDay': { $gte: firstDayOfMonth } }
                ]
            });
        } else {
            queryConditions.$and.push({
                $or: [
                    { offBoardingInformation: { $exists: false } },
                    // { 'employeeInformation.employeeStatus': { $in: ['RESIGNED', 'SUSPENDED'] } },
                    { 'offBoardingInformation.lastWorkingDay': { $gte: currentDate } }
                ]
            });
        }

        if (searchText) {
            queryConditions['personalInformation.fullName'] = { $regex: `^${escapeSearch(searchText)}`, $options: 'i' };
        }

        const employees = await Employee.aggregate([
            { $match: queryConditions },
            {
                $project: {

                    label: '$personalInformation.fullName',
                    value: '$personalInformation.fullName',
                    employeeInformation: 1,
                    personalInformation: 1,
                    offBoardingInformation: 1,
                    employeeDocuments: 1,
                    id: '$_id',
                    _id: 0
                }
            },
            {
                $sort: { 'personalInformation.fullName': 1 } // Sort based on fullName from personalInformation
            }
        ]);


        return employees;
    } catch (error) {
        return error;
    }
};

exports.getAllEmployeesList = async (userId, searchText) => {
    try {

        const now = new Date();
        let matchConditions = {
            corporateUser: userId,
            isEmployeeDeleted: false,
            $or: [
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'INPROBATION', 'CONFIRMED'] } },
                { 'employeeInformation.employeeStatus': 'RESIGNED', 'offBoardingInformation.lastWorkingDay': { $gte: now } },
            ],
        };
        if (searchText) {
            matchConditions['personalInformation.fullName'] = { $regex: `^${escapeSearch(searchText)}`, $options: 'i' };
        }

        const employees = await Employee.find(matchConditions);
        return employees;
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.getEmployeeIds = async (userId) => {
    try {
        let matchConditions = {
            corporateUser: userId,
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] }
        };

        const employees = await Employee.find(matchConditions).select('employeeInformation.employeeId');
        return employees.map(emp => emp.employeeInformation.employeeId);
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.getActiveEmployees = async (userId) => {
    try {

        let employees = await Employee.find({
            corporateUser: userId,
            "employeeInformation.employeeStatus": {
                $nin: ["SUSPENDED", "RESIGNED"],
            },
        });

        return employees;
    } catch (error) {
        console.log(error);
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
        console.log({ error })
        return error;
    }
}

// exports.fetchEmployeesForGenerateSalary = async (corporateUserID, cycleStart, cycleEnd, employeeId='682b0bedf6bbc84034208ef2') => {
const buildGenerateSalaryQuery = (corporateUserID, cycleStart, cycleEnd, employeeId) => {
    let query = {
        corporateUser: corporateUserID,
        isEmployeeDeleted: false,
        'employeeInformation.employeeStatus': { $in: ["ACTIVE", "CONFIRMED","INPROBATION"] },
        'employeeInformation.dateOfJoin': {
            $lte: cycleEnd // Filtering employees with dateOfJoin less than or equal to the specified cycleEnd
        }
    };
    if (Array.isArray(employeeId)) {
        query._id = { $in: employeeId }
    } else if (employeeId) {
        query._id = employeeId
    }
    // Adding condition for 'offBoardingInformation.lastWorkingDay' if it's available
    query['$or'] = [
        { 'offBoardingInformation.lastWorkingDay': { $exists: false } },
        { 'offBoardingInformation.lastWorkingDay': { $gte: cycleStart } }
    ];
    return query;
}

// Same eligibility as fetchEmployeesForGenerateSalary, ids only — lets Salary Process
// work out which employees still need a (re)calculation without loading every document.
exports.fetchEmployeeIdsForGenerateSalary = async (corporateUserID, cycleStart, cycleEnd) => {
    const employees = await Employee.find(buildGenerateSalaryQuery(corporateUserID, cycleStart, cycleEnd)).select('_id').lean();
    return employees.map(e => e._id);
}

exports.fetchEmployeesForGenerateSalary = async (corporateUserID, cycleStart, cycleEnd, employeeId) => {
    try {
        let query = buildGenerateSalaryQuery(corporateUserID, cycleStart, cycleEnd, employeeId);
        // console.log("queryqueryquery", query)

        let employees = await Employee.find(query).populate({
            path: 'salaryComponents.component',
            model: 'SalaryComponent',
          });
        //   console.log("EMployee->",employees)
        // let employees = await Employee.find(query);
        // const componentIds = employees
        //     .flatMap(e => e.salaryComponents.map(sc => sc.component))
        //     .filter(id => id);
        // // .map(id => id.toString());

        // const components = await SalaryComponent12.find(
        //     { _id: { $in: componentIds } },
        //     {
        //         componentName: 1,
        //         status: 1,
        //         calculationType: 1,
        //         amountPercentage: 1
        //     }
        // );
        // console.log("-->>>", components)
        // const componentMap = Object.fromEntries(
        //     components.map(c => [c._id.toString(), c])
        // );

        // // Attach populated component fields
        // employees = employees.map(emp => {
        //     const updatedComponents = emp.salaryComponents.map(sc => ({
        //         ...sc,
        //         component: componentMap[sc.component] || null
        //     }));

        //     return {
        //         ...emp.toObject(),
        //         salaryComponents: updatedComponents
        //     };
        // });

        // console.log("=====?????",JSON.stringify(employees,2,undefined))
        return employees;
        // return components;
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.fetchEmployeeWithDepartment = async (corporateUserID, departmentId) => {
    try {

        const employee = await Employee.findOne({
            $and: [
                { corporateUser: corporateUserID },
                { 'employeeInformation.department': new ObjectId(departmentId) },
                { isEmployeeDeleted: false },
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } }
            ]
        });

        return employee;
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.findEmployees = async (queryConditions, sortCondition, skip, limit) => {
    try {
        return await Employee.find(queryConditions)
            .populate({
                path: 'employeeInformation.department',
                select: 'departmentName'
            })
            // See the identical collation on the local findEmployees below (used by
            // getAllEmployeesForCorporate) — same case-sensitivity issue applies here.
            .collation({ locale: 'en', strength: 2 })
            .sort(sortCondition)
            .skip(skip)
            .limit(limit)
            .exec();
    } catch (error) {
        console.log(error);
        return error;
    }
}

exports.findEmployeesForExcel = async (corporateUser, employeeStatus) => {
    try {
        const baseFilter = {
            corporateUser,
            isEmployeeDeleted: false,
        };

        let statusFilter = {};

        // Same split as the Active / Past Employees tabs: someone serving notice is still active.
        const pastCondition = {
            'employeeInformation.employeeStatus': { $in: OFFBOARDED_STATUSES },
            'offBoardingInformation.lastWorkingDay': { $lt: startOfToday() },
        };
        if (employeeStatus === 'active') {
            statusFilter = {
                'employeeInformation.employeeStatus': { $ne: 'NEW_HIRE' },
                $nor: [pastCondition],
            };
        }

        if (employeeStatus === 'past') {
            statusFilter = pastCondition;
        }
const employees = await Employee.find({
            ...baseFilter,
            ...statusFilter,
        }).populate({
            path: 'employeeInformation.department',
            select: 'departmentName',
        });
      
        return employees;

    } catch (error) {
        console.log(error,"errrror");
        throw error;
    }
};

exports.findEmployeeByIdAndCorporateUser = async (employeeId, corporateUser) => {
    try {
        const employee = await Employee.findOne({
            _id: employeeId,
            corporateUser: corporateUser,
            isEmployeeDeleted: false,
        })
            .populate('employeeInformation.department', 'departmentName')
            .populate({
                path: 'salaryComponents.component',
                model: 'SalaryComponent',
            })
            //   .populate({
            //     path: 'bankDetails',
            //     match: { isDefaultAccount: true },
            //   })
            .lean()
            .exec();
            if(employee?.employeeInformation?.reportingStaff){
                const reportStaff = await Employee.findOne({
                    _id: employee?.employeeInformation?.reportingStaff
                })
                employee.employeeInformation.reportingStaffName = reportStaff?.personalInformation?.fullName || null
            }

        return employee;
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.findEmployeeforReportingStaff = async (employeeId, corporateUserId) => {
    try {
        return await Employee.findOne({
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false
        });
    } catch (error) {
        console.log(error);
        return error;
    }
}

exports.updateEmployeeById = async (id, corporateUserId, updateFields) => {
    return await Employee.findOneAndUpdate(
        { _id: id, corporateUser: corporateUserId },
        { $set: updateFields },
        { new: true }
    );
}

exports.setEmployeeAsDeleted = async (employeeId, corporateUserId) => {
    try {
        return await Employee.findOneAndUpdate(
            {
                _id: employeeId,
                corporateUser: corporateUserId,
            },
            { $set: { isEmployeeDeleted: true } },
            { new: true }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
}

exports.updateEmployeeWorkSchedule = async (employeeId, corporateUser, isDeleted, workScheduleData) => {
    try {
        return await Employee.findOneAndUpdate(
            { _id: employeeId, corporateUser, isDeleted },
            { $set: { workSchedule: workScheduleData } },
            { new: true }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
}

exports.updateEmployeeWorkSchedule = async (employeeId, corporateUser, isDeleted, workScheduleData) => {
    try {
        return await Employee.findOneAndUpdate(
            { _id: employeeId, corporateUser, isDeleted },
            { $set: { workSchedule: workScheduleData } },
            { new: true }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.updateEmployeeOffBoardingInfo = async (employeeId, corporateUserId, offBoardingData) => {
    try {
        const updatedEmployee = await Employee.findOneAndUpdate(
            {
                _id: employeeId,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false,
                "employeeInformation.employeeStatus": { $ne: 'ACTIVE' },
                // Only edit an existing offboarding, never recreate a cancelled one.
                "offBoardingInformation.offBoardingType": { $exists: true }
            },
            {
                $set: {
                    "offBoardingInformation.offBoardingDate": offBoardingData.offBoardingDate,
                    "offBoardingInformation.lastWorkingDay": offBoardingData.lastWorkingDay,
                    "offBoardingInformation.noticePeriod": offBoardingData.noticePeriod,
                    "offBoardingInformation.offBoardingType": offBoardingData.offBoardingType,
                    "offBoardingInformation.reasonForOffBoarding": offBoardingData.reasonForOffBoarding
                }
            },
            { new: true }
        );
        return updatedEmployee;
    } catch (error) {
        console.log(error);
        return error;
    }
}

exports.updateEmployeeInformation = async (id, corporateUserId, employeeData) => {
    try {
        const updatedEmployee = await Employee.findOneAndUpdate(
            {
                _id: id,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false
            },
            {
                $set: {
                    "employeeInformation.dateOfJoin": employeeData.dateOfJoin,
                    "employeeInformation.employeeId": employeeData.employeeId,
                    "employeeInformation.designation": employeeData.designation,
                    "employeeInformation.department": employeeData.department,
                    "employeeInformation.workLocation": employeeData.workLocation,
                    "employeeInformation.employeeStatus": employeeData.status,
                    "employeeInformation.reportingStaff": employeeData.reportingStaff,
                    "employeeInformation.workingDays": employeeData.workingDays,
                    "employeeInformation.schedule": employeeData.schedule,
                    "employeeInformation.jobType": employeeData.jobType,
                    "employeeInformation.probation": employeeData.probation,
                    "employeeInformation.workingHours": employeeData.workingHours,
                    "employeeInformation.taxRegime": employeeData.taxRegime,
                    // Kept in sync with employeeInformation.taxRegime — the Statutory
                    // Components tab (and everywhere else that resolves a regime for TDS
                    // math, e.g. form16.js) reads otherConfigurations.tdsRegime, not this
                    // field, so leaving it stale here would show the OLD regime there after
                    // an edit made from the Basic Information tab.
                    "otherConfigurations.tdsRegime": employeeData.taxRegime
                }
            },
            { new: true }
        );

        return updatedEmployee;
    } catch (error) {
        console.log(error);
        return error;
    }
}

exports.updateEmployeeWorkEmail = async (id, corporateUserId, workEmailId) => {
    try {
        const updatedEmployee = await Employee.findOneAndUpdate(
            {
                _id: id,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false
            },
            {
                $set: {
                    "employeeInformation.workEmailId": workEmailId
                }
            },
            { new: true }
        );

        return updatedEmployee;
    } catch (error) {
        console.log(error);
        return error;
    }
}

exports.updateEmployeeSalaryInfo = async (id, corporateUserId, salaryData) => {
    try {
        const updatedEmployee = await Employee.findOneAndUpdate(
            {
                _id: id,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false
            },
            {
                $set: {
                    "salaryInformation.basicPay": salaryData.basicPay,
                    "salaryInformation.travelAllowances": salaryData.travelAllowances,
                    "salaryInformation.homeAllowances": salaryData.homeAllowances,
                    "salaryInformation.medicalAllowances": salaryData.medicalAllowances,
                    "salaryInformation.otherAllowances": salaryData.otherAllowances,
                    "salaryInformation.other": salaryData.other,
                }
            },
            { new: true }
        );

        return updatedEmployee;
    } catch (error) {
        console.log(error);
        return error;
    }
}

exports.updateEmployeeBankDetails = async (id, corporateUserId, bankDetails) => {
    try {
        const updatedEmployee = await Employee.findOneAndUpdate(
            {
                _id: id,
                corporateUser: corporateUserId,
                isEmployeeDeleted: false
            },
            {
                $set: {
                    "bankDetails.accountName": bankDetails.accountName,
                    "bankDetails.accountNumber": bankDetails.accountNumber,
                    "bankDetails.swiftCode": bankDetails.swiftCode,
                    "bankDetails.bankName": bankDetails.bankName,
                    "bankDetails.bankBranch": bankDetails.bankBranch,
                    "bankDetails.ibanNumber": bankDetails.ibanNumber,
                    "bankDetails.accountType": bankDetails.accountType,
                    "bankDetails.beneficiaryName": bankDetails.beneficiaryName,
                    "bankDetails.routingCode": bankDetails.routingCode
                }
            },
            { new: true }
        );

        return updatedEmployee;
    } catch (error) {
        console.log(error);
        return error;
    }
}


exports.getUnbankedEmployees = async (corporateUserId) => {
    try {
        const allEmployees = await Employee.find(
            {
                corporateUser: corporateUserId,
                isEmployeeDeleted: false,
                'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] }
            },
            '_id'
        );

        const bankedEmployeeIds = await BankDetails.distinct('employeeId', {
            corporateUser: corporateUserId,
        });

        const bankedSet = new Set(bankedEmployeeIds.map(id => id.toString()));
        const unbankedEmployees = allEmployees.filter(emp => !bankedSet.has(emp._id.toString()));

        return unbankedEmployees;
    } catch (error) {
        console.log(error);
        return [];
    }
}

const findEmployees = async (queryConditions, sortCondition, skip, limit) => {
    try {
        return await Employee.find(queryConditions)
        .populate({
                path: 'employeeInformation.department',
                select: 'departmentName'
            })
            // Without this, Mongo's default byte-order comparison sorts every
            // uppercase-starting name before every lowercase one (e.g. "Yasir" before
            // "babar") regardless of actual letter — strength: 2 makes the sort
            // case-insensitive so alphabetical order matches what a person expects.
            .collation({ locale: 'en', strength: 2 })
            .sort(sortCondition)
            .skip(skip)
            .limit(limit)
            .exec();
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.getEmployeesForCorporate = async (corporateUserID, page, limit, searchText, status, sortField, sortOrder) => {
    try {
        const skip = (page - 1) * limit;
        const currentDate = new Date();
        let queryConditions;
        if (status === 'active') {
            queryConditions = {
                corporateUser: corporateUserID,
                isEmployeeDeleted: false,
                $or: [
                    { "fullName": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } },
                    { "employeeInformation.employeeId": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } }
                ],
                $and: [
                    {
                        $or: [
                            { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE'] } },
                            {
                                $and: [
                                    { 'employeeInformation.employeeStatus': { $in: ['RESIGNED', 'SUSPENDED'] } },
                                    { 'offBoardingInformation.lastWorkingDay': { $gte: currentDate } }
                                ]
                            }
                        ]
                    }
                ]
            };
        } else if (status === 'past') {
            queryConditions = {
                corporateUser: corporateUserID,
                "employeeInformation.employeeStatus": { $in: ['RESIGNED', 'SUSPENDED'] },
                'offBoardingInformation.lastWorkingDay': { $lt: currentDate },
                isEmployeeDeleted: false,
                $or: [
                    { "fullName": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } },
                    { "employeeInformation.employeeId": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } }
                ],
            };
        } else {
            queryConditions = {
                corporateUser: corporateUserID,
                isEmployeeDeleted: false,
                $or: [
                    { "fullName": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } },
                    { "employeeInformation.employeeId": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } },
                ],
            };
        }

        const sortMapping = {
            fullName: 'personalInformation.fullName',
            employeeId: 'employeeInformation.employeeId',
            dateOfJoin: 'employeeInformation.dateOfJoin'
        };
        const actualSortField = sortMapping[sortField] || 'createdAt';
        let sortCondition = {};
        sortCondition[actualSortField] = sortOrder;

        const employees = await findEmployees(queryConditions, sortCondition, skip, limit);
        const totalEmployeesCount = await Employee.countDocuments(queryConditions);

        return {
            count: totalEmployeesCount,
            rows: employees
        };
    } catch (error) {
        console.log(error);
        return error;
    }
};

// new implementations  +++++++++++++++++++++++++
const EMPLOYMENT_STAGE_FILTERS = ['ON_PROBATION_ALL', 'ENDING_IN_30_DAYS', 'PROBATION_REVIEW_DUE', 'CONFIRMED'];

exports.getAllEmployeesForCorporate = async (corporateUserID, page, limit, searchText, status, sortField, sortOrder, stageFilter) => {
    try {
        const skip = (page - 1) * limit;
        let queryConditions;
        // if (status === 'active') {
        //      queryConditions = {
        //         corporateUser: corporateUserID,
        //         isEmployeeDeleted: false,
        //         $and: [
        //             // 1️⃣ Search by name or employeeId
        //             {
        //                 $or: [
        //                     { "personalInformation.fullName": { $regex: `^${searchText}`, $options: "i" } },
        //                     { "employeeInformation.employeeId": { $regex: `^${searchText}`, $options: "i" } }
        //                 ]
        //             },
        //             // 2️⃣ Employee status filter
        //             {
        //                 $or: [
        //                     { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } },
        //                     {
        //                         'employeeInformation.employeeStatus': { $in: ['RESIGNED', 'SUSPENDED'] },
        //                         'offBoardingInformation.lastWorkingDay': { $gte: currentDate }
        //                     },
        //                     { offBoardingInformation: { $exists: false } }
        //                 ]
        //             },
                   
        //         ]
        //     };

        // }
        const today = new Date();
       today.setHours(0, 0, 0, 0);
        if (status === 'active') {
        queryConditions = {
        corporateUser: corporateUserID,
        isEmployeeDeleted: false,
    $and: [
      {
        $or: [
          { "personalInformation.fullName": { $regex: `${escapeSearch(searchText)}`, $options: "i" } },
          { "employeeInformation.employeeId": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } }
        ]
      },
      {
        $or: [
          // 1️⃣ Employees with no offboarding info → true active
          { offBoardingInformation: { $exists: false } },
          // 2️⃣ Employees whose LWD is today or later
          { "offBoardingInformation.lastWorkingDay": { $gte: today } }
        ]
      },
      {
        // Employee must not be fully past status
        $or: [
          { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } },
          { 'employeeInformation.employeeStatus': { $in: ['RESIGNED', 'SUSPENDED'] } }
        ]
      }
    ]
  };
}
         else if (status === 'past') {
            queryConditions = {
                corporateUser: corporateUserID,
                'offBoardingInformation.offBoardingType': { $in: ['RESIGNATION', 'SUSPENSION'] },
                'offBoardingInformation.lastWorkingDay': { $lt: today },
                isEmployeeDeleted: false,
                $or: [
                    { "personalInformation.fullName": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } },
                    { "employeeInformation.employeeId": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } }
                ],
            };
        } else {
            queryConditions = {
                corporateUser: corporateUserID,
                isEmployeeDeleted: false,
                $or: [
                    { "fullName": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } },
                    { "employeeInformation.employeeId": { $regex: `^${escapeSearch(searchText)}`, $options: "i" } },
                ],
            };
        }

        const sortMapping = {
            fullName: 'personalInformation.fullName',
            employeeId: 'employeeInformation.employeeId',
            dateOfJoin: 'employeeInformation.dateOfJoin'
        };
        const actualSortField = sortMapping[sortField] || 'createdAt';
        let sortCondition = {};
        sortCondition[actualSortField] = sortOrder;

        // Active Employees filters (All / On probation / Ending in 30 days / Review due / Confirmed),
        // each counted with the current search.
        let stageCounts;
        if (status === 'active') {
            const withStage = (stage) => ({
                ...queryConditions,
                $and: [...queryConditions.$and, exports.employmentStageCondition(stage)],
            });
            const [all, ...counts] = await Promise.all([
                Employee.countDocuments(queryConditions),
                ...EMPLOYMENT_STAGE_FILTERS.map(stage => Employee.countDocuments(withStage(stage))),
            ]);
            stageCounts = { ALL: all, ...Object.fromEntries(EMPLOYMENT_STAGE_FILTERS.map((stage, i) => [stage, counts[i]])) };
            if (EMPLOYMENT_STAGE_FILTERS.includes(stageFilter)) queryConditions = withStage(stageFilter);
        }

        const employees = await findEmployees(queryConditions, sortCondition, skip, limit);
        const totalEmployeesCount = await Employee.countDocuments(queryConditions);

        return {
            count: totalEmployeesCount,
            stageCounts,
            rows: employees.map(employee => ({
                ...employee.toJSON(),
                offBoardingStage: exports.getOffBoardingStage(employee),
                employmentStage: exports.getEmploymentStage(employee),
            }))
        };
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.getOnBoardStatusByCorporateId = async (corporateUser) => {
    try {
        return await CorporateUser.findOne({ _id: corporateUser }, { onboardStatus: 1, isSkippedDasboard: 1, _id: 0 })
    } catch (error) {
        return error;

    }
}

exports.getNoOfDaysWorking = async (corporateUser) => {
    try {
        const organizationData = await OrganizationSetting.findOne({ corporateUser }, { 'payrollSettings.selectWorkingDays': 1, _id: 0 })
        const noOfDays = countWeekdaysInCurrentMonth(organizationData?.payrollSettings?.selectWorkingDays || [])
        // return organizationData?.payrollSettings?.selectWorkingDays || []
        return noOfDays
    } catch (error) {
        return error;

    }
}

function countWeekdaysInCurrentMonth(includedDays) {
    // Normalize to lowercase
    const normalizedDays = includedDays.map(day => day.toLowerCase());

    // Map short day names to moment weekday numbers (0 = Sunday, ..., 6 = Saturday)
    const dayMap = {
        sun: 0,
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6
    };

    // Convert normalized day names to weekday numbers
    const includedDayNumbers = normalizedDays.map(day => dayMap[day]);

    const startOfMonth = moment().startOf('month');
    const endOfMonth = moment().endOf('month');

    let currentDate = startOfMonth.clone();
    let count = 0;

    while (currentDate.isSameOrBefore(endOfMonth)) {
        if (includedDayNumbers.includes(currentDate.day())) {
            count++;
        }
        currentDate.add(1, 'day');
    }
    return count;
}

exports.getEmployeesBySearch = async (userId, searchText, month, year) => {
    try {

        const currentDate = new Date();

        let matchConditions = {
            corporateUser: userId,
            isEmployeeDeleted: false,
            $or: [
                { 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } }
            ]
        };

        if (month !== undefined && year !== undefined) {

            const firstDayOfMonth = new Date(year, month - 1, 1);


            matchConditions.$or.push({
                $and: [
                    { 'employeeInformation.employeeStatus': { $in: ['RESIGNED', 'SUSPENDED'] } },
                    { 'offBoardingInformation.lastWorkingDay': { $gte: firstDayOfMonth } }
                ]
            });
        } else {
            matchConditions.$or.push({
                $and: [
                    { 'employeeInformation.employeeStatus': { $in: ['RESIGNED', 'SUSPENDED'] } },
                    { 'offBoardingInformation.lastWorkingDay': { $gte: currentDate } }
                ]
            });
        }

        if (searchText) {
            matchConditions['personalInformation.fullName'] = { $regex: `^${escapeSearch(searchText)}`, $options: 'i' };
        }

        const employees = await Employee.aggregate([
            { $match: matchConditions },
            {
                $project: {
                   
                    label: '$personalInformation.fullName',
                    value: '$personalInformation.fullName',
                    employeeInformation: 1,
                    personalInformation: 1,
                    employeeDocuments: 1,
                    id: '$_id',
                    _id: 0
                }
            },
            {
                $sort: { 'personalInformation.fullName': 1 } // Sort based on fullName from personalInformation
            }
        ]);

       
        return employees;
    } catch (error) {
        return error;
    }
};

exports.getNoOfDaysWorkingDashboard = async (corporateUser) => {
    const organizationData = await OrganizationSetting.findOne(
      { corporateUser },
      { 'payrollSettings.selectWorkingDays': 1 }
    ).lean();

    return countWeekdaysInCurrentMonth(
      organizationData?.payrollSettings?.selectWorkingDays || []
    );
};

exports.getOnBoardStatusByCorporateIdDashboard = async (corporateUser) => {
    return await CorporateUser.findOne(
      { _id: corporateUser },
      {
        onboardStatus: 1,
        isSkippedDasboard: 1,
        _id: 0
      }
    ).lean();
};

exports.getEmployeesUsingCorporateIdDashboard = async (corporateUser) => {
    return await Employee.exists({ corporateUser });
};

const SETTLED_SALARY_STATUSES = ['APPROVED', 'INITIATED', 'PAID', 'COMPLETED'];

// An offboarding can be cancelled only while the employee is serving notice. After the last
// working day they are a past employee and come back as a rehire instead.
const findCancellableOffBoarding = (employeeId, corporateUser) => Employee.findOne({
    _id: employeeId,
    corporateUser,
    isEmployeeDeleted: false,
    'employeeInformation.employeeStatus': { $in: OFFBOARDED_STATUSES },
    'offBoardingInformation.lastWorkingDay': { $gte: startOfToday() },
}).lean();

// The final-month salary, prorated to the last working day, that a payroll run has already
// approved or paid. A pending one is recalculated on the next run, so it needs no warning.
const findSettledFinalSalary = (employee) => {
    const { lastWorkingDay } = employee.offBoardingInformation;
    return Salary.findOne(
        {
            corporateUser: employee.corporateUser,
            employee: employee._id,
            salaryCycleStart: { $lte: lastWorkingDay },
            salaryCycleEnd: { $gte: lastWorkingDay },
            paymentStatus: { $in: SETTLED_SALARY_STATUSES },
        },
        { month: 1, year: 1, paymentStatus: 1 }
    ).lean();
};

// Status to restore: saved when the employee was offboarded. Offboardings made before it was
// saved can't tell ACTIVE from CONFIRMED, so they fall back to the default ACTIVE, or INPROBATION
// while the probation period (in months) still runs, as the profile header works it out.
const statusBeforeOffBoarding = (employee) => {
    const saved = employee.offBoardingInformation?.previousEmployeeStatus;
    if (saved && !OFFBOARDED_STATUSES.includes(saved)) return saved;

    const { dateOfJoin, probationPeriod } = employee.employeeInformation || {};
    const inProbation = dateOfJoin && probationPeriod > 0
        && moment(dateOfJoin).add(probationPeriod, 'months').isAfter(moment());
    return inProbation ? 'INPROBATION' : 'ACTIVE';
};

// What the cancel confirmation shows, or null if the offboarding can't be cancelled.
exports.getCancelOffBoardingPreview = async (employeeId, corporateUser) => {
    const employee = await findCancellableOffBoarding(employeeId, corporateUser);
    if (!employee) return null;

    const settledSalary = await findSettledFinalSalary(employee);
    const { offBoardingDate, lastWorkingDay, offBoardingType } = employee.offBoardingInformation;
    return {
        fullName: employee.personalInformation?.fullName,
        offBoardingDate,
        lastWorkingDay,
        offBoardingType,
        restoredStatus: statusBeforeOffBoarding(employee),
        settlementProcessed: !!settledSalary,
        settledSalary: settledSalary
            ? { month: settledSalary.month, year: settledSalary.year, paymentStatus: settledSalary.paymentStatus }
            : null,
    };
};

// Withdraws the resignation: the employee is active again with everything else as it was, and
// the offboarding moves to offBoardingHistory as CANCELLED. Returns null if it can't be cancelled.
exports.cancelOffBoarding = async ({ employeeId, corporateUser, cancelledBy, reason }) => {
    const employee = await findCancellableOffBoarding(employeeId, corporateUser);
    if (!employee) return null;

    const { offBoardingInformation } = employee;
    return Employee.findOneAndUpdate(
        {
            _id: employee._id,
            corporateUser,
            // Unchanged since it was read, so a concurrent edit or cancel isn't overwritten.
            'employeeInformation.employeeStatus': employee.employeeInformation.employeeStatus,
            'offBoardingInformation.lastWorkingDay': offBoardingInformation.lastWorkingDay,
        },
        {
            $set: { 'employeeInformation.employeeStatus': statusBeforeOffBoarding(employee) },
            $unset: { offBoardingInformation: 1 },
            $push: {
                offBoardingHistory: {
                    ...offBoardingInformation,
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancelledBy,
                    cancellationReason: reason || null,
                },
            },
        },
        { new: true }
    );
};

const PROBATION_STAGES = ['ON_PROBATION', 'PROBATION_REVIEW_DUE'];
const MAX_PROBATION_MONTHS = 24;

const findProbationEmployee = async (employeeId, corporateUser) => {
    const employee = await Employee.findOne({ _id: employeeId, corporateUser, isEmployeeDeleted: false }).lean();
    if (!employee) return { error: 'Employee not found', status: 404 };
    const employmentStage = exports.getEmploymentStage(employee);
    if (!PROBATION_STAGES.includes(employmentStage.stage)) {
        return { error: 'This employee is not on probation.', status: 400 };
    }
    return { employee, employmentStage };
};

// Unchanged since it was read, so a concurrent offboarding or edit isn't overwritten.
const unchangedSinceRead = (employee) => ({
    _id: employee._id,
    corporateUser: employee.corporateUser,
    'employeeInformation.employeeStatus': employee.employeeInformation.employeeStatus,
    'employeeInformation.probationPeriod': employee.employeeInformation.probationPeriod,
});

// Ends probation. The confirmation date is the day probation ended, or today when HR confirms early.
exports.confirmProbation = async (employeeId, corporateUser, confirmedBy) => {
    const found = await findProbationEmployee(employeeId, corporateUser);
    if (found.error) return found;

    const today = startOfToday();
    const { probationEndDate: endDate } = found.employmentStage;
    const employee = await Employee.findOneAndUpdate(
        unchangedSinceRead(found.employee),
        {
            $set: {
                'employeeInformation.employeeStatus': 'CONFIRMED',
                'employeeInformation.confirmationDate': endDate < today ? endDate : today,
                'employeeInformation.confirmedBy': confirmedBy,
            },
        },
        { new: true }
    );
    return employee ? { employee } : { error: 'The employee changed meanwhile. Reload and try again.', status: 409 };
};

// Adds months to the probation period; the review moves to the new end date. Each extension is
// kept with its reason in probationExtensions.
exports.extendProbation = async (employeeId, corporateUser, { months, reason, extendedBy }) => {
    const found = await findProbationEmployee(employeeId, corporateUser);
    if (found.error) return found;

    const probationPeriod = (Number(found.employee.employeeInformation.probationPeriod) || 0) + months;
    if (probationPeriod > MAX_PROBATION_MONTHS) {
        return { error: `Probation can't be longer than ${MAX_PROBATION_MONTHS} months in total.`, status: 400 };
    }
    const previousEndDate = found.employmentStage.probationEndDate;
    const employee = await Employee.findOneAndUpdate(
        unchangedSinceRead(found.employee),
        {
            $set: {
                'employeeInformation.probationPeriod': probationPeriod,
                'employeeInformation.employeeStatus': 'INPROBATION',
            },
            $unset: { 'employeeInformation.confirmationDate': 1, 'employeeInformation.confirmedBy': 1 },
            $push: {
                probationExtensions: {
                    months,
                    reason,
                    previousEndDate,
                    newEndDate: moment(previousEndDate).add(months, 'months').toDate(),
                    extendedAt: new Date(),
                    extendedBy,
                },
            },
        },
        { new: true }
    );
    return employee ? { employee } : { error: 'The employee changed meanwhile. Reload and try again.', status: 409 };
};

// Probation reviews for the dashboard and calendar: employees whose probation ends within the
// next `days` days, plus the overdue ones (ended, not yet confirmed or extended).
exports.getProbationReviews = async (corporateUser, days) => {
    const employees = await Employee.find(
        { ...exports.activeEmployeeFilter(corporateUser), ...exports.employmentStageCondition('ON_PROBATION_ALL') },
        { 'personalInformation.fullName': 1, employeeInformation: 1, offBoardingInformation: 1 }
    ).lean();

    const horizon = new Date(startOfToday().getTime() + days * DAY_MS);
    return employees
        .map(employee => ({ employee, employmentStage: exports.getEmploymentStage(employee) }))
        .filter(({ employmentStage }) => employmentStage.stage === 'PROBATION_REVIEW_DUE'
            || (employmentStage.stage === 'ON_PROBATION' && employmentStage.probationEndDate <= horizon))
        .map(({ employee, employmentStage }) => ({
            id: employee._id,
            fullName: employee.personalInformation?.fullName,
            probationEndDate: employmentStage.probationEndDate,
            overdue: employmentStage.stage === 'PROBATION_REVIEW_DUE',
        }));
};

// The calendar/dashboard wording for a probation review; overdue reviews are dated today.
exports.probationReviewActivity = ({ fullName, probationEndDate, overdue }) => {
    const endDate = moment(probationEndDate).format('YYYY-MM-DD');
    return {
        title: overdue ? `Probation review overdue — ${fullName}` : `Probation review — ${fullName}`,
        body: overdue
            ? `Probation ended on ${endDate}. Confirm or extend from the employee profile.`
            : `Probation ends on ${endDate}. Confirm or extend from the employee profile.`,
        start: overdue ? startOfToday() : probationEndDate,
    };
};
