const Employee = require("../../entities/payroll/employee");
const Holiday = require("../../entities/payroll/holiyDay");
const { customLog } = require('../../../utils/loggerHelper');

/**
 * get upcoming birthdays
 * @param {string} userId corporateUser id 
 * @param {number} within number if days to be considered
 * @returns employees with next birth day date
 */
exports.getEmployeesByBirthday = async (userId, within) => {
    try {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + within);
        const employees = await Employee.find({
            corporateUser: userId,
            'employeeInformation.status': { $nin: ['SUSPENDED', 'RESIGNED'] }
        });
        const upcomingBirthdays = employees
            .map(employee => {
                const dob = new Date(employee.dateOfBirth);
                dob.setFullYear(today.getFullYear());
                if (dob < today) {
                    dob.setFullYear(today.getFullYear() + 1);
                }
                return {
                    id: employee.id,
                    fullName: employee.fullName,
                    dateOfBirth: employee.dateOfBirth,
                    nextBirthday: dob,
                    gender: employee.gender
                };
            })
            .filter(employee => employee.nextBirthday <= endDate);

        return upcomingBirthdays;
    } catch (error) {
        customLog(null, "error", { error, message: "Error getting employees by birthday" });
        return error;
    }
};


exports.getUpComingDocExpiries = async (userId, within) => {
    try {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + within);

        const employees = await Employee.find(
            { corporateUser: userId, 'employeeInformation.status': { $in: ['ACTIVE', 'LEAVE'] } }
        );

        let upcomingExpiryDocs = [];

        employees.forEach(employee => {
            employee.employeeDocuments.forEach(document => {
                if (document.expiryDate >= today && document.expiryDate <= endDate) {
                    upcomingExpiryDocs.push({
                        fullName: employee.fullName,
                        docName: document.name,
                        expiryDate: document.expiryDate,
                        id: employee.id
                    });
                }
            });
        });

        return upcomingExpiryDocs;
    } catch (error) {
        customLog(null, "error", { error, message: "Error getting upcoming doc expiries" });
        return error;
    }
};

exports.getEmployeesWithBirthdayToday = async (userId) => {
    try {
        const today = new Date();

        const employees = await Employee.find({
            corporateUser: userId,
            'employeeInformation.status': { $nin: ['SUSPENDED', 'RESIGNED'] },
            isEmployeeDeleted: false
        });

        const birthdaysToday = employees
            .map(employee => {
                const dob = new Date(employee.dateOfBirth);
                dob.setFullYear(today.getFullYear());
                if (dob < today) {
                    dob.setFullYear(today.getFullYear() + 1);
                }
                return {
                    id: employee.id,
                    fullName: employee.fullName,
                    dateOfBirth: employee.dateOfBirth,
                    email: employee.personalEmail,
                    nextBirthday: dob
                };
            })
            .filter(employee => {
                const birthday = new Date(employee.nextBirthday);
                return birthday.getDate() === today.getDate() && birthday.getMonth() === today.getMonth();
            });

        return birthdaysToday;
    } catch (error) {
        customLog(null, "error", { error, message: "Error getting employees with birthday today" });
        return error;
    }
};


exports.getUpcomingHolidays = async (userId, within) => {
    try {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + within);


        const upcomingHolidays = await Holiday.find({
            corporateUser: userId,
            start: { $gte: today },
            end: { $lte: endDate }
        }).sort({ start: 1 });


        return upcomingHolidays;
    } catch (error) {
        customLog(null, "error", { error, message: "Error getting upcoming holidays" });
        return error;
    }
};