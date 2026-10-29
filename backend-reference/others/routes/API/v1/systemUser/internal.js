const express = require('express')
const ErrorResponse = require('../../../../utils/error-response')
const sharedData = require('../../../../controllers/internal/sharedData')

// Corporate-directory endpoints for the corporateCard service's system-user (admin) flows. Mounted
// under the system_user tree so calls travel THROUGH the api-gateway with the original admin's
// session; verifyToken (on the parent router) parses the gateway-injected userdata. These endpoints
// read cross-corporate data, so the session role must be SYSTEM_USER.
const router = express.Router({ mergeParams: true })

router.use((req, res, next) => {
    if (req.user?.role !== 'SYSTEM_USER') return next(new ErrorResponse('Forbidden', 403))
    return next()
})

router.post('/sub-corporates/batch', sharedData.batchSubCorporatesAdmin)
router.post('/corporates/batch', sharedData.batchCorporates)
router.get('/corporates/search-ids', sharedData.searchCorporateIds)
router.post('/corporates/pickable-search', sharedData.pickableSearch)
router.get('/corporates/pickable-count', sharedData.pickableCount)
router.get('/card-users', sharedData.listCorporateCardUsers)
router.post('/card-users/batch', sharedData.batchCorporateCardUsers)
router.get('/service-operators/by-access-key/:accessKey', sharedData.getServiceOperatorByAccessKey)
router.post('/notifications', sharedData.createInternalNotification)

module.exports = router
