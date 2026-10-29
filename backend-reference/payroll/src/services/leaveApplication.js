

const Employee = require("../models/entities/employee");
const HrSettings = require("../models/entities/hrSettings");
const OrganizationSettings = require("../models/entities/organizationSettings");
const LeaveApplication = require("../models/entities/leaveApplication");
const { getHolidaysInARange } = require("../models/use-cases/holiyDay");
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose

function isEligibleForLeave(dateOfJoin, eligibilityTimePeriod) {
    const currentDate = new Date();
    const oneYearInMillis = 365 * 24 * 60 * 60 * 1000; // milliseconds in a year

    // Calculate the eligible date based on the date of joining and eligibility time period
    const eligibleDate = new Date(dateOfJoin.getTime() + (eligibilityTimePeriod * oneYearInMillis));

    // Check if the current date is after the eligible date
    return currentDate >= eligibleDate;
}
function getLeaveCycle(dateOfJoin, eligibilityTimePeriod) {
    // eslint-disable-next-line no-useless-catch
    try {
        const currentDate = new Date();

        // Calculate the eligible date after the eligibility time period in years
        let eligibleDate = new Date(dateOfJoin);
        eligibleDate.setFullYear(eligibleDate.getFullYear() + eligibilityTimePeriod);

        let cycleStarts = eligibleDate;
        let cycleEnds = new Date(cycleStarts);
        cycleEnds.setFullYear(cycleEnds.getFullYear() + 1);
        cycleEnds.setDate(cycleEnds.getDate() - 1);

        // Adjust the cycle end to ensure it is in the future relative to the current date
        while (cycleEnds < currentDate) {
            cycleStarts = new Date(cycleEnds);
            cycleStarts.setDate(cycleStarts.getDate() + 1); // Start the next cycle the next day
            cycleEnds = new Date(cycleStarts);
            cycleEnds.setFullYear(cycleEnds.getFullYear() + 1);
            cycleEnds.setDate(cycleEnds.getDate() - 1);
        }
        cycleStarts.setUTCHours(0, 0, 0, 0);
        cycleEnds.setUTCHours(23, 59, 59, 999);
        return { cycleStarts, cycleEnds }
    } catch (error) {
        throw error
    }
}

// exports.getAvailableLeaves = async (params) => {
//     let remainingLeaves = []
//     remainingLeaves.push({
//         name: 'UNPAID',
//         count: 'Available'
//     })
//     try {
//         let { employeeId, corporateUserID } = params


//         const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID }).lean();
//         if (!existingHrSettings) {
//             return {
//                 status: true,
//                 data: remainingLeaves
//             }
//         }
//         const { leaveSettings } = existingHrSettings

//         //first check employee doj and minimum period ot get the leave 
//         const employee = await Employee.findOne({ _id: employeeId, corporateUser: corporateUserID });
//         const dateOfJoin = employee?.employeeInformation?.dateOfJoin
//         const eligibilityTimePeriod = leaveSettings.eligibilityTimePeriod
//         const isEligible = isEligibleForLeave(dateOfJoin, eligibilityTimePeriod);
//         if (!isEligible) {
//             return {
//                 status: true,
//                 data: remainingLeaves
//             }
//         }

//         let { cycleStarts, cycleEnds } = getLeaveCycle(dateOfJoin, eligibilityTimePeriod)
//         //need to find between startDate and current date
//         const leaveCounts = await LeaveApplication.aggregate([
//             {
//                 $match: {
//                     employee: new ObjectId(employeeId),
//                     corporateUser: corporateUserID,
//                     start: { $gte: cycleStarts, $lte: cycleEnds } // Filtering by start date within leave the cycle
//                 }
//             },
//             {
//                 $group: {
//                     _id: '$typeOfLeave',
//                     leaveCount: { $sum: '$leaveCount' }
//                 }
//             }
//         ]);

//         // Iterate through each leave type in leaveSettings
//         for (const leaveType in leaveSettings) {
//             if ((leaveType !== 'eligibilityTimePeriod') && (leaveType !== 'salaryCycleDay')) {
//                 const usedCount = leaveCounts.find(item => item._id === leaveType)?.leaveCount || 0;
//                 const totalCount = leaveSettings[leaveType];
//                 const remainingCount = totalCount - usedCount;

//                 remainingLeaves.push({
//                     name: leaveType,
//                     count: remainingCount >= 0 ? remainingCount : 'Exceeded'
//                 });
//             }
//         }
//         return {
//             status: true,
//             data: remainingLeaves
//         }
//     } catch (error) {
//         console.log(error)
//         return {
//             status: false,
//             data: remainingLeaves,
//             message: 'Something went wrong while getting available leaves'
//         }
//     }
// }

exports.getAvailableLeaves = async (params) => {
    let remainingLeaves = [];
    remainingLeaves.push({
        value: 'UNPAID',
        label: 'Unpaid',
        count: 'Available'
    });
    try {
        let { employeeId, corporateUserID } = params;

        const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID }).lean();
        if (!existingHrSettings) {
            return {
                status: true,
                data: remainingLeaves
            };
        }
        const { leaveSettings } = existingHrSettings;

        // Define mapping between leave names and labels
        const leaveLabels = {
            annualLeave: 'Annual Leave',
            sickLeave: 'Sick Leave',
            parentalLeave: 'Parental Leave',
            sabbaticalLeave: 'Sabbatical Leave',
            studyLeave: 'Study Leave',
            HajjAndUmrahLeave: 'Hajj And Umrah Leave',
            maternityLeave: 'Maternity Leave',
            officialLeavesAndVacations: 'Official Leaves And Vacations',
            otherPaidLeaves: 'Other Paid Leaves'
        };

        // first check employee doj and minimum period to get the leave
        const employee = await Employee.findOne({ _id: employeeId, corporateUser: corporateUserID });
        const dateOfJoin = employee?.employeeInformation?.dateOfJoin;
        const eligibilityTimePeriod = leaveSettings.eligibilityTimePeriod;
        const isEligible = isEligibleForLeave(dateOfJoin, eligibilityTimePeriod);
        if (!isEligible) {
            return {
                status: true,
                data: remainingLeaves
            };
        }

        let { cycleStarts, cycleEnds } = getLeaveCycle(dateOfJoin, eligibilityTimePeriod);
        // need to find between startDate and current date
        const leaveCounts = await LeaveApplication.aggregate([
            {
                $match: {
                    employee: new ObjectId(employeeId),
                    corporateUser: corporateUserID,
                    start: { $gte: cycleStarts, $lte: cycleEnds } // Filtering by start date within leave the cycle
                }
            },
            {
                $group: {
                    _id: '$typeOfLeave',
                    leaveCount: { $sum: '$leaveCount' }
                }
            }
        ]);
        // Iterate through each leave type in leaveSettings
        for (const leaveType in leaveSettings) {
            if ((leaveType !== 'eligibilityTimePeriod') && (leaveType !== 'salaryCycleDay')) {
                const usedCount = leaveCounts.find(item => item._id === leaveType)?.leaveCount || 0;
                const totalCount = leaveSettings[leaveType];
                const remainingCount = totalCount - usedCount;

                remainingLeaves.push({
                    label: leaveLabels[leaveType] || leaveType,
                    value: leaveType,
                    count: remainingCount >= 0 ? remainingCount : 'Exceeded'
                });
            }
        }
        return {
            status: true,
            data: remainingLeaves
        };
    } catch (error) {
        console.log(error);
        return {
            status: false,
            data: remainingLeaves,
            message: 'Something went wrong while getting available leaves'
        };
    }
};
exports.getTakenLeaves = async (params) => {
    const leaveObj = {
        "Annual Leave": 0,
        "Medical Leave": 0,
        "Other Leaves": 0,
        "Unpaid Leave": 0,
    }

    try {
        let { employeeId, corporateUserID } = params;

        const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID }).lean();
        if (!existingHrSettings) {
            //need to send values as 0
            return {
                status: true,
                data: leaveObj
            };
        }
        const { leaveSettings } = existingHrSettings;

        // first check employee doj and minimum period to get the leave
        const employee = await Employee.findOne({ _id: employeeId, corporateUser: corporateUserID });
        const dateOfJoin = employee?.employeeInformation?.dateOfJoin;
        const eligibilityTimePeriod = leaveSettings.eligibilityTimePeriod;

        let { cycleStarts, cycleEnds } = getLeaveCycle(dateOfJoin, eligibilityTimePeriod);
        // need to find between startDate and current date
        const leaveCounts = await LeaveApplication.aggregate([
            {
                $match: {
                    employee: new ObjectId(employeeId),
                    corporateUser: corporateUserID,
                    start: { $gte: cycleStarts, $lte: cycleEnds } // Filtering by start date within leave the cycle
                }
            },
            {
                $group: {
                    _id: '$typeOfLeave',
                    leaveCount: { $sum: '$leaveCount' }
                }
            }
        ]);
        console.log("leave counts",leaveCounts)
        console.log({ leaveCounts })
        leaveCounts.forEach((data) => {
            const { _id: type, leaveCount } = data
            switch (type) {
                case 'annualLeave':
                    leaveObj["Annual Leave"] += leaveCount
                    break;
                case 'UNPAID':
                    leaveObj["Unpaid Leave"] += leaveCount
                    break;
                case 'sickLeave':
                    leaveObj["Medical Leave"] += leaveCount
                    break;
                default:
                    leaveObj["Other Leaves"] += leaveCount
                    break;
            }
        })
        return {
            status: true,
            data: leaveObj
        };
    } catch (error) {
        console.log(error);
        return {
            status: true,
            data: leaveObj,
            message: 'Something went wrong while getting available leaves'
        };
    }
};
exports.validateLeaveCount = async (leaveData, typeOfLeave, leaveCount, existingLeaveCount = false) => {
    console.log({ leaveData, typeOfLeave, leaveCount, existingLeaveCount })
    try {
        const requestedLeave = leaveData.find(leave => leave.value === typeOfLeave);
        if (requestedLeave) {
            let availableCount;
            switch (requestedLeave.count) {
                case 'Available':
                    availableCount = Infinity;
                    break;
                case 'Exceeded':
                    availableCount = 0;
                    break;
                default:
                    availableCount = parseFloat(requestedLeave.count) || 0;
                    break;
            }
            //if editing already applied leave
            if (existingLeaveCount) {
                availableCount += existingLeaveCount
            }
            return leaveCount <= availableCount;
        }
        // Consider throwing an error here for an unknown leave type
        return false; // Leave type not found
    } catch (error) {
        console.error('Error in validateLeaveCount:', error);
        return false; // Some unexpected error occurred
    }
}

const WEEKDAY_NAME_TO_JS_DAY = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

// Authoritative day count for a full-day leave request: walks every calendar
// date in [start, end] and counts only the ones that are both a configured
// working day (OrganizationSettings.payrollSettings.selectWorkingDays — the
// same field the Payroll Cycle "Working Days" setting actually writes, and
// the same lookup countWeekdaysInCurrentMonth already uses) and not a
// declared company holiday. Callers must not trust a client-supplied
// leaveCount for full-day requests — recompute it here instead.
exports.calculateWorkingLeaveDays = async (corporateUser, start, end) => {
    const orgSettings = await OrganizationSettings.findOne({ corporateUser }).select('payrollSettings.selectWorkingDays').lean();
    const selectWorkingDays = orgSettings?.payrollSettings?.selectWorkingDays;
    const workingWeekdays = Array.isArray(selectWorkingDays) && selectWorkingDays.length > 0
        ? new Set(selectWorkingDays.map(day => WEEKDAY_NAME_TO_JS_DAY[String(day).toUpperCase()]).filter(d => d !== undefined))
        : new Set([1, 2, 3, 4, 5]); // default Mon-Fri if not configured

    const holidays = await getHolidaysInARange(corporateUser, start, end);
    const holidayRanges = (Array.isArray(holidays) ? holidays : []).map(h => ({
        start: new Date(h.start).setHours(0, 0, 0, 0),
        end: new Date(h.end).setHours(23, 59, 59, 999),
    }));

    let count = 0;
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    while (cursor <= endDate) {
        const dayStart = cursor.getTime();
        const isWorkingWeekday = workingWeekdays.has(cursor.getDay());
        const isHoliday = holidayRanges.some(h => h.start <= dayStart && h.end >= dayStart);
        if (isWorkingWeekday && !isHoliday) count++;
        cursor.setDate(cursor.getDate() + 1);
    }

    return count;
};

// async function calculateLeaveAndHours(workHoursOfUser, startDate, endDate, corporateUserID) {
//     function checkIsHoliday(availableHoliday, day) {
//         try {
//             const checkDate = new Date(day);

//             for (const holiday of availableHoliday) {
//                 const startDate = new Date(holiday.start);
//                 const endDate = new Date(holiday.end);
//                 // Check if the day falls within the holiday period
//                 if (checkDate >= startDate && checkDate <= endDate) {
//                     return true; // The day falls within a holiday
//                 }
//             }
//             return false; // The day is not within any holiday
//         } catch (error) {
//             console.log(error);
//             return false;
//         }
//     }

//     function getWorkHrs(workHoursOfUser) {
//         let { endTime, startTime, breakTimeHrs } = workHoursOfUser
//         const totalDurationMs = endTime - startTime;
//         const breakTimeMs = breakTimeHrs * 60 * 60 * 1000;
//         const workingHoursMs = totalDurationMs - breakTimeMs;
//         return workingHoursMs / (60 * 60 * 1000);
//     }
//     if (!startDate || !endDate || !workHoursOfUser) {
//         return 0
//     }
//     workHoursOfUser.workHrs = getWorkHrs(workHoursOfUser)
//     // Convert start and end date to Date objects
//     var start = new Date(startDate);
//     var end = new Date(endDate);
//     let availableHoliday = await getHolidaysInARange(corporateUserID, start, end) //get holidays within this range

//     // Initialize variables
//     var leaveHours = 0;
//     var leaveCount = 0;
//     var daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
//     // Loop through each day between start and end date
//     while (start <= end) {
//         var netHrs = end - start
//         var actualNetHrs = netHrs / (1000 * 60 * 60); // Convert milliseconds to hours
//         var dayOfWeek = daysOfWeek[start.getDay()];
//         var isWorkingDay = workHoursOfUser.days[dayOfWeek];
//         if (isWorkingDay) {
//             //next need to check is start is a holiday as per company policy or not
//             let isHoliday = checkIsHoliday(availableHoliday, start) //return true/false
//             if (!isHoliday) {
//                 if (actualNetHrs <= workHoursOfUser.workHrs / 2) {//manage half day
//                     leaveHours += workHoursOfUser.workHrs / 2;
//                 } else {
//                     leaveHours += workHoursOfUser.workHrs;
//                 }
//             }
//         }
//         start.setDate(start.getDate() + 1);
//     }
//     leaveCount = leaveHours / workHoursOfUser.workHrs;
//     //next need to deduct holidays

//     return {
//         leaveHours: leaveHours,
//         leaveCount: leaveCount
//     };
// }