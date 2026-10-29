const SalaryRolloutBankAccount = require('../entities/salaryRolloutBankAccount');

const findAllByCorporateUser = async (corporateUserId) => {
    return SalaryRolloutBankAccount.find({ corporateUser: corporateUserId }).sort({ isPrimary: -1, createdAt: 1 });
};

const createOne = async (data) => {
    return SalaryRolloutBankAccount.create(data);
};

const updateById = async (id, data) => {
    return SalaryRolloutBankAccount.findByIdAndUpdate(id, data, { new: true });
};

const deleteById = async (id) => {
    return SalaryRolloutBankAccount.findByIdAndDelete(id);
};

const setPrimary = async (id, corporateUserId) => {
    await SalaryRolloutBankAccount.updateMany({ corporateUser: corporateUserId }, { isPrimary: false });
    return SalaryRolloutBankAccount.findByIdAndUpdate(id, { isPrimary: true }, { new: true });
};

const findById = async (id) => {
    return SalaryRolloutBankAccount.findById(id);
};

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findDuplicateByAccount = async (corporateUserId, accountNumber, ifscCode, excludeId) => {
    const query = {
        corporateUser: corporateUserId,
        accountNumber: { $regex: `^\\s*${escapeRegex(accountNumber)}\\s*$` },
        ifscCode: { $regex: `^\\s*${escapeRegex(ifscCode)}\\s*$`, $options: 'i' },
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    return SalaryRolloutBankAccount.findOne(query);
};

module.exports = {
    findAllByCorporateUser,
    createOne,
    updateById,
    deleteById,
    setPrimary,
    findById,
    findDuplicateByAccount,
};
