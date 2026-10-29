const router = require('express').Router({ mergeParams: true })
const { requireAccountOwner } = require('../../../../middlewares/requireAccountOwner')
const { verifyCorporateAdmin } = require('../../../../middlewares/verifyCorporateAdmin')
const { validateAccountClosureRequest } = require('../../../../utils/validation/accountClosureApi')
const {
    getAccountClosureRequest,
    requestAccountClosure,
} = require('../../../../controllers/corporate/accountClosure')

router.get('/', verifyCorporateAdmin, requireAccountOwner, getAccountClosureRequest)
router.post(
    '/',
    verifyCorporateAdmin,
    requireAccountOwner,
    validateAccountClosureRequest,
    requestAccountClosure
)

module.exports = router
