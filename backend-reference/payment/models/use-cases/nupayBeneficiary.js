const nupayBeneficiary = require("../entities/nupayBeneficiary");

exports.create = async (data) => {
  return await nupayBeneficiary.create(data);
};

exports.findAllByCorporateId = async (corporateId) => {
  return await nupayBeneficiary.findAll({
    where: { corporateId },
    order: [["createdAt", "DESC"]],
  });
};

exports.findById = async (id, corporateId) => {
  return await nupayBeneficiary.findOne({ where: { id, corporateId } });
};

exports.findDuplicate = async (corporateId, accountNumber, ifscCode) => {
  return await nupayBeneficiary.findOne({ where: { corporateId, accountNumber, ifscCode } });
};

exports.countActive = async (corporateId) => {
  return await nupayBeneficiary.count({ where: { corporateId } });
};

exports.updateById = async (id, corporateId, data) => {
  const [updated] = await nupayBeneficiary.update(data, { where: { id, corporateId } });
  return updated > 0;
};

exports.deleteById = async (id, corporateId) => {
  const deleted = await nupayBeneficiary.destroy({ where: { id, corporateId } });
  return deleted > 0;
};
