const router = require('express').Router({ mergeParams: true })
const {
    getKybState,
    getMyMembershipRequest,
    createMembershipRequest,
} = require('../../../../controllers/corporate/membershipRequest')

// Mounted BEFORE verifyUser('Corporate Cards') on purpose: every route here belongs to an employee who
// does not hold the service yet, and the service gate refuses exactly those sessions. Each handler
// re-establishes its own guard — authenticated employee, own corporate, not already a member — and the
// surface is limited to a boolean, the caller's own request, and the ability to open one.
router.get('/kyb-state', getKybState)
router.get('/request', getMyMembershipRequest)
router.post('/request', createMembershipRequest)

module.exports = router
