/* eslint-disable no-prototype-builtins */
const corporateUser = require("./../entities/corporateUser");
const asyncHandler = require("../../middlewares/async");
const packAge = require("../entities/package");
const credential = require("./../entities/credential");
const { Op } = require("sequelize");
const { customLog } = require("../../utils/loggerHelper");

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

exports.findOneWithCredentialId = asyncHandler(async (credentialId, attributes = undefined) => {
  return await corporateUser.findOne({
    where: {
      credentialId: credentialId,
    },
    attributes,
    nest: true,
    raw: true,
  });
});

exports.findOneUserWithCredentialId = asyncHandler(async (credentialId) => {
  let corporate = await corporateUser.findOne({
    where: {
      credentialId: credentialId,
    },
    nest: true,
    raw: true,
  });
  let user = await credential.findOne({
    where: {
      id: credentialId,
    }
  })
  return { ...user, ...corporate };
});

exports.updateCorporate = async (corporateId, data) => {
  try {
    return await corporateUser.update(data, {
      where: {
        id: corporateId,
      },
    });
  } catch (error) {
    customLog(null, "error", { message: "An error occurred", error: error });
  }
};

exports.findOneCorporate = asyncHandler(async (params, attributes = undefined) => {
  return await corporateUser.findOne({
    include: [
      {
        model: credential,
        attributes: ["username"],
      },
    ],
    where: params,
    attributes,
    nest: true,
    raw: true,
  });
});

exports.fetchAllCorporate = asyncHandler(async (query, corporateId) => {
  return await corporateUser.findAll({
    where: {
      isActive: true,
      id: {
        [Op.ne]: corporateId, // Exclude the specific ID
      },
    },
    include: [
      {
        model: credential,
        where: {
          [Op.or]: [
            {
              name: {
                [Op.like]: "%" + query + "%",
              },
            },
            {
              username: {
                [Op.like]: "%" + query + "%",
              },
            },
          ],
        },
        attributes: ["username"],
      },
    ],
    attributes: ["id", "name"],
    raw: true,
    nest: true,
  });
});