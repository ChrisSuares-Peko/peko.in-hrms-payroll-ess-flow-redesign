const { Op, Sequelize } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const setting = require("../entities/setting");


exports.getGstDetails = asyncHandler(async () => {
  return await setting.findOne({
    where: { name: "taxRate" },
  });
});

exports.getInitialServicePermission = asyncHandler(async (attributes = ["details"]) => {
  const data = await setting.findOne({
    where: { name: "initialServicePermissions" },
    attributes,
    raw: true,
    nest: true,
  });
  return data?.details || [];
});

// Upserts the `initialServicePermissions` setting row with the edited service tree.
// The row may not exist yet (the read side falls back to a static mock), so create
// it on first save; otherwise overwrite its `details`.
exports.updateInitialServicePermission = asyncHandler(async (permissions = []) => {
  const [, created] = await setting.findOrCreate({
    where: { name: "initialServicePermissions" },
    defaults: { name: "initialServicePermissions", details: permissions },
  });
  if (!created) {
    await setting.update(
      { details: permissions, updatedAt: new Date() },
      { where: { name: "initialServicePermissions" } }
    );
  }
  return permissions;
});

// An internal account is one of the credential ids on the Internal Accounts list. Anything unreadable counts as not internal.
exports.isInternalAccount = async (credentialId) => {
  const idNum = Number(credentialId);
  if (credentialId === null || credentialId === undefined || Number.isNaN(idNum)) return false;
  try {
    const row = await setting.findOne({
      where: {
        name: "internalAccounts",
        [Op.and]: Sequelize.literal(`JSON_CONTAINS(details, CAST(${idNum} AS JSON))`),
      },
    });
    return !!row;
  } catch (error) {
    return false;
  }
};
