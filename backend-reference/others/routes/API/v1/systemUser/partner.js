const express = require('express')
const { getDashboardDetails, getDashboardStatisticsData, getCloneFromPartnerDetails, getCloneToPartnerDetails, createClonePartner, getPackagesCashback } = require('../../../../controllers/admin/partner');
const { validateDashboardStatisticsQuery, validateGetPackagesCashbackQuery } = require('../../../../utils/queryValidation');
const router = express.Router()

router.get('/dashboardDetails', getDashboardDetails)
router.get("/dashboardStatistics", validateDashboardStatisticsQuery, getDashboardStatisticsData);

router.get('/clonePartnerFrom', getCloneFromPartnerDetails)
router.get('/clonePartnerTo', getCloneToPartnerDetails)
router.get("/getPackagesCashback", validateGetPackagesCashbackQuery, getPackagesCashback);
router.post('/clonePartner', createClonePartner)

module.exports = router