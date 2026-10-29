const Reimbursement = require('../entities/reimbursement');
const { escapeSearch } = require('../../utils/escapeRegex');

const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose


exports.fetchReimbursementsByEmployeeAndCorporateUser = async (employeeId, corporateUserId, cycleStart, cycleEnd) => {
    
    try {
        const reimbursements = await Reimbursement.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserId,
            expenseDate: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
            transferMethod: 'SALARY',
            paymentStatus: { $in: ['UNPAID', 'APPROVED'] },
            // Blocks an employee-submitted claim from being paid via payroll before HR has reviewed it.
            // HR-created reimbursements have no `status` field at all, so this never affects them.
            status: { $ne: 'requestedByEmployee' }
        });

        const totalReimbursementsPay = reimbursements.reduce((total, item) => total + item.totalPay, 0);
        const reimbursementIds = reimbursements.map(item => item._id);

        return {
            reimbursements,
            totalReimbursementsPay,
            reimbursementIds
        };
    } catch (error) {
        throw new Error('Failed to fetch the reimbursement')
    }
};

exports.getAllReimbursements = async (corporateUserID, employeeId, page, limit, year, month, searchText) => {
    try {
      let skip = 0;
      if(page && limit){
        skip = (page - 1) * limit;
      }
        const queryConditions = {
            corporateUser: corporateUserID,
            employee: employeeId,
            $or: [
                { expenseDetails: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } }
            ]
        };

        if (year && month) {
            const firstDayOfMonth = new Date(year, month - 1, 1);
            const firstDayOfNextMonth = new Date(year, month, 1);
            const lastMillisecondOfLastDay = new Date(firstDayOfNextMonth - 1);

            queryConditions.expenseDate = {
                $gte: firstDayOfMonth,
                $lte: lastMillisecondOfLastDay
            };
        }
        let reimbursements;
        if(page && limit){
          reimbursements = await Reimbursement.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();
        }else{
           reimbursements = await Reimbursement.find(queryConditions)
            .exec();
        }

        const totalCount = await Reimbursement.countDocuments(queryConditions);

        return {
            count: totalCount,
            rows: reimbursements
        };
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.getReimbursements = async (
  corporateUserID,
  page = 1,
  limit = 10,
  year,
  month,
  searchText = ""
) => {

  const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const skip = (page - 1) * limit;
  const regex = new RegExp(escapeRegex(searchText), "i");

  const matchStage = {
    corporateUser: corporateUserID
  };

  if (year && month) {

    const firstDay = new Date(year, month - 1, 1);
    const nextMonth = new Date(year, month, 1);

    matchStage.expenseDate = {
      $gte: firstDay,
      $lt: nextMonth
    };
  }

  const pipeline = [

    { $match: matchStage },

    {
      $lookup: {
        from: "employee",
        localField: "employee",
        foreignField: "_id",
        as: "employee"
      }
    },

    {
      $unwind: "$employee"
    },
    {
  $addFields: {
    totalPayString: { $toString: "$totalPay" }
  }
}

  ];

  if (searchText) {

    pipeline.push({
      $match: {
        $or: [

          { managerEmail: regex },

          { paymentStatus: regex },
          
          { expenseDetails: regex },
          
          {paymentStatus: regex },

          {totalPayString: regex },


          { "employee.personalInformation.fullName": regex },

          { "employee.employeeInformation.employeeId": regex }

        ]
      }
    });

  }

  pipeline.push(

    { $sort: { createdAt: -1 } },

    {
      $facet: {

        rows: [
          { $skip: skip },
          { $limit: limit },
          {
        $addFields: {
          id: "$_id"
        }
      },
        ],

        count: [
          { $count: "total" }
        ]

      }
    }

  );

  const result = await Reimbursement.aggregate(pipeline);

  return {

    rows: result[0].rows,

    count: result[0].count[0]?.total || 0

  };

};

// ---- Employee Self-Service (ESS) reimbursement requests ----

exports.createReimbursementRequest = async (data) => Reimbursement.create(data);

// Employee's own claims — excludes cancelled ones unless a specific status is requested.
exports.findReimbursementByEmployee = async (corporateUser, employee, { status, from, to, page = 1, limit = 10 }) => {
    const query = { corporateUser, employee };
    if (status && status !== 'all') {
        query.status = status;
    } else {
        query.status = { $ne: 'cancelledByEmployee' };
    }
    if (from || to) {
        query.expenseDate = {};
        if (from) query.expenseDate.$gte = from;
        if (to) query.expenseDate.$lte = to;
    }
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
        Reimbursement.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Reimbursement.countDocuments(query),
    ]);

    return { records, total };
};

exports.findReimbursementByIdForEmployee = async (corporateUser, employee, reimbursementId) =>
    Reimbursement.findOne({ _id: reimbursementId, corporateUser, employee });

exports.cancelReimbursementRequest = async (corporateUser, employee, reimbursementId) =>
    Reimbursement.findOneAndUpdate(
        { _id: reimbursementId, corporateUser, employee },
        { $set: { status: 'cancelledByEmployee', paymentStatus: 'REJECTED' } },
        { new: true }
    );

