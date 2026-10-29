const router = require('express').Router({ mergeParams: true })
const { verifyToken } = require('../../../../utils/jwtToken')
const { verifyUser } = require('../../../../middlewares/verifyCardService')

router.use(verifyToken)
router.use('/membership', require('./membershipRequest'))
router.use(verifyUser('Corporate Cards'))

const { requireActiveAccount } = require('../../../../middlewares/requireActiveAccount')

router.use('/kyc', require('./kyc'))
router.use('/cards', requireActiveAccount, require('./cards'))
router.use('/cardholders', requireActiveAccount, require('./cardholders'))
router.use('/requests', requireActiveAccount, require('./requests'))
router.use('/transactions', requireActiveAccount, require('./transactions'))
router.use('/account', require('./account'))
router.use('/dashboard', requireActiveAccount, require('./dashboard'))
router.use('/wallet', require('./wallet'))
router.use('/kyb-status', require('./kybStatus'))
router.use('/kyb-documents', require('./kybDocuments'))
router.use('/roles', require('./roles'))
router.use('/account-closure', require('./accountClosure'))
router.use('/settings', require('./settings'))

module.exports = router
