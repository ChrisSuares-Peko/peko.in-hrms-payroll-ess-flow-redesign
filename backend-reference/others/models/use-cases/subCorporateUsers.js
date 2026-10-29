const asyncHandler = require("../../middlewares/async")
const credential = require("../entities/credential")
const SubCorporateUser = require("../entities/subCorporateUsers")

exports.findOneSubCorporate = asyncHandler(async (params, attributes = undefined) => {
    return await SubCorporateUser.findOne({
        include: [{
            model: credential,
            attributes: ['role', 'username']
        }],
        where: {
            id: params.id,
        },
        attributes,
        nest: true,
        raw: true
    })
})