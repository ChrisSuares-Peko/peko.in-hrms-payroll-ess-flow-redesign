const Employee = require("../models/entities/employee");
const mongoose = require("mongoose");
const Salary = require("../models/entities/salary");

exports.checkDeductionAmount = async(employeeId,deductionDate,deductionAmount, corporateUserID) =>{
    try {
        const employeeQuery = {
            "_id": employeeId,
            corporateUser: corporateUserID
        };

        // Projection to include only the basicPay field
        const projection = {
            "salaryInformation.basicPay": 1,
            "_id": 0 // Exclude _id field from the result
        };

        // Execute the query
        const result = await Employee.findOne(employeeQuery, projection);

        const basicPay = result?.salaryInformation?.basicPay;

        const pipeline = [
            {
                $match: {
                    "employee": new mongoose.Types.ObjectId(employeeId),
                    "corporateUser": corporateUserID,
                    "salaryCycleStart": { $lte: new Date(deductionDate) },
                    "salaryCycleEnd": { $gte: new Date(deductionDate) }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDeductions: { $sum: { $add: ["$leaveDeduction", "$totalOtherDeduction"] } }
                }
            }
        ];

        const totalDeduction = await Salary.aggregate(pipeline);
        const totalDeductionRage = totalDeduction[0]?.totalDeductions.toFixed(2) || 0


        const nextTotalDeduction = parseInt(totalDeductionRage) + parseInt(deductionAmount)

        console.log({ totalDeductionRage, basicPay })

        if (nextTotalDeduction > basicPay) {
            return false;
        } else {
            return true;
        }

    } catch (error) {
        console.log(error)
        return false;
    }
}