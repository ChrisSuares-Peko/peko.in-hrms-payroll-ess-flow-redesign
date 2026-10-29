const nupayMerchantOnboarding = require("../entities/nupayMerchantOnboarding");

exports.create = async (data) => {
  return await nupayMerchantOnboarding.create(data);
};

exports.findByCorporateId = async (corporateId) => {
  return await nupayMerchantOnboarding.findOne({
    where: { corporateId },
    order: [["createdAt", "DESC"]],
  });
};

exports.findByNupayRefNo = async (nupayRefNo) => {
  return await nupayMerchantOnboarding.findOne({ where: { nupayRefNo } });
};

exports.updateByNupayRefNo = async (nupayRefNo, data) => {
  const [updated] = await nupayMerchantOnboarding.update(data, { where: { nupayRefNo } });
  return updated > 0;
};
