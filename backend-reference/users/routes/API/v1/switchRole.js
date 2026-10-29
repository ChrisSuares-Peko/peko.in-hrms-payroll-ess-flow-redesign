// Mounted at /active-role under the users service (proxied as /api/v1/user/active-role) — NOT /switch-role,
// which login.js already owns for the corporate <-> employee IDENTITY switch and which is mounted first.
// There are no parent route params to merge; the caller comes from req.user and the sessionid header.
const router = require('express').Router()
const {
    availableRoles,
    switchRole,
    createOwnerCardholderProfile,
} = require('../../../controllers/switchRole')

router.get('/', availableRoles)
router.post('/', switchRole)
router.post('/cardholder-profile', createOwnerCardholderProfile)

module.exports = router
