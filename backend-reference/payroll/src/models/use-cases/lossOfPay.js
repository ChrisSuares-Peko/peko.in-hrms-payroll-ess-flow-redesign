const LossOfPay = require('../entities/lossOfPay');

// Map of employeeId (string) → LOP row for the month; empty when nothing was entered.
exports.findLossOfPayForMonth = async ({ corporateUserID, month, year }) => {
    const rows = await LossOfPay.find({
        corporateUser: corporateUserID,
        month: Number(month),
        year: Number(year),
    }).lean();
    return new Map(rows.map(row => [String(row.employee), row]));
};

exports.upsertLossOfPay = ({ corporateUserID, employeeId, month, year, days, amount, isAmountOverridden, updatedBy }) =>
    LossOfPay.findOneAndUpdate(
        { corporateUser: corporateUserID, employee: employeeId, month: Number(month), year: Number(year) },
        { $set: { days, amount, isAmountOverridden, updatedBy } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

exports.deleteLossOfPay = ({ corporateUserID, employeeId, month, year }) =>
    LossOfPay.deleteOne({ corporateUser: corporateUserID, employee: employeeId, month: Number(month), year: Number(year) });
