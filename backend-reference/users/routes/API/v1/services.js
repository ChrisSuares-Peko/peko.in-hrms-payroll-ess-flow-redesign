const express = require('express')
const router = express.Router()
const { accessibleServices, accessibleMockService, partnerInitialAccessesibleServices,partnerServicesCheckCashBack, updateInitialServicePermissions, updatePartnerInitialAccessesibleServicesByApi, fetchInitalCorporateUserConfiguartion} = require('../../../controllers/services');
const { verifyToken } = require('../../../utils/jwtToken');
const { requireSystemUser } = require('../../../middlewares/requireSystemUser');

router.get('/serviceAccess', accessibleServices);
router.get('/partner-initial-sidebar', partnerInitialAccessesibleServices)

//For Instant use
router.get("/services-mock", accessibleMockService)
router.get('/corporateCheckCashBack', partnerServicesCheckCashBack)
router.get('/fetch-initial-sidebar', fetchInitalCorporateUserConfiguartion)
// This services router is mounted twice (public `/service-access` and authed
// `/services`), so guard these admin writes with verifyToken directly.
router.put('/initial-service-permissions', verifyToken, requireSystemUser, updateInitialServicePermissions)
router.put('/partner-initial-sidebar', verifyToken, requireSystemUser, updatePartnerInitialAccessesibleServicesByApi)

module.exports = router