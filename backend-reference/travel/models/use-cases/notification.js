const notification = require('../entities/notification')
const credentials = require('../entities/credential')
const Pusher = require('pusher')

const pusher = new Pusher({
     appId: "1986496",
     key: "c071f84777ea23ecd9a6",
     secret: "REDACTED",
     cluster: "ap2",
     encrypted: true
 })

const createNotification = async (data) => {
     try {
          let customerOutletNames
          if (data.notificationCategory == 'CORPORATE') {
               if (Array.isArray(data.notificationTo)) {
                    const bulkObject = data.notificationTo.map((username) => ({
                         notificationTitle: data.notificationTitle,
                         notificationBrief: data.notificationBrief,
                         notificationCategory: data.notificationCategory,
                         notificationBy: data.notificationBy,
                         notificationTo: username,
                    }))

                    const createdData = await notification.bulkCreate(bulkObject)

                    data.notificationTo.forEach((username) => {
                         pusher.trigger('push-notification', 'real-time-notification', {
                              body: username,
                         })
                    })

                    return createdData
               } else if (typeof data.notificationTo === 'string') {
                    const createdData = await notification.create(data)

                    pusher.trigger('push-notification', 'real-time-notification', {
                         body: data.notificationTo,
                    })
                    return createdData
               }
          } else {
               if (data.notificationTo == 'ALL') {
                    customerOutletNames = await credentials.findAll({
                         where: {
                              role: data.notificationCategory,
                         },
                         attributes: ['username'],
                    })

                    const bulkObject = customerOutletNames.map((username) => ({
                         notificationTitle: data.notificationTitle,
                         notificationBrief: data.notificationBrief,
                         notificationTo: username.username,
                         notificationCategory: data.notificationCategory,
                         notificationBy: data.notificationBy,
                    }))

                    const createdData = await notification.bulkCreate(bulkObject)

                    return createdData
               } else {
                    // eslint-disable-next-line no-undef
                    res.json({
                         responseCode: '100',
                         responseMessage: 'An error occurred while adding the notification',
                    })
               }
          }
     } catch (error) {
          console.log('ERROR BLOCK - ', error)
     } finally {
          console.log('NOTIFICATION CREATE ROUTE CALLED')
     }
}

module.exports = {
     createNotification,
}
