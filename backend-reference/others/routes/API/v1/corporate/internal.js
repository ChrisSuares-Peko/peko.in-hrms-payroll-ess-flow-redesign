const express = require('express')
const sharedData = require('../../../../controllers/internal/sharedData')

// Shared-data endpoints for the corporateCard service (own database; no direct SQL access to shared
// tables). Mounted under the corporate tree so calls travel THROUGH the api-gateway with the original
// user's session: the gateway authenticates and injects userdata, verifyToken (on the parent router)
// parses it, and every handler scopes by req.user.corporateId — so a caller can only ever read its own
// corporate's data. The operator/entitlement routes are additionally allowlisted to the corporate_cards
// accessKey in the controller, since vendor credentials transit them.
const router = express.Router({ mergeParams: true })

router.post('/card-users/batch', sharedData.batchCardUsers)
router.get('/card-users/search-ids', sharedData.searchCardUserIds)

// Static routes must be registered before the :userId param route, which would otherwise capture them.
router.get('/card-users/ids', sharedData.listCardUserIds)
router.get('/card-users/owner-profile', sharedData.getOwnerProfile)
router.get('/card-users', sharedData.listCardUsers)
router.get('/card-users/:userId', sharedData.getCardUserScoped)

router.get('/service-operators/by-access-key/:accessKey', sharedData.getServiceOperatorByAccessKey)
router.post('/entitlements/resolve', sharedData.resolveEntitlement)

router.post('/card-members/grant', sharedData.grantCardMembership)

router.get('/corporates/self', sharedData.getSelfCorporate)
router.post('/notifications', sharedData.createInternalNotification)

module.exports = router
