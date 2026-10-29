/* eslint-disable no-unused-vars */
/* eslint-disable no-prototype-builtins */
const corporateUser = require("./../entities/corporateUser");
const credential = require("./../entities/credential");
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const packAge = require("../entities/package");

exports.findOne = asyncHandler(async (params, attributes = undefined) => {
  return await corporateUser.findOne({
    include: [
      {
        model: packAge,
      },
    ],
    where: {
      credentialId: params.id,
    },
    attributes,
    nest: true,
    raw: true,
  });
});

exports.fetchAllCorporate = asyncHandler(async (query, role) => {
  const includeOptions = [
    {
      model: credential,
      where: {
        name: {
          [Op.like]: "%" + query + "%",
        },
        role: role,
      },
      attributes: ["name", "username"],
    },
  ];

  return await corporateUser.findAll({
    include: includeOptions,
    attributes: ["name", "id", "credentialId", "email", "mobileNo"],
    order: [[{ model: credential }, "name", "ASC"]],
    raw: true,
    nest: true,
  });
});

exports.updateCorporateDetails = asyncHandler(async (params, data) => {
  return await corporateUser.update(data, {
    where: {
      id: params.id,
    },
  });
});

// Live DB read of packageId, bypassing the session-cached req.user.packageId (see its use in
// verificationSuiteV2.js). req.user.packageId only refreshes at login/token-refresh, so it can still
// hold a pre-purchase value for a while after a plan purchase updates this column.
exports.findPackageIdById = asyncHandler(async (id) => {
  const row = await corporateUser.findOne({
    where: { id },
    attributes: ["packageId"],
    raw: true,
  });
  return row ? row.packageId : null;
});

exports.findCorporateUserByEmail = async (email) => {
  try {
      const user = await corporateUser.findOne({
          where: { email }
      });

      if (!user) {
          throw new Error("Corporate user not found");
      }

      return user;
  } catch (error) {
      console.error("Error finding corporate user by email:", error.message);
      throw new Error("Error fetching corporate user");
  }
};
