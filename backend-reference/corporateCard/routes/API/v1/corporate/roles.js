const router = require('express').Router({ mergeParams: true })
const { verifyCorporateAdmin } = require('../../../../middlewares/verifyCorporateAdmin')
const { listRoles } = require('../../../../controllers/corporate/cardRoleCatalogue')

router.get('/', verifyCorporateAdmin, listRoles)

module.exports = router
