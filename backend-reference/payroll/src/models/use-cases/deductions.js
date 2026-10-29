const Deductions = require("../entities/deductions");
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose


exports.findDuplicateDeduction = async (params) => {
    try {
        const { corporateUserID, employeeId, ...otherParams } = params;
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
        console.log({ message: error.message, error });
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
        // Only fields the caller sends are changed — the one-time deduction edit sends
        // type/note/amount and keeps its month; the legacy edit sends date/type/amount.
        ['deductionDate', 'deductionType', 'deductionFor', 'note', 'deductionAmount'].forEach((field) => {
            if (updateParams[field] !== undefined) deduction[field] = updateParams[field];
        });

        let updated = await deduction.save()

        return { status: true, updated };

    } catch (error) {
        console.log({ message: error.message, error });
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
        console.log({ message: error.message, error });
        return { status: false, message: 'Failed to delete deduction due to an error' };
    }
};

exports.createDeduction = async (params) => {
    try {
        const deduction = new Deductions({
            ...params,
            employee: params.employeeId,
            corporateUser: params.corporateUserID
        });

        return await deduction.save()
    } catch (error) {
        console.log({ message: error.message, error })
        throw new Error('Failed to create deduction')
    }
}

exports.findAllDeductionWthCount = async (params) => {
    try {
        const { corporateUserID, employeeId, limit, skip, cycleStart, cycleEnd, month, year } = params
        // One-time deductions belong to a month; legacy rows (no month) to a date in the cycle.
        const queryConditions = {
            corporateUser: corporateUserID,
            employee: employeeId,
            $or: [
                ...(month && year ? [{ month: Number(month), year: Number(year) }] : []),
                { month: { $in: [null] }, deductionDate: { $gte: cycleStart, $lte: cycleEnd } },
            ],
        };

        const deductions = await Deductions.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();
        const totalCount = await Deductions.countDocuments(queryConditions);

        return { totalCount, deductions };

    } catch (error) {
        console.log({ message: error.message, error })
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
        throw new Error('Failed to fetch deductions');
    }
};

// Named line items (not just a total) for a not-yet-locked-in month's Salary Profile
// preview — mirrors fetchArrearsForPayout's role there: a one-off deduction added via
// "Add Deduction" after this month's Salary record was pre-generated would otherwise never
// show up on that preview, since the record's persisted deductionAmount is only as fresh
// as whenever payroll last actually ran for this month.
exports.fetchPendingDeductionsForPayout = async ({ employeeId, corporateUserID, cycleStart, cycleEnd }) => {
    try {
        const deductions = await Deductions.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserID,
            deductionDate: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
            deductionStatus: 'PENDING'
        }, { deductionType: 1, deductionAmount: 1, _id: 1 });

        const totalDeductionsPay = deductions.reduce((total, item) => total + item.deductionAmount, 0);
        const items = deductions.map(item => ({ deductionType: item.deductionType, deductionAmount: item.deductionAmount }));

        return { totalDeductionsPay, items };
    } catch (error) {
        throw new Error('Failed to fetch pending deductions');
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
const periodOf = (year, month) => Number(year) * 12 + Number(month);

// One-time recoveries (Add Deduction) still owed for a salary month: this month's own
// deductions plus any earlier month's balance that did not fit under the 50% limit.
// What earlier months already recovered is read back from their Salary records
// (oneTimeDeductions[].appliedAmount), so the carry needs no separate bookkeeping and
// follows automatically if an earlier unpaid month is recalculated. Legacy rows without a
// month are matched on deductionDate within the cycle, as before, and do not carry.
exports.fetchOutstandingOneTimeDeductions = async ({ employeeId, corporateUserID, month, year, cycleStart, cycleEnd }) => {
    // Lazy require: entities/salary is unrelated to this module's load order, but keeping
    // the dependency local makes the intent (read-only lookback) explicit.
    // eslint-disable-next-line global-require
    const Salary = require("../entities/salary");
    const period = periodOf(year, month);
    const employee = new ObjectId(employeeId);

    const rows = await Deductions.find({
        employee,
        corporateUser: corporateUserID,
        deductionStatus: { $ne: 'DEDUCTED' },
        $or: [
            { month: { $exists: true, $ne: null }, year: { $lte: Number(year) } },
            { month: { $in: [null] }, deductionDate: { $gte: cycleStart, $lte: cycleEnd } },
        ],
    }).sort({ year: 1, month: 1, createdAt: 1 }).lean();

    const candidates = rows.filter(r => r.month == null || periodOf(r.year, r.month) <= period);
    const carriedIds = candidates
        .filter(r => r.month != null && periodOf(r.year, r.month) < period)
        .map(r => String(r._id));

    const recovered = new Map();
    if (carriedIds.length) {
        const earlierSalaries = await Salary.find(
            { corporateUser: corporateUserID, employee, 'oneTimeDeductions.deductionId': { $in: carriedIds.map(id => new ObjectId(id)) } },
            { year: 1, month: 1, oneTimeDeductions: 1 }
        ).lean();
        earlierSalaries
            .filter(s => periodOf(s.year, s.month) < period)
            .forEach(s => (s.oneTimeDeductions || []).forEach((d) => {
                const key = String(d.deductionId);
                recovered.set(key, (recovered.get(key) || 0) + (d.appliedAmount || 0));
            }));
    }

    return candidates
        .map(r => ({
            ...r,
            outstanding: Math.round((Number(r.deductionAmount || 0) - (recovered.get(String(r._id)) || 0)) * 100) / 100,
        }))
        .filter(r => r.outstanding > 0);
};
