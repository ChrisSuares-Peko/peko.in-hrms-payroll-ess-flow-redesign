const corporateUser = require("./../entities/corporateUser");
const asyncHandler = require("../../middlewares/async");
const packAge = require("../entities/package");
const credential = require("../entities/credential");
const usecaseHandler = require("../../utils/usecase-handler");

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

exports.findOneCorporate = asyncHandler(async (params, attributes = undefined, credentialAttributes = undefined) => {
  return await corporateUser.findOne({
    include: [
      {
        model: credential,
        attributes: credentialAttributes
      },
    ],
    where: {
      id: params.id,
    },
    attributes,
    nest: true,
    raw: true,
  });
});

exports.updateCorporateDetails = asyncHandler(async (params, data) => {
  return await corporateUser.update(data, {
    where: {
      id: params.id,
    },
  });
});

exports.findOneCorporateUser = usecaseHandler(async (params, attributes = undefined) => {
  return await corporateUser.findOne({
    where: params,
    attributes,
    nest: true,
    raw: true,
  });
});