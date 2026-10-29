const Deductions = require("../../entities/payroll/deductions");
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose
const { customLog } = require('../../../utils/loggerHelper');


exports.findDuplicateDeduction = async (params) => {
    const { corporateUserID, employeeId, ...otherParams } = params;
    try {
        const query = {
            corporateUser: corporateUserID,
            employee: employeeId,
            ...otherParams
        };
        const deduction = await Deductions.findOne(query);
        if (!deduction) {
            return false; // Or handle as needed
        }
        return deduction;
    } catch (error) {
        customLog(null, "error", { error, message: error.message || "Failed to find deduction" });
        throw new Error('Failed to find deduction');
    }
};

exports.updateDeduction = async (deductionId, updateParams) => {
    try {
        const deduction = await Deductions.findOne({
            _id: deductionId, employee: updateParams.employeeId,
            corporateUser: updateParams.corporateUserID,
        });
        if (!deduction) {
            return { status: false, message: 'Deduction not found' }
        }
        if (deduction && deduction.deductionStatus == 'DEDUCTED') {
            return { status: false, message: 'This deduction has already been processed' }
        }
        deduction.deductionDate = updateParams.deductionDate
        deduction.deductionType = updateParams.deductionType
        deduction.deductionAmount = updateParams.deductionAmount

        let updated = await deduction.save()

        return { status: true, updated };

    } catch (error) {
        customLog(null, "error", { error, message: error.message || "Error updating deduction" });
        return { status: false, message: 'Something went wrong while updating deduction details' }
    }
};
exports.deleteDeduction = async (deductionId, corporateUserID, employeeId) => {
    try {
        const deduction = await Deductions.findOne({
            _id: deductionId,
            employee: employeeId,
            corporateUser: corporateUserID,
        });
        if (!deduction) {
            return { status: false, message: 'Deduction not found' };
        }

        if (deduction.deductionStatus === 'DEDUCTED') {
            return { status: false, message: 'Deduction has already been processed and cannot be deleted' };
        }

        const deletedDeduction = await Deductions.findByIdAndDelete(deductionId);
        return { status: true, message: 'Deduction deleted successfully', deletedDeduction };

    } catch (error) {
        customLog(null, "error", { error, message: error.message || "Error deleting deduction" });
        return { status: false, message: 'Failed to delete deduction due to an error' };
    }
};


exports.createDeduction = async (params) => {
    try {
        const deduction = new Deductions({
            employee: params.employeeId,
            corporateUser: params.corporateUserID,
            ...params
        });

        return await deduction.save()
    } catch (error) {
        customLog(null, "error", { error, message: error.message || "Failed to create deduction" });
        throw new Error('Faild to create deduction')
    }
}

exports.findAllDeductionWthCount = async (params) => {
    const { corporateUserID, employeeId, limit, skip, cycleStart, cycleEnd } = params
    try {
        const queryConditions = {
            corporateUser: corporateUserID,
            employee: employeeId,
            deductionDate: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
        };

        const deductions = await Deductions.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();
        const totalCount = await Deductions.countDocuments(queryConditions);

        return { totalCount, deductions };

    } catch (error) {
        customLog(null, "error", { error, message: error.message || "Error fetching deductions" });
        throw new Error('Something went wrong while fetching deduction')
    }
}
exports.fetchDeductionsByEmployeeAndCorporateUser = async (employeeId, corporateUserId, cycleStart, cycleEnd) => {
    try {
        const deductions = await Deductions.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserId,
            deductionDate: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
            deductionStatus: 'PENDING'
        }, { deductionAmount: 1, _id: 1 }); 

        const totalDeductionsPay = deductions.reduce((total, item) => total + item.deductionAmount, 0);
        const deductionsIds = deductions.map(item => item._id);

        return { totalDeductionsPay, deductionsIds };

    } catch (error) {
        return error;
    }
};
exports.findAllDeductionsByEmployeeAndCorporateUser = async (employeeId, corporateUserId, cycleStart, cycleEnd, deductionId) => {
    try {
        // Construct the base query
        const query = {
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserId,
            deductionDate: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
            deductionStatus: 'PENDING'
        };

        // Conditionally add the _id filter if deductionId is provided and not false
        if (deductionId) {
            query._id = { $nin: [new ObjectId(deductionId)] };
        }

        // Perform the database query
        const deductions = await Deductions.find(query, { deductionAmount: 1, _id: 1 });

        const totalDeductionsPay = deductions.reduce((total, item) => total + item.deductionAmount, 0);
        const deductionsIds = deductions.map(item => item._id);

        return { totalDeductionsPay, deductionsIds };

    } catch (error) {
        return error;
    }
};