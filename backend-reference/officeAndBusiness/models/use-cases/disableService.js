const disableService = require("./../entities/disabledService");
const asyncHandler = require("./../../middlewares/async");

exports.findOne = asyncHandler(async (params) => {
  let { credentialId, serviceOperatorId } = params;
  return await disableService.findOne({
    where: {
      credentialId,
      serviceOperatorId,
      serviceStatus: true
    },
  });
});
