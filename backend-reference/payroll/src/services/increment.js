const Employee = require("../models/entities/employee");
const Increment = require("../models/entities/increment")
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose
const moment = require('moment');
exports.incrementSalary = async () => {
    try {
        const today = new Date();
        let fetchAllIncrements = await Increment.find({});

        fetchAllIncrements.forEach(async increment => {
            // Convert effectiveDate to Date object
            const effectiveDate = new Date(increment.effectiveDate);

            // Check if today's date is equal to effectiveDate
            if (today.toISOString().slice(0, 10) === effectiveDate.toISOString().slice(0, 10)) {
                console.log("Today's date matches effectiveDate for an increment:", increment);

                //update employees
                try {
                    // Update the basicPay with newBasicSalary
                    await Employee.updateOne(
                        { _id: increment.employee },
                        { $set: { 'salaryInformation.basicPay': increment.newBasicSalary } }
                    );

                    //update status
                    await Increment.updateOne(
                        { _id: increment._id },
                        { $set: { status: 'reflected' } }
                    );
                } catch (error) {
                    console.error(`Error updating basicPay for employee ${increment.employee}:`, error);
                    throw error;
                }
            }
        });



    } catch (error) {
        console.log(error);
        throw error
    }
}

// eslint-disable-next-line no-unused-vars
// exports.fetchAdjustedBasicPay = async ({ basicPay = false, corporateUserID, dateOfJoin, employeeId, month, year }) => {
//     try {
//         let endOfMonth = moment({ year: year, month: month - 1 }).endOf('month');
//         const increments = await Increment.aggregate([
//             {
//                 $match: {
//                     employee: new ObjectId(employeeId),
//                     corporateUser: corporateUserID,
//                     effectiveDate: {
//                         $gte: dateOfJoin,
//                         $lte: new Date(endOfMonth) 
//                     },
//                     //status: 'pending' need to find all , we disabled cron job 
//                 }
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalIncrements: { $sum: "$amount" }
//                 }
//             }
//         ]);
//         // Extract result from the aggregation output
//         const { totalIncrements } = increments[0] || { totalIncrements: 0 };

//         // using this fetchAdjustedBasicPay function in two cases
//         return basicPay ? (basicPay += totalIncrements) : totalIncrements;
//     } catch (error) {
//         return basicPay ? basicPay : 0;
//     }
// };

exports.fetchAdjustedBasicPay = async ({
  baseBasic = 0,      
  corporateUserID,
  dateOfJoin,
  employeeId,
  month,
  year
}) => {
  try {
    const endOfMonth = moment({ year, month: month - 1 }).endOf("month").toDate();

    const increments = await Increment.aggregate([
      {
        $match: {
          employee: new ObjectId(employeeId),
          corporateUser: corporateUserID,
          status: "reflected",           // only apply increments confirmed by cron
          effectiveDate: {
            $gte: dateOfJoin,
            $lte: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          totalIncrements: { $sum: "$amount" }
        }
      }
    ]);

    const totalIncrements = increments[0]?.totalIncrements || 0;

    // ✅ ALWAYS APPLY ON BASE BASIC
    return Number(baseBasic) + Number(totalIncrements);

  } catch (error) {
    return Number(baseBasic);
  }
};


