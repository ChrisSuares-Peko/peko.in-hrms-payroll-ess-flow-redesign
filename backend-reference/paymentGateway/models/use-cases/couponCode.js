const couponCode = require("../entities/couponCode");
const asyncHandler = require("../../middlewares/async");

exports.findOne = asyncHandler(async (params) => {
  return await couponCode.findOne({
    where: params,
  });
});

exports.update = asyncHandler(async (id, updates) => {
  const [updated] = await couponCode.update(updates, {
    where: { id }
  });
  if (updated) {
    return await couponCode.findByPk(id);
  }
  return false;
});

exports.delete = asyncHandler(async (id) => {
  const deleted = await couponCode.destroy({
    where: { id },
  });
  return deleted;
});
