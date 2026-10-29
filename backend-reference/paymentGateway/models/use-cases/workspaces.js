const workspaces = require("../entities/workspaces");
const asyncHandler = require("../../middlewares/async");

exports.findOne = asyncHandler(async (params) => {
  return await workspaces.findOne({
    where: {
      id: params.id,
    },
    raw: true,
    nest: true,
  });
});
