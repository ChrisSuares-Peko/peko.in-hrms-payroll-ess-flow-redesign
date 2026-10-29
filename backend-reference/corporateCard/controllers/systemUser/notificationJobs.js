const asyncHandler = require('../../middlewares/async')
const {
    sweepPendingKycNotices,
    sweepWeeklySpendDigests,
    sweepDailyBalanceReminders,
    sweepWalletTopupGuides,
} = require('../../services/notificationJobs')

exports.runPendingKycSweep = asyncHandler(async (req, res) => {
    const counters = await sweepPendingKycNotices({ req, logTraceId: req?.LogTraceId })
    return res.status(200).json({
        status: true,
        message: 'Pending KYC notices sweep completed.',
        data: counters,
        responseCode: '000',
    })
})

exports.runWeeklySpendDigestSweep = asyncHandler(async (req, res) => {
    const counters = await sweepWeeklySpendDigests({ req, logTraceId: req?.LogTraceId })
    return res.status(200).json({
        status: true,
        message: 'Weekly spend digest sweep completed.',
        data: counters,
        responseCode: '000',
    })
})

exports.runDailyBalanceReminderSweep = asyncHandler(async (req, res) => {
    const counters = await sweepDailyBalanceReminders({ req, logTraceId: req?.LogTraceId })
    return res.status(200).json({
        status: true,
        message: 'Daily wallet balance reminder sweep completed.',
        data: counters,
        responseCode: '000',
    })
})

exports.runWalletTopupGuideSweep = asyncHandler(async (req, res) => {
    const counters = await sweepWalletTopupGuides({ req, logTraceId: req?.LogTraceId })
    return res.status(200).json({
        status: true,
        message: 'Wallet top-up guide sweep completed.',
        data: counters,
        responseCode: '000',
    })
})
