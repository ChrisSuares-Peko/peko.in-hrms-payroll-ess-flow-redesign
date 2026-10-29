const router = require('express').Router({ mergeParams: true })
const { requirePermission } = require('../../../../middlewares/requirePermission')
const { PERMISSIONS: P } = require('../../../../utils/cardRoles')
const { verifyCorporateAdmin } = require('../../../../middlewares/verifyCorporateAdmin')
const requireCardholder = require('../../../../middlewares/requireCardholder')
const { listCards, enableUpi } = require('../../../../controllers/corporate/pinelabsCardIssuance')
const { issueCardByAdmin, issuePhysicalCardByAdmin } = require('../../../../controllers/corporate/adminCardIssue')
const { reconcileCardOrder } = require('../../../../controllers/corporate/cardOrderReconcile')
const { listPhysicalTracking } = require('../../../../controllers/corporate/cardTracking')
const { getCardSchemes } = require('../../../../controllers/admin/pinelabsCards')
const { freezeCard, unfreezeCard, bulkChangeCardState } = require('../../../../controllers/corporate/cardState')
const { setCardLimits, setCardControls, setCardSettings, getCardAudit, exportCardAudit, getMerchantCategories } = require('../../../../controllers/corporate/cardLimits')
const { getCardQuota } = require('../../../../controllers/corporate/cardQuota')
const { preflightPhysicalCardOrder } = require('../../../../controllers/corporate/physicalCardPreflight')

router.get('/', listCards)
router.get('/schemes', verifyCorporateAdmin, getCardSchemes)
router.get('/categories', verifyCorporateAdmin, getMerchantCategories)
router.get('/physical-tracking', listPhysicalTracking)
router.get('/quota', getCardQuota)

router.post('/physical-preflight', verifyCorporateAdmin, preflightPhysicalCardOrder)

router.post('/issue', verifyCorporateAdmin, requirePermission(P.ISSUE_CARDS), issueCardByAdmin)

router.post('/bulk-state', verifyCorporateAdmin, bulkChangeCardState)

router.post('/enable-upi', requireCardholder, enableUpi)

router.post('/:cardIssuanceId/freeze', freezeCard)
router.post('/:cardIssuanceId/unfreeze', unfreezeCard)

router.post('/:cardIssuanceId/physical', verifyCorporateAdmin, requirePermission(P.ORDER_PHYSICAL), issuePhysicalCardByAdmin)

router.post('/:cardIssuanceId/reconcile', verifyCorporateAdmin, reconcileCardOrder)

router.put('/:cardIssuanceId/limits', verifyCorporateAdmin, requirePermission(P.SET_LIMITS), setCardLimits)
router.put('/:cardIssuanceId/controls', verifyCorporateAdmin, requirePermission(P.SET_LIMITS), setCardControls)
router.put('/:cardIssuanceId/settings', verifyCorporateAdmin, requirePermission(P.SET_LIMITS), setCardSettings)
router.get('/:cardIssuanceId/audit', verifyCorporateAdmin, requirePermission(P.VIEW_AUDIT), getCardAudit)
router.get('/:cardIssuanceId/audit/export', verifyCorporateAdmin, requirePermission(P.VIEW_AUDIT), exportCardAudit)

module.exports = router
