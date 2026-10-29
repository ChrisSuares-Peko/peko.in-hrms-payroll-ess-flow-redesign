const express = require('express')
const { UpdateProjectWaba } = require('../../../../controllers/corporate/whatsAppForBusiness')
const router = express.Router({ mergeParams: true })


router.post('/project-waba-update', UpdateProjectWaba)


module.exports = router