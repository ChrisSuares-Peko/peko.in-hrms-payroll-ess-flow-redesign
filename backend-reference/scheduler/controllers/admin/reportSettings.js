const { findSystemUserData, updateWeeklyReportAllCorporates, updateMonthlyReportAllCorporates, updateDailyReportAndSendToAdmin,fetchAlladminSchedulars } = require('../../models/use-cases/corporateUser')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response');
//const { cronTaskScheduler } = require('../../utils/scheduleReport');


exports.updateWeelySettings = asyncHandler(async (req, res, next) => {
    const data = req.body
    const id = req.user.id
    let result = await updateWeeklyReportAllCorporates(id,data)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding message`, 500))
    } else {
        //cronTaskScheduler()
        return res.status(200).json({
            'status': true,
            'data': {},
            'message': 'Updated successfully',
            'responseCode': '000'
        })
    }
})
exports.updateDailySettings = asyncHandler(async (req, res, next) => {
    const data = req.body
    const id = req.user.id
    let result = await updateDailyReportAndSendToAdmin(id,data)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong updating`, 500))
    } else {
        //cronTaskScheduler()
        return res.status(200).json({
            'status': true,
            'data': {},
            'message': 'Updated successfully',
            'responseCode': '000'
        })
    }
})

exports.updateMonthlySettings = asyncHandler(async (req, res, next) => {
    const data = req.body
    const id = req.user.id
    let result = await updateMonthlyReportAllCorporates(id,data)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding message`, 500))
    } else {
        //cronTaskScheduler()
        return res.status(200).json({
            'status': true,
            'data': {},
            'message': 'Updated successfully',
            'responseCode': '000'
        })
    }
})
exports.getEmails = asyncHandler(async (req, res, next) => {
    const id = req.user.id

    let result = await findSystemUserData(id)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching details`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'Details fetched successfully',
            'responseCode': '000'
        })
    }
})

exports.restartAdminSchedulars = asyncHandler(async () => {
    const systemUsersSchedular = await fetchAlladminSchedulars();
    for (const record  of systemUsersSchedular) {
        const { credentialId, dailyReport, weeklyReport, monthlyReport } = record ;
      
        // Check daily report
        if (dailyReport && dailyReport.isActive) {
          await updateDailyReportAndSendToAdmin(credentialId, dailyReport);
        }
      
        // Check weekly report
        if (weeklyReport && weeklyReport.isActive) {
          await updateWeeklyReportAllCorporates(credentialId, weeklyReport);
        }
      
        // Check monthly report
        if (monthlyReport && monthlyReport.isActive) {
          await updateMonthlyReportAllCorporates(credentialId, monthlyReport);
        }
      }
    //   console.log("🚀 ~ exports.restartAdminSchedulars=asyncHandler ~ req:", req.body);
    //   res.status(200).json({status: true, data: {}, message: "Restarted successfully", responseCode:"000"})
})

