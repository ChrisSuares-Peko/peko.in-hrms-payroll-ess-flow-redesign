const Reimbursement = require('../../entities/payroll/reimbursement');

const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose


exports.fetchReimbursementsByEmployeeAndCorporateUser = async (employeeId, corporateUserId, cycleStart, cycleEnd) => {
    // const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    // const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    try {
        const reimbursements = await Reimbursement.find({
            employee: new ObjectId(employeeId),
            corporateUser: corporateUserId,
            expenseDate: {
                $gte: cycleStart,
                $lte: cycleEnd
            },
            transferMethod: 'SALARY',
            paymentStatus: 'UNPAID'
        });

        const totalReimbursementsPay = reimbursements.reduce((total, item) => total + item.totalPay, 0);
        const reimbursementIds = reimbursements.map(item => item._id);


        return {
            reimbursements,
            totalReimbursementsPay,
            reimbursementIds
        };
    } catch (error) {
        return error
    }
};
