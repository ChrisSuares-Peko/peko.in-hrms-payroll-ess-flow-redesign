const asyncHandler = require("../../middlewares/async");
const pkgModel = require("./../entities/package");

exports.findOnePackage = asyncHandler(async (id) => {
  try {
    return await pkgModel.findOne({
      where: id,
      raw: true,
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("PACKAGE FIND ONE ROUTE CALLED");
  }
});
