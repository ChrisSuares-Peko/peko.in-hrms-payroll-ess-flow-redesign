const CorporateBankAccount = require('../entities/corporateBankAccount');

exports.findOneByCorporateUser = async (corporateUser) => {
  return CorporateBankAccount.findOne({ corporateUser });
};

exports.upsertByCorporateUser = async (corporateUser, data) => {
  return CorporateBankAccount.findOneAndUpdate(
    { corporateUser },
    { ...data, corporateUser },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};
