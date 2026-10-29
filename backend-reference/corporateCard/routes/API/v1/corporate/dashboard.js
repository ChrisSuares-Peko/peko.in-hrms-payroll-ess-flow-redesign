const router = require('express').Router({ mergeParams: true })
const { getDashboardSummary } = require('../../../../controllers/corporate/cardDashboard')

router.get('/summary', getDashboardSummary)

module.exports = router
