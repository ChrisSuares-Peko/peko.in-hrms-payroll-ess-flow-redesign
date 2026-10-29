/* eslint-disable no-prototype-builtins */
const corporateUser = require('../entities/corporateUser');
const asyncHandler = require('../../middlewares/async')
const packAge = require("../entities/package");

exports.findOne = asyncHandler(async (params, attributes = undefined) => {
    return await corporateUser.findOne({
        include: [{
            model: packAge
        }],
        where: {
            credentialId: params.id,
        },
        attributes,
        nest: true,
        raw: true
    })
})
