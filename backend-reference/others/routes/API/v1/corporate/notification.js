const express = require('express')
const router = express.Router()
const {
    findAllNotification,
    findAllNotificationCount,
    updateNotification,
    resetNotificationCountToZero
} = require('../../../../controllers/admin/notification');
const { validateNotificationQuery } = require('../../../../utils/queryValidation');

router.get(
    "/all-notifications",
    validateNotificationQuery,
    findAllNotificationCount
);
router.get('/', findAllNotification)//✅
router.put('/:id', updateNotification)
router.put('/', resetNotificationCountToZero)
module.exports = router