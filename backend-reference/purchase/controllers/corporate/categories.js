const {
    findCategories
} = require('../../models/use-cases/categories')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')



exports.fetchAllCategories = asyncHandler(async (req, res, next) => {
    let result = await findCategories()
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching categories`, 500))
    } else {
        return res.status(200).json({
            status: true,
            message: 'Successfully retrieved all categories',
            data: { data:result },
            responseCode: '000'
        })
    }
})