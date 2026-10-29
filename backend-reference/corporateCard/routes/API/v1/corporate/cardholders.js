const router = require('express').Router({ mergeParams: true })
const { requirePermission } = require('../../../../middlewares/requirePermission')
const { PERMISSIONS: P } = require('../../../../utils/cardRoles')
const { verifyCorporateAdmin } = require('../../../../middlewares/verifyCorporateAdmin')
const { listCardUsers } = require('../../../../controllers/corporate/cardUsers')
const { freezeCardholderCards } = require('../../../../controllers/corporate/cardState')

router.get('/', verifyCorporateAdmin, requirePermission(P.VIEW_MEMBERS), listCardUsers)

router.post('/:userId/freeze-cards', verifyCorporateAdmin, freezeCardholderCards)

module.exports = router
