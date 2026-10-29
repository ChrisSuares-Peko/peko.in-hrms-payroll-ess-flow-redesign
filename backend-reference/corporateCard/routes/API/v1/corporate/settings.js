const router = require('express').Router({ mergeParams: true })
const { verifyCorporateAdmin } = require('../../../../middlewares/verifyCorporateAdmin')
const {
    getNotificationControls,
    updateNotificationControls,
} = require('../../../../controllers/corporate/corporateSettings')

router.get('/notification-controls', verifyCorporateAdmin, getNotificationControls)
router.put('/notification-controls', verifyCorporateAdmin, updateNotificationControls)

module.exports = router
