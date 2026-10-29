const {
  findAllServiceOperator,
  findLastFiveTransactions
} = require('../../models/use-cases/serviceOperator')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')

exports.findAllServiceOperator = asyncHandler(async (req, res, next) => {
  let result = await findAllServiceOperator()
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching service operators`, 200))
  } else {
    return res.status(200).json({
      'success': true,
      'data': result
    })
  }

})

exports.getLastFiveTransactions = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const length = parseInt(req.query.length);
    const serviceProvider = req.query.serviceProvider;
    const status = 'Payment Successful';
    const orderCol = 'transactionDate';
    const order = 'DESC'
    let params = {
      userId,
      length,
      serviceProvider,
      status,
      orderCol,
      order
    }
    const transactionsData = await findLastFiveTransactions(params);
    if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting last transactions`, 200))
    } else {
      return res.status(200).json({
        'success': true,
        'recordsTotal': transactionsData.length ? transactionsData.length : 0,
        'data': transactionsData
      })
    }

  } catch (error) {
    next(new ErrorResponse(error.message, 400));
  }
})