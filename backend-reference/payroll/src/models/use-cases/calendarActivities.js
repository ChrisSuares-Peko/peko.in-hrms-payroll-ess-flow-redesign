const Employee = require("../entities/employee");
const Holiday = require("../entities/holiyDay");

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
            'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
        });
        const upcomingBirthdays = employees
            .map(employee => {
                const dob = new Date(employee.personalInformation.dateOfBirth);
                dob.setFullYear(today.getFullYear());
                if (dob < today) {
                    dob.setFullYear(today.getFullYear() + 1);
                }
                return {
                    id: employee.id,
                    fullName: employee.personalInformation.fullName,
                    dateOfBirth: employee.personalInformation.dateOfBirth,
                    nextBirthday: dob,
                    gender: employee.personalInformation.gender
                };
            })
            .filter(employee => employee.nextBirthday <= endDate);

        return upcomingBirthdays;
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.getAllEmployees = async (userId) => {
    try {
        const employees = await Employee.find({
            corporateUser: userId,
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
        }, 'fullName personalEmail');

        return employees;
    } catch (error) {
        return error;
    }
};


exports.getUpComingDocExpiries = async (userId, within) => {
    try {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + within);

        const employees = await Employee.find(
            { corporateUser: userId, 'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] } }
        );
         
        let upcomingExpiryDocs = [];

        employees.forEach(employee => {
            employee.employeeDocuments.forEach(document => {
                if (document.expiryDate >= today && document.expiryDate <= endDate) {
                    upcomingExpiryDocs.push({
                        fullName: employee.personalInformation.fullName,
                        docName: document.name,
                        expiryDate: document.expiryDate,
                        id: employee.id
                    });
                }
            });
        });

        return upcomingExpiryDocs;
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.getEmployeesWithBirthdayToday = async (userId) => {
    try {
        const today = new Date();

        const employees = await Employee.find({
            corporateUser: userId,
            'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] },
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
        console.log(error);
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
        console.log(error);
        return error;
    }
};

exports.getEmployeesByBirthdayDashboard = async (corporateUser, within) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + within);
    const currentYear = today.getFullYear();

    return Employee.aggregate([
        {
            $match: {
                corporateUser,
                isEmployeeDeleted: false,
                'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
            }
        },
        {
            $addFields: {
                thisYearBirthday: {
                    $dateFromParts: {
                        year: currentYear,
                        month: { $month: '$personalInformation.dateOfBirth' },
                        day:   { $dayOfMonth: '$personalInformation.dateOfBirth' }
                    }
                }
            }
        },
        {
            $addFields: {
                nextBirthday: {
                    $cond: {
                        if:   { $gte: ['$thisYearBirthday', today] },
                        then: '$thisYearBirthday',
                        else: {
                            $dateFromParts: {
                                year:  currentYear + 1,
                                month: { $month: '$personalInformation.dateOfBirth' },
                                day:   { $dayOfMonth: '$personalInformation.dateOfBirth' }
                            }
                        }
                    }
                }
            }
        },
        { $match: { nextBirthday: { $lte: endDate } } },
        {
            $project: {
                _id: 0,
                fullName: '$personalInformation.fullName',
                gender:   '$personalInformation.gender',
                nextBirthday: 1
            }
        }
    ]);
};

exports.getUpComingDocExpiriesDashboard = async (corporateUser, within) => {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + within);

    return Employee.aggregate([
        {
            $match: {
                corporateUser,
                isEmployeeDeleted: false,
                'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] },
                'employeeDocuments.expiryDate': { $gte: today, $lte: endDate }
            }
        },
        { $unwind: '$employeeDocuments' },
        {
            $match: {
                'employeeDocuments.expiryDate': { $gte: today, $lte: endDate }
            }
        },
        {
            $project: {
                _id: 0,
                fullName:   '$personalInformation.fullName',
                docName:    '$employeeDocuments.name',
                expiryDate: '$employeeDocuments.expiryDate'
            }
        }
    ]);
};

exports.getUpcomingHolidaysDashboard = async (corporateUser, within) => {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + within);

    return Holiday.find(
      {
        corporateUser,
        start: { $gte: today, $lte: endDate }
      },
      { title: 1, start: 1 }
    )
      .sort({ start: 1 })
      .lean();
};
