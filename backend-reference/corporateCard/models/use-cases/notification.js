const { internalPost } = require('../../utils/othersClient')
const { customLog } = require('../../utils/loggerHelper')

// corporateCard has its own database, separate from the shared `peko` database the platform's other
// services (and the FE's central notification bell, GET /:userType/:userId/others/notification) read
// from — so a locally-created row here would never be visible to anyone. Routes through the others
// service's internal API instead, which persists into that shared table and fires the same Pusher event.
const createNotification = async (data, req) => {
    try {
        return await internalPost('/notifications', {
            notificationTitle: data.notificationTitle,
            notificationBrief: data.notificationBrief,
            notificationCategory: data.notificationCategory,
            notificationTo: data.notificationTo,
            notificationBy: data.notificationBy,
        }, { req })
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Notification] Could not create notification',
            notificationCategory: data.notificationCategory,
            error: error?.message,
        }, 'CONSOLE')
        return null
    }
}

module.exports = { createNotification }
