
const notification = require('./../entities/notification')
const credentials = require('./../entities/credential')
const { customLog } = require('../../utils/loggerHelper')

const Pusher = require('pusher');

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    encrypted: true
})
    
const createNotification = async (data) => {
    try {
        let customerOutletNames;
        if (data.notificationCategory == 'CORPORATE') {
            if (Array.isArray(data.notificationTo)) {
                const bulkObject = data.notificationTo.map(username => ({
                    notificationTitle: data.notificationTitle,
                    notificationBrief: data.notificationBrief,
                    notificationCategory: data.notificationCategory,
                    notificationBy: data.notificationBy,
                    notificationTo: username
                }));

                const createdData = await notification.bulkCreate(bulkObject);

                data.notificationTo.forEach(username => {
                    pusher.trigger('push-notification', 'real-time-notification', {
                        body: username
                    });
                });

                return createdData;
            } else if (typeof data.notificationTo === 'string') {

                const createdData = await notification.create(data);

                pusher.trigger('push-notification', 'real-time-notification', {
                    body: data.notificationTo
                });
                return createdData;
            }
        } else {
            if (data.notificationTo == "ALL") {
                customerOutletNames = await credentials.findAll({
                    where: {
                        role: data.notificationCategory
                    },
                    attributes: ["username"]
                });

                const bulkObject = customerOutletNames.map(username => ({
                    notificationTitle: data.notificationTitle,
                    notificationBrief: data.notificationBrief,
                    notificationTo: username.username,
                    notificationCategory: data.notificationCategory,
                    notificationBy: data.notificationBy
                }));

                const createdData = await notification.bulkCreate(bulkObject);

                return createdData;
            } else {
                // res.json({
                //     responseCode: '100',
                //     responseMessage: 'An error occurred while adding the notification'
                // })
            }
        }
    } catch (error) {
        customLog(null, "error", { error, message: "Error creating notification" });
    } finally {
        customLog(null, "info", { message: "Notification create route called" });
    }
}

module.exports = {
    createNotification
}