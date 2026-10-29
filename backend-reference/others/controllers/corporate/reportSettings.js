const {findCorporateUserData, updateWeeklyReport,updateDailyReport,updateMonthlyReport, updateDailyStatus, updateMonthlyStatus, updateWeeklyStatus} = require('../../models/use-cases/corporateUser')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response');
const { cronTaskScheduler } = require('../../utils/scheduleReport');

exports.updateWeelySettings = asyncHandler(async (req, res, next) => {
    const id = req.user.id;
    const data = req.body
    let result = await updateWeeklyReport(id,data)
    if (!result) {
    return next(new ErrorResponse(`Something went wrong while adding message`, 500))
    } else {
        cronTaskScheduler()
    return res.status(200).json({
        'status': true,
        'data': {},
        'message':'Updated successfully',
        'responseCode':'000'
    })
    }
})
exports.updateDailySettings = asyncHandler(async (req, res, next) => {
    const id = req.user.id;
    const data = req.body
    let result = await updateDailyReport(id,data)
    if (!result) {
    return next(new ErrorResponse(`Something went wrong updating`, 500))
    } else {
        cronTaskScheduler()
    return res.status(200).json({
        'status': true,
        'data': {},
        'message':'Updated successfully',
        'responseCode':'000'
    })
    }
})

exports.updateDailyStatus = asyncHandler(async (req, res, next) => {
    const id = req.user.id;
    const { isActive } = req.body;
    
    let result = await updateDailyStatus(id,isActive)
    if (!result) {
    return next(new ErrorResponse(`Something went wrong while changing status`, 500))
    } else {
        cronTaskScheduler()
      
    return res.status(200).json({
    'status': true,
    'data': {},
    'message':'Status changed successfully',
    'responseCode':'000'
    })
    }
})

exports.updateMonthlyStatus = asyncHandler(async (req, res, next) => {
    const id = req.user.id;
    const { isActive } = req.body;
    
    let result = await updateMonthlyStatus(id,isActive)
    if (!result) {
    return next(new ErrorResponse(`Something went wrong while changing status`, 500))
    } else {
        cronTaskScheduler()
    return res.status(200).json({
        'status': true,
        'data': {},
        'message':'Status changed successfully',
        'responseCode':'000'
    })
    }
})

exports.updateWeeklyStatus = asyncHandler(async (req, res, next) => {
    const id = req.user.id;
    const { isActive } = req.body;
    
    let result = await updateWeeklyStatus(id,isActive)
    if (!result) {
    return next(new ErrorResponse(`Something went wrong while changing status`, 500))
    } else {
        cronTaskScheduler()
    return res.status(200).json({
        'status': true,
        'data': {},
        'message':'Status changed successfully',
        'responseCode':'000'
    })
    }
})

exports.updateMonthlySettings = asyncHandler(async (req, res, next) => {
    const id = req.user.id;
    const data = req.body
    let result = await updateMonthlyReport(id,data)
    if (!result) {
    return next(new ErrorResponse(`Something went wrong while adding message`, 500))
    } else {
        cronTaskScheduler()
    return res.status(200).json({
        'status': true,
        'data': {},
        'message':'Updated successfully',
        'responseCode':'000'
    })
    }
})
exports.getEmails = asyncHandler(async (req, res, next) => {
    const id = req.user.id
    
    let result = await findCorporateUserData(id)
    if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching details`, 500))
    } else {
    return res.status(200).json({
    'status': true,
    'data': result,
    'message': 'Details fetched successfully',
    'responseCode':'000'
})
    }
})

