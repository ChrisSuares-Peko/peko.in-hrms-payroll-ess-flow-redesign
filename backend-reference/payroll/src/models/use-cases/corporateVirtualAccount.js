const CorporateVirtualAccount = require('../entities/corporateVirtualAccount');

exports.findOneByCorporateUser = async (corporateUser) => {
  return CorporateVirtualAccount.findOne({ corporateUser });
};

exports.upsertByCorporateUser = async (corporateUser, data) => {
  return CorporateVirtualAccount.findOneAndUpdate(
    { corporateUser },
    { ...data, corporateUser },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};
