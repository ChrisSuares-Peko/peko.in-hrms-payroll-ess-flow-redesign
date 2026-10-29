const Employee = require("../models/entities/payroll/employee");
const Increment = require("../models/entities/payroll/increment")
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose
const moment = require('moment');
const { customLog } = require("../utils/loggerHelper");
exports.incrementSalary = async () => {
    try {
        const today = new Date();
        let fetchAllIncrements = await Increment.find({});

        fetchAllIncrements.forEach(async increment => {
            // forEach does not await async callbacks, so catch per item or the error is lost
            try {
            // Convert effectiveDate to Date object
            const effectiveDate = new Date(increment.effectiveDate);

            // Check if today's date is equal to effectiveDate
            if (today.toISOString().slice(0, 10) === effectiveDate.toISOString().slice(0, 10)) {
                customLog(null, "info", { message: "Today's date matches effectiveDate for an increment:", increment })

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
                    customLog(null, "error", { message:"Error updating basicPay for employee", error })
                    throw error;
                }
            }
            } catch (error) {
                customLog(null, "error", { message: "Increment job failed for increment", incrementId: increment?._id || increment?.id, error: error?.message || error });
            }
        });



    } catch (error) {
        customLog(null, "error", { message:"increment salary catch", error })
        throw error
    }
}

// eslint-disable-next-line no-unused-vars
exports.fetchAdjustedBasicPay = async ({ basicPay = false, corporateUserID, dateOfJoin, employeeId, month, year }) => {
    try {
        let endOfMonth = moment({ year: year, month: month - 1 }).endOf('month');
        const increments = await Increment.aggregate([
            {
                $match: {
                    employee: new ObjectId(employeeId),
                    corporateUser: corporateUserID,
                    effectiveDate: {
                        $gte: dateOfJoin,
                        $lte: new Date(endOfMonth) 
                    },
                    //status: 'pending' need to find all , we disabled cron job 
                }
            },
            {
                $group: {
                    _id: null,
                    totalIncrements: { $sum: "$incrementAmount" }
                }
            }
        ]);
        // Extract result from the aggregation output
        const { totalIncrements } = increments[0] || { totalIncrements: 0 };

        // using this fetchAdjustedBasicPay function in two cases
        return basicPay ? (basicPay += totalIncrements) : totalIncrements;
    } catch (error) {
        return basicPay ? basicPay : 0;
    }
};

