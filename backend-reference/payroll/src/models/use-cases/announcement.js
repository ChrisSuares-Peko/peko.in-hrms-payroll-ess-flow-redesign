const Announcement = require('../entities/announcement');
const Employee = require('../entities/employee');
const { escapeSearch } = require('../../utils/escapeRegex');

exports.getAnnouncements = async ({ userId, page, limit, searchText, year, month, order }) => {
    try {
        const startIndex = (page - 1) * limit;
        order = order.toUpperCase() === 'DESC' ? -1 : 1;
  const queryConditions = {
            corporateUser: userId,
            $and: [
                { subject: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
            ]
        }
        if(month && year){
            queryConditions.createdAt = {
                $gte: new Date(year, month - 1, 1),
                $lt: new Date(year, month, 1)
            }
        }else if(year){
            queryConditions.createdAt = {
                $gte: new Date(year, 0, 1),
                $lt: new Date(year, 12, 1)
            }
        }

        // Construct the query conditions for search
      

        const announcements = await Announcement.find(queryConditions)
        .populate({
            path: 'excludedEmployees',
            select: 'personalInformation.fullName personalInformation.email employeeInformation.employeeStatus',
        })
            .sort({ createdAt: order })
            .skip(startIndex)
            .limit(limit);

        const totalAnnouncementsCount = await Announcement.countDocuments(queryConditions);

        return { totalAnnouncementsCount, announcements };
    } catch (error) {
        return error
    }
};

exports.getEmployees = async (userId) => {
    try {
        const employees = await Employee.find(
            {
                corporateUser: userId,
                'employeeInformation.employeeStatus': { $in: ['ACTIVE', 'LEAVE', 'CONFIRMED', 'INPROBATION'] },
                isEmployeeDeleted: false
            },
            { _id: 1, 'personalInformation.fullName': 1 }
        );

        return employees;
    } catch (error) {
        throw new Error('Error occured while fetching employees. Please try again');
    }
};

exports.getAllEmployees = async (userId) => {
    try {
        const employees = await Employee.find({
            corporateUser: userId,
            isEmployeeDeleted: false,
            'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] }
        }, { 'personalInformation.fullName': 1, 'personalInformation.email': 1 });

        return employees;
    } catch (error) {
        throw new Error('Error occured while fetching employees. Please try again');
    }
};
exports.getAllEmployeesData = async (userId, excludeEmployeeIds=[]) => {
    try {
      const employees = await Employee.find({
        corporateUser: userId,
        isEmployeeDeleted: false,
        'employeeInformation.employeeStatus': { $nin: ['SUSPENDED', 'RESIGNED'] },
        _id: { $nin: excludeEmployeeIds } // Exclude the employees with IDs in the excludeEmployeeIds array
      }, { 'personalInformation.fullName': 1, 'personalInformation.email': 1,'employeeInformation.workEmailId':1 });
  
      return employees;
    } catch (error) {
      throw new Error('Error occurred while fetching employees. Please try again');
    }
  };
  



// Announcements visible to a USER: MAILED ones for their corporate that don't exclude this employee. Paginated, newest first.
exports.getAnnouncementsForUser = async ({ corporateUser, employeeId, from, to, page = 1, limit = 10 }) => {
    const query = {
        corporateUser,
        status: 'MAILED',
        excludedEmployees: { $ne: employeeId },
    };
    if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = from;
        if (to) query.createdAt.$lte = to;
    }
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
        Announcement.find(query)
            .select('subject details createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Announcement.countDocuments(query),
    ]);

    return { announcements, total };
};

  exports.createAnnouncement = async (userId, subject, details, excludedEmployees) => {
    try {
        // Convert excluded employees' IDs to mongoose ObjectId format using 'new'
        //commented out as whether we need to add this feature or not
        // const excludedEmployeeIds = excludedEmployees.map(id => new mongoose.Types.ObjectId(id));


        // Create the announcement in the database
        const savedAnnouncement = await Announcement.create({
            corporateUser: userId,
            subject,
            details,
            status: 'MAILED',
            excludedEmployees
        });

        return savedAnnouncement;
    } catch (error) {
        console.error('Error occurred while adding announcement:', error);
        throw new Error('Error occurred while adding the announcement. Please try again.');
    }
};


