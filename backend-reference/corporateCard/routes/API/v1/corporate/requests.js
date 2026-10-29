const router = require('express').Router({ mergeParams: true })
const { requirePermission } = require('../../../../middlewares/requirePermission')
const { PERMISSIONS: P } = require('../../../../utils/cardRoles')
const { verifyCorporateAdmin } = require('../../../../middlewares/verifyCorporateAdmin')
const requireCardholder = require('../../../../middlewares/requireCardholder')
const {
    createCardRequest,
    listMyRequests,
    listRequests,
    approveRequest,
    rejectRequest,
    terminateCard,
} = require('../../../../controllers/corporate/cardRequests')

router.post('/', requireCardholder, createCardRequest)
router.get('/mine', requireCardholder, listMyRequests)

router.get('/', verifyCorporateAdmin, listRequests)
router.post('/terminate', verifyCorporateAdmin, requirePermission(P.TERMINATE_CARDS), terminateCard)
router.post('/:id/approve', verifyCorporateAdmin, approveRequest)
router.post('/:id/reject', verifyCorporateAdmin, rejectRequest)

module.exports = router
