let credential = require("../models/entities/credential");
const asyncHandler = require('../middlewares/async')
exports.authenticate = asyncHandler(async ({credentialId, password}) => {
    let result = await credential.findOne({
        where: {
            id: credentialId
        },
        attributes: ['password']
    })
    if (!result) {
        return false
    } else {
        return  result.validatePassword(password)
    }
})