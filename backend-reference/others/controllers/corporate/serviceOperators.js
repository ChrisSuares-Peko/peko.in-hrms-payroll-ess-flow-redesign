const { findAllServiceOperator } = require('../../models/use-cases/serviceOperator')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')

exports.findAllServiceOperator = asyncHandler(async (req, res, next) => {
     let result = await findAllServiceOperator()
     if (!result) {
          return next(new ErrorResponse(`Something went wrong while fetching service operators`, 200))
     } else {
          return res.status(200).json({
               status: true,
               data: result,
               message: 'fetched service operator successfully',
               responseCode: '000',
          })
     }
})
