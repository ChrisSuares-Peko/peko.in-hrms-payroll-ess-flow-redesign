const router = require('express').Router({ mergeParams: true })
const { requirePermission } = require('../../../../middlewares/requirePermission')
const { PERMISSIONS: P } = require('../../../../utils/cardRoles')
const { verifyCorporateAdmin } = require('../../../../middlewares/verifyCorporateAdmin')
const { getWallet, getFundingAccount, listWalletTopUps } = require('../../../../controllers/corporate/cardWallet')

router.get('/', verifyCorporateAdmin, requirePermission(P.VIEW_WALLET), getWallet)
router.get('/funding-account', verifyCorporateAdmin, getFundingAccount)
router.get('/top-ups', verifyCorporateAdmin, listWalletTopUps)

module.exports = router
