const express = require('express')
const router = express.Router()
const {
     createNotification,
     updateNotification,
     findAllNotificationAndCount,
     findAllNotification,
     deleteNotification,
     notificationAndCountPDF,
     notificationAndCountExcelCSV,
} = require('../../../../controllers/admin/notification')

const { validateAddingNotification, validateUpdatingNotification } = require('../../../../utils/apiValidation')
const { validateNotificationsQuery } = require('../../../../utils/queryValidation')

router.post('/', validateAddingNotification, createNotification)//✅
router.get('/notifications', findAllNotification)
router.get('/all', validateNotificationsQuery, findAllNotificationAndCount)//✅
router.get('/pdf', validateNotificationsQuery, notificationAndCountPDF)//✅
router.get('/:type', validateNotificationsQuery, notificationAndCountExcelCSV)//✅
router.put('/:id', validateUpdatingNotification, updateNotification)//✅
router.delete('/:id', deleteNotification)//✅

module.exports = router
